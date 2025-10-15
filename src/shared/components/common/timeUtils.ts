import type React from 'react';

export function handleListNavKey<T>(
  e: React.KeyboardEvent,
  value: T,
  values: T[],
  setValue: (next: T) => void,
  onClose: () => void
): void {
  switch (e.key) {
    case 'Enter':
      e.preventDefault();
      e.stopPropagation();
      setValue(value);
      break;
    case 'ArrowDown': {
      e.preventDefault();
      e.stopPropagation();
      const idx = values.indexOf(value);
      const next = values[Math.min(values.length - 1, Math.max(0, idx + 1))];
      if (next !== undefined) setValue(next);
      break;
    }
    case 'ArrowUp': {
      e.preventDefault();
      e.stopPropagation();
      const idx = values.indexOf(value);
      const prev = values[Math.max(0, Math.min(values.length - 1, idx - 1))];
      if (prev !== undefined) setValue(prev);
      break;
    }
    case 'Escape':
      e.preventDefault();
      e.stopPropagation();
      onClose();
      break;
    default:
      break;
  }
}

export function handlePeriodNavKey(
  e: React.KeyboardEvent,
  target: 'AM' | 'PM',
  setPeriod: (p: 'AM' | 'PM') => void,
  onClose: () => void
): void {
  switch (e.key) {
    case 'Enter':
      e.preventDefault();
      e.stopPropagation();
      setPeriod(target);
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      e.stopPropagation();
      setPeriod('AM');
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      e.stopPropagation();
      setPeriod('PM');
      break;
    case 'Escape':
      e.preventDefault();
      e.stopPropagation();
      onClose();
      break;
    default:
      break;
  }
}


