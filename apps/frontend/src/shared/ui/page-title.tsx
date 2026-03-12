import { sharedPageTitleClass, sharedSupportingTextClass } from '@/shared/components/public-visual-system';

export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h1 className={sharedPageTitleClass}>{title}</h1>
      <p className={`mt-2 max-w-3xl ${sharedSupportingTextClass}`}>{description}</p>
    </div>
  );
}
