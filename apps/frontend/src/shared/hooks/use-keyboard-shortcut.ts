'use client';

import { useEffect, useRef } from 'react';

type ShortcutOptions = {
  /** Fire even while the user is typing in an input (needed for F-keys in the POS). */
  allowInInputs?: boolean;
  /** Disable the shortcut without unmounting the component. */
  enabled?: boolean;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * Binds a single-key shortcut (e.g. "n", "/", "F2") on the window.
 * Ignored with Ctrl/Alt/Meta so browser shortcuts keep working, and ignored while
 * typing in form fields unless `allowInInputs` is set.
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  { allowInInputs = false, enabled = true }: ShortcutOptions = {}
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.defaultPrevented) return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (!allowInInputs && isTypingTarget(event.target)) return;
      event.preventDefault();
      handlerRef.current(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [allowInInputs, enabled, key]);
}
