import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';

describe('useKeyboardShortcut', () => {
  it('fires on the bound key, case-insensitive', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('n', handler));

    fireEvent.keyDown(window, { key: 'N' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores the key while typing in a field', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('n', handler));
    const input = document.createElement('input');
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: 'n' });

    expect(handler).not.toHaveBeenCalled();
    input.remove();
  });

  it('fires inside fields when allowInInputs is set (POS function keys)', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('F2', handler, { allowInInputs: true }));
    const input = document.createElement('input');
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: 'F2' });

    expect(handler).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('ignores modifier combinations and disabled shortcuts', () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ enabled }) => useKeyboardShortcut('n', handler, { enabled }), {
      initialProps: { enabled: true }
    });

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    rerender({ enabled: false });
    fireEvent.keyDown(window, { key: 'n' });

    expect(handler).not.toHaveBeenCalled();
  });
});
