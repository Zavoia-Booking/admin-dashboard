import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SlotSetter = (node: ReactNode | null) => void;

const HeaderRightSlotContext = createContext<{
  value: ReactNode | null;
  set: SlotSetter;
} | null>(null);

const HeaderTitleSlotContext = createContext<{
  value: ReactNode | null;
  set: SlotSetter;
} | null>(null);

export function HeaderRightSlotProvider({ children }: { children: ReactNode }) {
  const [value, set] = useState<ReactNode | null>(null);
  const [titleValue, setTitle] = useState<ReactNode | null>(null);
  return (
    <HeaderRightSlotContext.Provider value={{ value, set }}>
      <HeaderTitleSlotContext.Provider value={{ value: titleValue, set: setTitle }}>
        {children}
      </HeaderTitleSlotContext.Provider>
    </HeaderRightSlotContext.Provider>
  );
}

export function useHeaderRightSlotValue(): ReactNode | null {
  const ctx = useContext(HeaderRightSlotContext);
  return ctx?.value ?? null;
}

export function useHeaderTitleSlotValue(): ReactNode | null {
  const ctx = useContext(HeaderTitleSlotContext);
  return ctx?.value ?? null;
}

/** Renders nothing; writes `children` into the nearest HeaderRightSlotProvider
 *  so it can be projected into the AppLayout breadcrumb header's right side.
 *  Clears the slot on unmount. */
export function HeaderRightSlot({ children }: { children: ReactNode }) {
  const ctx = useContext(HeaderRightSlotContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.set(children);
    return () => ctx.set(null);
  }, [ctx, children]);
  return null;
}

/** Same projection pattern, but replaces the breadcrumb title area (mobile).
 *  Used by tabbed pages that host their tab switcher in the header row. */
export function HeaderTitleSlot({ children }: { children: ReactNode }) {
  const ctx = useContext(HeaderTitleSlotContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.set(children);
    return () => ctx.set(null);
  }, [ctx, children]);
  return null;
}
