'use client';

import { ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="ui-dialog-overlay fixed inset-0 z-50 flex items-center justify-center px-[var(--space-4)]">
      <div className="ui-dialog-panel w-full max-w-md p-[var(--space-5)]">
        <h3 className="text-[length:var(--font-size-md)] font-semibold text-[color:var(--app-shell-heading)]">{title}</h3>
        {description ? (
          <div className="mt-[var(--space-2)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]">
            {description}
          </div>
        ) : null}

        <div className="mt-[var(--space-5)] flex flex-col-reverse gap-[var(--space-2)] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="ui-secondary-button"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="ui-danger-button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
