import { ReactNode } from 'react';
import {
  sharedEyebrowClass,
  sharedPageHeaderBodyClass,
  sharedPageHeaderClass,
  sharedPageTitleClass,
  sharedSupportingTextClass
} from '@/shared/components/public-visual-system';

type PageTitleProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageTitle({ title, description, eyebrow, actions }: PageTitleProps) {
  return (
    <section className="space-y-1">
      <div className={sharedPageHeaderClass}>
        <div className={sharedPageHeaderBodyClass}>
          {eyebrow ? <p className={sharedEyebrowClass}>{eyebrow}</p> : null}
          <h1 className={eyebrow ? `mt-3 ${sharedPageTitleClass}` : sharedPageTitleClass}>{title}</h1>
          <p className={`mt-2 max-w-3xl ${sharedSupportingTextClass}`}>{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
