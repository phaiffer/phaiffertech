'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale } from '@/shared/i18n/formatters';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type { PetClient, PetProduct, PetServiceCatalog } from '@/shared/types/pet';

type POSPageProps = {
  showSubnav?: boolean;
};

type CartItem = {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
};

type PaymentMethod = 'pix' | 'cash' | 'credit' | 'debit' | 'transfer';

type SearchResult = Omit<CartItem, 'quantity'> & {
  code: string;
  stock?: number;
};

const MAX_RESULTS = 12;
// Backend page size limit (PageRequestDto: @Max(200)); larger sizes are rejected with 400.
const API_MAX_PAGE_SIZE = 200;

// Function keys select the payment method (Comanda v2 PDV).
const PAYMENT_SHORTCUTS: Array<{ method: PaymentMethod; key?: string }> = [
  { method: 'pix', key: 'F5' },
  { method: 'cash', key: 'F6' },
  { method: 'credit', key: 'F7' },
  { method: 'debit', key: 'F8' },
  { method: 'transfer' }
];

// Comanda v2 PDV: search + dense results on the left, current sale on the right,
// keyboard-first (F2 search, Enter adds, F4 discount, F5 to F8 payment, F9 finish).
// NOTE: checkout is still simulated (it was before the redesign): no invoice,
// payment or stock movement is recorded. See docs/design/comanda/GAPS.md.
export function POSPage({ showSubnav = false }: POSPageProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petPOS;
  const copy = useAppMessages().screens.petPos;
  const platform = useFrontendPlatform();

  const [products, setProducts] = useState<PetProduct[]>([]);
  const [services, setServices] = useState<PetServiceCatalog[]>([]);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<PetClient | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [discountInput, setDiscountInput] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadProducts = hasPermission('pet.product.read') || hasWorkspaceWidePetVisibility;
  const canReadServices = hasPermission('pet.service.read') || hasWorkspaceWidePetVisibility;
  const canReadClients = hasPermission('pet.client.read') || hasWorkspaceWidePetVisibility;

  useEffect(() => {
    let active = true;

    setLoading(true);

    Promise.allSettled([
      canReadProducts ? petService.listProducts(0, API_MAX_PAGE_SIZE, '') : Promise.resolve(null),
      canReadServices ? petService.listServices(0, API_MAX_PAGE_SIZE, '') : Promise.resolve(null),
      canReadClients ? petService.listClients(0, API_MAX_PAGE_SIZE, '') : Promise.resolve(null)
    ]).then((results) => {
      if (!active) return;

      const [productsResult, servicesResult, clientsResult] = results;
      setLoadError(results.some((result) => result.status === 'rejected'));

      if (productsResult.status === 'fulfilled' && productsResult.value) {
        setProducts(resolvePageItems(productsResult.value));
      }

      if (servicesResult.status === 'fulfilled' && servicesResult.value) {
        setServices(resolvePageItems(servicesResult.value));
      }

      if (clientsResult.status === 'fulfilled' && clientsResult.value) {
        setClients(resolvePageItems(clientsResult.value));
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [canReadClients, canReadProducts, canReadServices]);

  const results = useMemo<SearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (activeTab === 'products') {
      return products
        .filter((product) => !query
          || product.name.toLowerCase().includes(query)
          || product.sku?.toLowerCase().includes(query))
        .slice(0, MAX_RESULTS)
        .map((product) => ({
          id: product.id,
          type: 'product' as const,
          name: product.name,
          price: product.price,
          maxQuantity: product.currentQuantity,
          code: product.sku,
          stock: product.currentQuantity
        }));
    }

    return services
      .filter((service) => service.active && (!query || service.name.toLowerCase().includes(query)))
      .slice(0, MAX_RESULTS)
      .map((service) => ({
        id: service.id,
        type: 'service' as const,
        name: service.name,
        price: service.basePrice,
        code: copy.serviceCode
      }));
  }, [activeTab, copy.serviceCode, products, searchQuery, services]);

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return clients.slice(0, 10);
    const searchLower = clientSearchQuery.toLowerCase();
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchLower)
      || client.email?.toLowerCase().includes(searchLower)
      || client.phone?.includes(clientSearchQuery)
    );
  }, [clients, clientSearchQuery]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discount = Math.min(Math.max(Number(discountInput.replace(',', '.')) || 0, 0), subtotal);
  const total = subtotal - discount;

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.type === item.type);
      if (existing) {
        if (item.maxQuantity && existing.quantity >= item.maxQuantity) {
          return prev;
        }
        return prev.map((i) =>
          i.id === item.id && i.type === item.type ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, type: CartItem['type'], delta: number) => {
    setCart((prev) => prev
      .map((item) => {
        if (item.id !== id || item.type !== type) return item;
        const nextQuantity = item.quantity + delta;
        if (nextQuantity <= 0) return null;
        if (item.maxQuantity && nextQuantity > item.maxQuantity) return item;
        return { ...item, quantity: nextQuantity };
      })
      .filter((item): item is CartItem => item !== null));
  }, []);

  const removeFromCart = useCallback((id: string, type: CartItem['type']) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
  }, []);

  const resetSale = useCallback(() => {
    setCart([]);
    setSelectedClient(null);
    setDiscountInput('');
    setCheckoutSuccess(false);
    setShowCheckout(false);
  }, []);

  const openCheckout = useCallback(() => {
    if (cart.length > 0) setShowCheckout(true);
  }, [cart.length]);

  const confirmSale = useCallback(async () => {
    // Simulated, as before the redesign: nothing is persisted (see GAPS.md).
    setConfirming(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setConfirming(false);
    setCheckoutSuccess(true);
  }, []);

  const shortcutsEnabled = !showCheckout;
  useKeyboardShortcut('F2', () => searchRef.current?.focus(), { allowInInputs: true, enabled: shortcutsEnabled });
  useKeyboardShortcut('F4', () => discountRef.current?.focus(), { allowInInputs: true, enabled: shortcutsEnabled });
  useKeyboardShortcut('F5', () => setPaymentMethod('pix'), { allowInInputs: true, enabled: shortcutsEnabled });
  useKeyboardShortcut('F6', () => setPaymentMethod('cash'), { allowInInputs: true, enabled: shortcutsEnabled });
  useKeyboardShortcut('F7', () => setPaymentMethod('credit'), { allowInInputs: true, enabled: shortcutsEnabled });
  useKeyboardShortcut('F8', () => setPaymentMethod('debit'), { allowInInputs: true, enabled: shortcutsEnabled });
  useKeyboardShortcut('F9', openCheckout, { allowInInputs: true, enabled: shortcutsEnabled });

  if (!canReadProducts && !canReadServices) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  const money = (value: number) => formatCurrencyForLocale(locale, value);
  const tabs: Array<{ value: 'products' | 'services'; label: string; enabled: boolean }> = [
    { value: 'products', label: t.products.title, enabled: canReadProducts },
    { value: 'services', label: t.services.title, enabled: canReadServices }
  ];

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      {loadError ? <div className="ui-notice-error">{copy.loadError}</div> : null}

      <div className="grid gap-0 overflow-hidden rounded-md border border-[color:var(--line)] lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: search and results */}
        <div className="min-w-0 p-4 lg:p-5">
          <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)]">{copy.title}</h1>
            <span className="text-xs text-[var(--muted)]">{copy.shortcutsHint}</span>
          </header>

          <label className="ui-field-shell flex min-h-11 items-center gap-2 rounded-md border border-[var(--ink)] px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--ink)]" aria-hidden="true" />
            <span className="sr-only">{copy.searchLabel}</span>
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) {
                  event.preventDefault();
                  addToCart(results[0]);
                }
              }}
              placeholder={copy.searchLabel}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
            <kbd className="ui-kbd" aria-hidden="true">F2</kbd>
          </label>

          <div className="mt-3 flex gap-4 border-b border-[color:var(--line)]">
            {tabs.filter((tab) => tab.enabled).map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`-mb-px h-9 border-b-2 text-sm ${
                  activeTab === tab.value
                    ? 'border-[var(--ink)] font-semibold text-[var(--ink)]'
                    : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section aria-label={copy.resultsCount.replace('{n}', String(results.length))} className="mt-2">
            {loading ? (
              <p className="py-6 text-sm text-[var(--muted)]">{t.loading}</p>
            ) : results.length === 0 ? (
              <p className="py-6 text-sm text-[var(--muted)]">
                {activeTab === 'products' ? t.products.empty : t.services.empty}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[480px] grid-cols-[minmax(0,1fr)_110px_70px_100px] gap-3 border-b border-[color:var(--line)] bg-[var(--bg-row)] px-2 py-2 text-xs text-[var(--muted)]">
                  <span>{copy.resultsCount.replace('{n}', String(results.length))}</span>
                  <span>{copy.colCode}</span>
                  <span className="text-right">{copy.colStock}</span>
                  <span className="text-right">{copy.colPrice}</span>
                </div>
                {results.map((result, index) => {
                  const outOfStock = result.type === 'product' && (result.stock ?? 0) <= 0;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => addToCart(result)}
                      aria-label={copy.addItem.replace('{name}', result.name)}
                      className={`grid min-h-10 w-full min-w-[480px] grid-cols-[minmax(0,1fr)_110px_70px_100px] items-center gap-3 border-b border-[color:var(--line-soft)] px-2 text-left hover:bg-[var(--selected)] disabled:cursor-not-allowed disabled:text-[var(--faint)] ${
                        index === 0 && searchQuery ? 'bg-[var(--selected)]' : ''
                      }`}
                    >
                      <span className="truncate">{result.name}</span>
                      <span className="ui-mono truncate text-xs text-[var(--muted)]">{result.code}</span>
                      <span className={`ui-mono text-right text-sm ${outOfStock ? 'text-[var(--danger)]' : ''}`}>
                        {result.stock ?? ''}
                      </span>
                      <span className="ui-mono text-right text-sm">{money(result.price)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: current sale */}
        <aside aria-label={copy.currentSale} className="flex flex-col border-t border-[color:var(--line)] bg-[var(--bg-row)] lg:border-l lg:border-t-0">
          <header className="border-b border-[color:var(--line)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">{copy.currentSale}</h2>
            {selectedClient ? (
              <div className="mt-1 flex items-center justify-between gap-2 text-[13px]">
                <span className="truncate text-[var(--ink-2)]">{selectedClient.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="shrink-0 text-[var(--ink)] underline-offset-2 hover:underline"
                >
                  {copy.changeClient}
                </button>
              </div>
            ) : canReadClients ? (
              <div className="relative mt-2">
                <label className="sr-only" htmlFor="pos-client-search">{t.client.search}</label>
                <input
                  id="pos-client-search"
                  type="text"
                  value={clientSearchQuery}
                  onChange={(event) => {
                    setClientSearchQuery(event.target.value);
                    setShowClientSearch(true);
                  }}
                  onFocus={() => setShowClientSearch(true)}
                  placeholder={t.client.search}
                  className="ui-input-control"
                />
                {showClientSearch && filteredClients.length > 0 ? (
                  <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-[color:var(--line)] bg-[var(--bg)]">
                    {filteredClients.map((client) => (
                      <li key={client.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowClientSearch(false);
                            setClientSearchQuery('');
                          }}
                          className="flex min-h-10 w-full flex-col justify-center px-3 py-1.5 text-left hover:bg-[var(--selected)]"
                        >
                          <span className="text-sm text-[var(--ink)]">{client.name}</span>
                          <span className="text-xs text-[var(--muted)]">{client.email ?? client.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="mt-1 text-[13px] text-[var(--muted)]">{copy.noClient}</p>
            )}
          </header>

          <div className="min-h-[120px] flex-1 overflow-y-auto px-4 py-2">
            {cart.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-[var(--ink-2)]">{t.cart.empty}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{t.cart.emptyDescription}</p>
              </div>
            ) : (
              <ol>
                {cart.map((item, index) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-2 border-b border-[color:var(--line-soft)] py-2"
                  >
                    <span className="ui-mono pt-0.5 text-xs text-[var(--muted)]">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--ink)]">{item.name}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.type, -1)}
                          aria-label={copy.decrease.replace('{name}', item.name)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[color:var(--control)] bg-[var(--bg)] hover:bg-[var(--selected)]"
                        >
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <span className="ui-mono w-7 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.type, 1)}
                          disabled={Boolean(item.maxQuantity) && item.quantity >= (item.maxQuantity ?? 0)}
                          aria-label={copy.increase.replace('{name}', item.name)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[color:var(--control)] bg-[var(--bg)] hover:bg-[var(--selected)] disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.type)}
                          aria-label={copy.remove.replace('{name}', item.name)}
                          className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded text-[var(--muted)] hover:text-[var(--danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <span className="ui-mono pt-0.5 text-sm">{money(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <dl className="border-t border-[color:var(--line)] px-4 py-2 text-sm">
            <div className="flex justify-between py-1">
              <dt className="text-[var(--ink-2)]">{t.cart.subtotal}</dt>
              <dd className="ui-mono">{money(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-1">
              <dt>
                <label htmlFor="pos-discount" className="text-[var(--ink-2)]">
                  {copy.discount} <kbd className="ui-kbd" aria-hidden="true">F4</kbd>
                </label>
              </dt>
              <dd>
                <input
                  id="pos-discount"
                  ref={discountRef}
                  inputMode="decimal"
                  value={discountInput}
                  onChange={(event) => setDiscountInput(event.target.value.replace(/[^0-9.,]/g, ''))}
                  aria-label={copy.discountLabel}
                  aria-keyshortcuts="F4"
                  placeholder="0,00"
                  className="ui-mono h-8 w-24 rounded border border-[color:var(--control)] bg-[var(--bg)] px-2 text-right text-sm"
                />
              </dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-[var(--ink)] pt-2 text-base font-semibold">
              <dt>{t.cart.total}</dt>
              <dd className="ui-mono">{money(total)}</dd>
            </div>
          </dl>

          <fieldset className="border-t border-[color:var(--line)] px-4 py-3">
            <legend className="mb-2 text-xs text-[var(--muted)]">{t.payment.method}</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_SHORTCUTS.map(({ method, key }) => (
                <label
                  key={method}
                  className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm ${
                    paymentMethod === method
                      ? 'border-[var(--ink)] bg-[var(--bg)] font-semibold text-[var(--ink)]'
                      : 'border-[color:var(--control)] bg-[var(--bg)] text-[var(--ink-2)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="pos-payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="accent-[var(--ink)]"
                  />
                  <span className="flex-1">{t.payment.methods[method]}</span>
                  {key ? <kbd className="ui-kbd" aria-hidden="true">{key}</kbd> : null}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="border-t border-[color:var(--line)] px-4 py-3">
            <button
              type="button"
              onClick={openCheckout}
              disabled={cart.length === 0}
              aria-keyshortcuts="F9"
              className="ui-primary-button ui-critical-button w-full"
            >
              {copy.finalize}
              <kbd className="ui-kbd" aria-hidden="true">F9</kbd>
            </button>
            <div className="mt-2 flex items-center justify-between gap-2 text-[13px]">
              <span className="text-[var(--muted)]">{copy.simulatedNotice}</span>
              {cart.length > 0 ? (
                <button type="button" onClick={resetSale} className="shrink-0 text-[var(--danger)] underline-offset-2 hover:underline">
                  {copy.cancelSale}
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {showCheckout ? (
        <div className="ui-dialog-overlay fixed inset-0 z-50 flex items-center justify-center px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="pos-checkout-title" className="ui-dialog-panel w-full max-w-sm p-5">
            {checkoutSuccess ? (
              <>
                <h2 id="pos-checkout-title" className="text-base font-semibold text-[var(--ink)]">{t.checkout.success}</h2>
                <p className="ui-mono mt-1 text-sm text-[var(--ink-2)]">{money(total)}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">{copy.simulatedNotice}</p>
                <button type="button" onClick={resetSale} className="ui-primary-button mt-4 w-full">
                  {t.actions.newSale}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 id="pos-checkout-title" className="text-base font-semibold text-[var(--ink)]">{copy.confirmTitle}</h2>
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    aria-label={copy.back}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--selected)]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <dl className="mt-3 text-sm">
                  <div className="flex justify-between py-1">
                    <dt className="text-[var(--ink-2)]">{cart.length} {t.cart.items}</dt>
                    <dd className="ui-mono font-semibold">{money(total)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-[var(--ink-2)]">{t.payment.method}</dt>
                    <dd>{t.payment.methods[paymentMethod]}</dd>
                  </div>
                  {selectedClient ? (
                    <div className="flex justify-between py-1">
                      <dt className="text-[var(--ink-2)]">{t.client.title}</dt>
                      <dd className="truncate">{selectedClient.name}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowCheckout(false)} className="ui-secondary-button flex-1">
                    {copy.back}
                  </button>
                  <button type="button" onClick={confirmSale} disabled={confirming} className="ui-primary-button flex-1">
                    {copy.confirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
