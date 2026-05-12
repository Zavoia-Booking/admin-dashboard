import React from 'react';

export const modalScrim =
  'fixed inset-0 z-[300] bg-[oklch(15%_0.004_70/0.42)] backdrop-blur-[2px] ' +
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 ' +
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0';

// Cream warm surface in light mode (keeps the editorial accent from the
// SubscriptionBlocker reference); the app's canonical `--surface` in dark
// (matches billing/calendar cards). Default cursor on the panel so plain
// text/heading regions don't inherit a text-caret; interactive children
// (buttons, inputs) override locally.
const panelBase =
  'fixed left-1/2 top-1/2 z-[300] -translate-x-1/2 -translate-y-1/2 ' +
  'w-[calc(100%-2rem)] ' +
  'max-h-[calc(100dvh-2rem)] overflow-y-auto ' +
  'cursor-default select-text ' +
  'rounded-2xl bg-neutral-50 text-neutral-900 dark:bg-surface dark:text-foreground-1 ' +
  'p-6 sm:p-10 ' +
  'shadow-[0_24px_56px_oklch(15%_0.004_70/0.22),0_2px_8px_oklch(15%_0.004_70/0.10)] ' +
  'dark:shadow-[0_24px_56px_oklch(0%_0_0/0.55),0_2px_8px_oklch(0%_0_0/0.40)] ' +
  'focus:outline-none focus-visible:outline-none ' +
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 ' +
  'data-[state=open]:zoom-in-[0.97] data-[state=open]:duration-250 ' +
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 ' +
  'data-[state=closed]:zoom-out-[0.97]';

export const modalPanel = `${panelBase} max-w-[440px]`;
export const modalPanelLarge = `${panelBase} max-w-[520px]`;

export const modalEyebrow =
  'mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] ' +
  'text-primary-700 dark:text-primary-500';

export const modalTitleLarge =
  'm-0 text-[26px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] ' +
  'text-neutral-900 dark:text-foreground-1';

export const modalTitleCompact =
  'm-0 text-[20px] sm:text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] ' +
  'text-neutral-900 dark:text-foreground-1';

export const modalBody =
  'text-[15px] leading-[1.55] mt-4 text-neutral-700 dark:text-foreground-2 [text-wrap:pretty]';

export const modalBodyMuted =
  'text-[15px] leading-[1.55] text-neutral-500 dark:text-foreground-3 [text-wrap:pretty]';

export const modalHelperSmall =
  'text-[13px] leading-[1.5] text-neutral-500 dark:text-foreground-3 [text-wrap:pretty]';

export const modalFooterRow =
  'flex flex-col gap-3 border-t border-neutral-200 dark:border-border-subtle pt-5 ' +
  'sm:flex-row sm:items-center sm:justify-between sm:gap-3';

export const modalFooterRowRight =
  'flex flex-col-reverse gap-2 border-t border-neutral-200 dark:border-border-subtle pt-5 ' +
  'sm:flex-row sm:items-center sm:justify-end sm:gap-3';

export const modalGhost =
  'cursor-pointer appearance-none rounded-md border-0 bg-transparent px-3 py-2 ' +
  'text-[13px] font-medium text-neutral-600 dark:text-foreground-3 ' +
  'underline-offset-[3px] outline-none ' +
  'hover:underline hover:text-neutral-800 dark:hover:text-foreground-1 ' +
  'focus-visible:ring-2 focus-visible:ring-neutral-400/40';

export const modalSecondary =
  'cursor-pointer rounded-full ' +
  'border border-neutral-300 bg-neutral-50 dark:border-border-strong dark:bg-surface ' +
  'px-[22px] py-3 text-[14px] font-medium ' +
  'text-neutral-900 dark:text-foreground-1 ' +
  'outline-none transition-colors duration-150 ' +
  'hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-surface-hover dark:hover:border-foreground-3 ' +
  'focus-visible:ring-2 focus-visible:ring-primary-500/30 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const pillBase =
  'group inline-flex cursor-pointer items-center justify-center gap-2 ' +
  'rounded-full px-[22px] py-3 ' +
  'text-[14px] font-semibold tracking-[-0.005em] text-neutral-50 ' +
  'shadow-[inset_0_1px_0_oklch(100%_0_0/0.18),0_1px_2px_oklch(15%_0.004_70/0.18)] ' +
  'outline-none transition-[background,transform] duration-150 ' +
  'hover:-translate-y-[0.5px] active:translate-y-0 ' +
  'focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-surface ' +
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0';

export const modalPrimary =
  `${pillBase} bg-primary-500 hover:bg-primary-600 focus-visible:ring-primary-500/40`;

export const modalDestructive =
  `${pillBase} bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/40`;

export const ModalArrow: React.FC<{ className?: string }> = ({ className }) => (
  React.createElement('svg', {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    fill: 'none',
    className: `transition-transform duration-200 group-hover:translate-x-[2px] ${className ?? ''}`,
    'aria-hidden': true,
  },
    React.createElement('path', {
      d: 'M3 8h10M9 4l4 4-4 4',
      stroke: 'currentColor',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    })
  )
);
