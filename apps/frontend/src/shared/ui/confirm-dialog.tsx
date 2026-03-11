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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--tenant-primary-soft)] px-[var(--space-4)]">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-[color:var(--surface-1)] p-[var(--space-5)] shadow-card">
        <h3 className="text-[length:var(--font-size-md)] font-semibold text-[color:var(--app-shell-heading)]">{title}</h3>
        {description ? <div className="mt-[var(--space-2)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]">{description}</div> : null}

        <div className="mt-[var(--space-5)] flex justify-end gap-[var(--space-2)]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--radius-md)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-medium text-[color:var(--app-shell-text)] transition duration-200 hover:shadow-card"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-medium text-[color:var(--surface-1)] transition duration-200 hover:shadow-card"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
