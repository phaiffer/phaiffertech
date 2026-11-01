import { ReactNode } from 'react';
import {
  sharedPageHeaderBodyClass,
  sharedPageHeaderClass,
  sharedPageTitleClass,
  sharedSupportingTextClass
} from '@/shared/components/public-visual-system';

type PageTitleProps = {
  title: string;
  description: string;
  /** @deprecated Comanda v2 has no eyebrows; the value is ignored. */
  eyebrow?: string;
  /** Optional count shown in mono next to the title (e.g. number of records). */
  count?: ReactNode;
  actions?: ReactNode;
};

// Comanda v2 page header: H1 20px/600 + optional mono count, short description,
// actions aligned to the right.
export function PageTitle({ title, description, count, actions }: PageTitleProps) {
  return (
    <section>
      <div className={sharedPageHeaderClass}>
        <div className={sharedPageHeaderBodyClass}>
          <div className="flex items-baseline gap-2.5">
            <h1 className={sharedPageTitleClass}>{title}</h1>
            {count !== undefined && count !== null ? (
              <span className="ui-mono text-sm text-slate-600">{count}</span>
            ) : null}
          </div>
          {description ? (
            <p className={`mt-1 line-clamp-2 ${sharedSupportingTextClass}`}>{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
