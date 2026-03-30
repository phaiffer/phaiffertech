'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  Package,
  Scissors,
  X,
  Check,
  Receipt
} from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
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

type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'transfer';

function POSStatCard({
  label,
  value,
  icon,
  tone = 'default'
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: 'default' | 'accent';
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      tone === 'accent'
        ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] text-white shadow-[0_16px_32px_-20px_rgba(16,185,129,0.45)]'
        : 'border-slate-200/80 bg-white shadow-[0_8px_24px_-16px_rgba(15,23,42,0.08)]'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
          tone === 'accent' ? 'bg-white/15' : 'bg-slate-100'
        }`}>
          {icon}
        </span>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${
            tone === 'accent' ? 'text-white/70' : 'text-slate-500'
          }`}>
            {label}
          </p>
          <p className={`text-lg font-bold tracking-tight ${
            tone === 'accent' ? 'text-white' : 'text-slate-900'
          }`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  locale
}: {
  product: PetProduct;
  onAdd: () => void;
  locale: string;
}) {
  const t = useAppMessages().petPOS;
  const isLowStock = product.currentQuantity <= product.reorderPoint;
  const isOutOfStock = product.currentQuantity <= 0;

  return (
    <div className={`group relative rounded-2xl border p-4 transition-all ${
      isOutOfStock
        ? 'border-slate-200 bg-slate-50 opacity-60'
        : 'border-slate-200/80 bg-white hover:border-[color:var(--accent)]/30 hover:shadow-[0_8px_24px_-16px_rgba(16,185,129,0.2)]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <Package className="h-6 w-6 text-slate-600" />
        </div>
        {isOutOfStock ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {t.products.outOfStock}
          </span>
        ) : isLowStock ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {t.products.lowStock}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {t.products.inStock}: {product.currentQuantity} {product.unitOfMeasure}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-bold text-slate-900">
          {formatCurrencyForLocale(locale, product.price)}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={isOutOfStock}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent)] text-white shadow-sm transition-all hover:scale-105 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  onAdd,
  locale
}: {
  service: PetServiceCatalog;
  onAdd: () => void;
  locale: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-[color:var(--accent)]/30 hover:shadow-[0_8px_24px_-16px_rgba(16,185,129,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
          <Scissors className="h-6 w-6 text-[color:var(--accent)]" />
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {service.durationMinutes} min
        </span>
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-slate-900">{service.name}</h3>
        {service.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{service.description}</p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-bold text-slate-900">
          {formatCurrencyForLocale(locale, service.price)}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent)] text-white shadow-sm transition-all hover:scale-105 hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  locale
}: {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  locale: string;
}) {
  const canIncrease = !item.maxQuantity || item.quantity < item.maxQuantity;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
        {item.type === 'product' ? (
          <Package className="h-5 w-5 text-slate-600" />
        ) : (
          <Scissors className="h-5 w-5 text-[color:var(--accent)]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">
          {formatCurrencyForLocale(locale, item.price)} cada
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-slate-900">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={!canIncrease}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="w-20 text-right text-sm font-semibold text-slate-900">
        {formatCurrencyForLocale(locale, item.price * item.quantity)}
      </p>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function PaymentMethodButton({
  method,
  label,
  icon,
  selected,
  onClick
}: {
  method: PaymentMethod;
  label: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
        selected
          ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5 text-[color:var(--accent)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function POSPage({ showSubnav = false }: POSPageProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petPOS;
  const platform = useFrontendPlatform();

  const [products, setProducts] = useState<PetProduct[]>([]);
  const [services, setServices] = useState<PetServiceCatalog[]>([]);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<PetClient | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadProducts = hasPermission('pet.product.read') || hasWorkspaceWidePetVisibility;
  const canReadServices = hasPermission('pet.service.read') || hasWorkspaceWidePetVisibility;
  const canReadClients = hasPermission('pet.client.read') || hasWorkspaceWidePetVisibility;
  const canCreateInvoices = hasPermission('pet.invoice.write') || hasWorkspaceWidePetVisibility;

  useEffect(() => {
    let active = true;

    setLoading(true);

    Promise.allSettled([
      canReadProducts ? petService.listProducts(0, 500, '') : Promise.resolve(null),
      canReadServices ? petService.listServices(0, 200, '') : Promise.resolve(null),
      canReadClients ? petService.listClients(0, 500, '') : Promise.resolve(null)
    ]).then((results) => {
      if (!active) return;

      const [productsResult, servicesResult, clientsResult] = results;

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

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      return !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [services, searchQuery]);

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return clients.slice(0, 10);
    return clients.filter((c) => {
      const searchLower = clientSearchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(clientSearchQuery)
      );
    });
  }, [clients, clientSearchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

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

  const updateQuantity = useCallback((id: string, type: 'product' | 'service', delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id && item.type === type) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (item.maxQuantity && newQty > item.maxQuantity) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const removeFromCart = useCallback((id: string, type: 'product' | 'service') => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedClient(null);
    setCheckoutSuccess(false);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;

    setShowCheckout(true);
  }, [cart]);

  const confirmSale = useCallback(async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCheckoutSuccess(true);
  }, []);

  if (!canReadProducts && !canReadServices) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <POSStatCard
          label={t.stats.todaySales}
          value="12"
          icon={<ShoppingCart className="h-5 w-5 text-white" />}
          tone="accent"
        />
        <POSStatCard
          label={t.stats.todayRevenue}
          value={formatCurrencyForLocale(locale, 2456.9)}
          icon={<Banknote className="h-5 w-5 text-slate-600" />}
        />
        <POSStatCard
          label={t.stats.avgTicket}
          value={formatCurrencyForLocale(locale, 204.74)}
          icon={<Receipt className="h-5 w-5 text-slate-600" />}
        />
        <POSStatCard
          label={t.stats.itemsSold}
          value="34"
          icon={<Package className="h-5 w-5 text-slate-600" />}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Products/Services Grid */}
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'products' ? t.products.search : 'Buscar servico...'}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
              />
            </div>

            {activeTab === 'products' && categories.length > 0 ? (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20"
              >
                <option value="">{t.products.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : null}

            {/* Tab Switcher */}
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.products.title}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'services'
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.services.title}
              </button>
            </div>
          </div>

          {/* Product/Service Grid */}
          {loading ? (
            <div className="ui-notice-neutral">{t.loading}</div>
          ) : activeTab === 'products' ? (
            filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">{t.products.empty}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    onAdd={() =>
                      addToCart({
                        id: product.id,
                        type: 'product',
                        name: product.name,
                        price: product.price,
                        maxQuantity: product.currentQuantity
                      })
                    }
                  />
                ))}
              </div>
            )
          ) : filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <Scissors className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">{t.services.empty}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  locale={locale}
                  onAdd={() =>
                    addToCart({
                      id: service.id,
                      type: 'service',
                      name: service.name,
                      price: service.price
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart Panel */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.12)]">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-slate-600" />
                <h2 className="font-semibold text-slate-900">{t.cart.title}</h2>
                {cartItemCount > 0 ? (
                  <span className="rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-xs font-semibold text-white">
                    {cartItemCount}
                  </span>
                ) : null}
              </div>
              {cart.length > 0 ? (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {t.actions.clearCart}
                </button>
              ) : null}
            </div>

            {/* Client Selection */}
            <div className="border-b border-slate-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t.client.title}
              </p>
              {selectedClient ? (
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent)]/10">
                      <User className="h-4 w-4 text-[color:var(--accent)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{selectedClient.name}</p>
                      <p className="text-xs text-slate-500">{selectedClient.email ?? selectedClient.phone}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClient(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value);
                      setShowClientSearch(true);
                    }}
                    onFocus={() => setShowClientSearch(true)}
                    placeholder={t.client.search}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-[color:var(--accent)] focus:bg-white focus:outline-none"
                  />
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  {showClientSearch && filteredClients.length > 0 ? (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowClientSearch(false);
                            setClientSearchQuery('');
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{client.name}</p>
                            <p className="text-xs text-slate-500">{client.email ?? client.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="max-h-[300px] overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">{t.cart.empty}</p>
                  <p className="mt-1 text-xs text-slate-400">{t.cart.emptyDescription}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <CartItemRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      locale={locale}
                      onIncrease={() => updateQuantity(item.id, item.type, 1)}
                      onDecrease={() => updateQuantity(item.id, item.type, -1)}
                      onRemove={() => removeFromCart(item.id, item.type)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 ? (
              <div className="border-t border-slate-100 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-slate-600">{t.cart.subtotal}</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatCurrencyForLocale(locale, cartTotal)}
                  </span>
                </div>
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-base font-semibold text-slate-900">{t.cart.total}</span>
                  <span className="text-xl font-bold text-[color:var(--accent)]">
                    {formatCurrencyForLocale(locale, cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(16,185,129,0.5)] transition-all hover:shadow-[0_16px_36px_-12px_rgba(16,185,129,0.6)]"
                >
                  {t.actions.checkout}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {checkoutSuccess ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t.checkout.success}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Total: {formatCurrencyForLocale(locale, cartTotal)}
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckout(false);
                      clearCart();
                    }}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t.actions.newSale}
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--accent)] py-3 text-sm font-medium text-white"
                  >
                    <Receipt className="h-4 w-4" />
                    {t.checkout.printReceipt}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{t.checkout.title}</h3>
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{cart.length} {t.cart.items}</span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrencyForLocale(locale, cartTotal)}
                    </span>
                  </div>
                  {selectedClient ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {t.client.selected}: {selectedClient.name}
                    </p>
                  ) : null}
                </div>

                <div className="mb-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.payment.method}
                  </p>
                  <div className="flex gap-2">
                    <PaymentMethodButton
                      method="pix"
                      label={t.payment.methods.pix}
                      icon={<Smartphone className="h-5 w-5" />}
                      selected={paymentMethod === 'pix'}
                      onClick={() => setPaymentMethod('pix')}
                    />
                    <PaymentMethodButton
                      method="cash"
                      label={t.payment.methods.cash}
                      icon={<Banknote className="h-5 w-5" />}
                      selected={paymentMethod === 'cash'}
                      onClick={() => setPaymentMethod('cash')}
                    />
                    <PaymentMethodButton
                      method="credit"
                      label={t.payment.methods.credit}
                      icon={<CreditCard className="h-5 w-5" />}
                      selected={paymentMethod === 'credit'}
                      onClick={() => setPaymentMethod('credit')}
                    />
                    <PaymentMethodButton
                      method="debit"
                      label={t.payment.methods.debit}
                      icon={<CreditCard className="h-5 w-5" />}
                      selected={paymentMethod === 'debit'}
                      onClick={() => setPaymentMethod('debit')}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={confirmSale}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(16,185,129,0.5)]"
                >
                  {t.checkout.confirm}
                  <Check className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
