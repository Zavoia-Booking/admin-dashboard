import { useEffect, useRef, useState } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";
import { LocationImage } from "./LocationImage";

/** Crossfading featured photo — the outgoing image stays beneath while the new one fades/zooms in over it. */
export function StagePhoto({ src, alt }: { src: string; alt: string }) {
  const keyRef = useRef(0);
  const [stack, setStack] = useState<{ src: string; k: number }[]>(() => [{ src, k: 0 }]);
  useEffect(() => {
    setStack((s) => {
      if (s[s.length - 1].src === src) return s;
      keyRef.current += 1;
      return [...s.slice(-1), { src, k: keyRef.current }]; // keep prev (under) + new (over)
    });
  }, [src]);
  useEffect(() => {
    if (stack.length < 2) return;
    const id = setTimeout(() => setStack((s) => s.slice(-1)), 900);
    return () => clearTimeout(id);
  }, [stack]);
  return (
    <div className="absolute inset-0">
      {stack.map((it, i) => (
        <LocationImage
          key={it.k}
          src={it.src}
          alt={i === stack.length - 1 ? alt : ""}
          fallbackLabel={i === stack.length - 1 ? alt : ""}
          className={cn("absolute inset-0 h-full w-full object-cover", i === stack.length - 1 && "mc-locx-img")}
        />
      ))}
    </div>
  );
}
