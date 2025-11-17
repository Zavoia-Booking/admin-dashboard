import React from 'react';

type Option = { value: string; label: string };

type SegmentedControlProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, className }) => {
  const count = Math.max(options.length, 1);
  const activeIndex = Math.max(0, options.findIndex(o => o.value === value));

  return (
    <div className={`relative inline-flex rounded-lg border bg-info-100 dark:bg-info-100 p-1 shadow-sm overflow-hidden ${className ?? ''}`} role="tablist" aria-orientation="horizontal">
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-md bg-black transition-[left,width] duration-200 ease-out"
        style={{
          top: '0.25rem',
          bottom: '0.25rem',
          left: `calc(${activeIndex} * (100% - 0.5rem) / ${count} + 0.25rem)`,
          width: `calc((100% - 0.5rem) / ${count})`,
        }}
      />
      {options.map((opt, idx) => {
        const isActive = opt.value === value || (value == null && idx === 0);
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`relative z-10 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer flex-1 whitespace-nowrap ${isActive ? 'text-white' : 'text-neutral-900 dark:text-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-900'}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;


