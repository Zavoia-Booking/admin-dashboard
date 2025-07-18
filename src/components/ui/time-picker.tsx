import React, { useState, useRef, useEffect } from "react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function formatTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}` + ` ${ampm}`;
}

function getAllTimes(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m++) {
      times.push(formatTime(h, m));
    }
  }
  return times;
}

const ALL_TIMES = getAllTimes();

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Scroll to selected time when opening
  useEffect(() => {
    if (open && inputRef.current) {
      const idx = ALL_TIMES.findIndex((t) => t === value);
      const dropdown = ref.current?.querySelector(".tp-dropdown");
      if (dropdown && idx >= 0) {
        const item = dropdown.children[idx] as HTMLElement;
        if (item) item.scrollIntoView({ block: "center" });
      }
    }
  }, [open, value]);

  return (
    <div ref={ref} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        readOnly
        className={
          className ||
          "h-9 px-2 text-sm border border-input rounded-md focus:ring-1 focus:ring-primary cursor-pointer bg-white"
        }
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
      />
      {open && (
        <div className="tp-dropdown absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg">
          {ALL_TIMES.map((t) => (
            <div
              key={t}
              className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 ${
                t === value ? "bg-primary/10 font-semibold" : ""
              }`}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              role="option"
              aria-selected={t === value}
              tabIndex={-1}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 