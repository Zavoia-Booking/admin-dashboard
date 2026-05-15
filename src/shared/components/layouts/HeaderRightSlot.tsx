import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SlotSetter = (node: ReactNode | null) => void;

const HeaderRightSlotContext = createContext<{
  value: ReactNode | null;
  set: SlotSetter;
} | null>(null);

export function HeaderRightSlotProvider({ children }: { children: ReactNode }) {
  const [value, set] = useState<ReactNode | null>(null);
  return (
    <HeaderRightSlotContext.Provider value={{ value, set }}>
      {children}
    </HeaderRightSlotContext.Provider>
  );
}

export function useHeaderRightSlotValue(): ReactNode | null {
  const ctx = useContext(HeaderRightSlotContext);
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
