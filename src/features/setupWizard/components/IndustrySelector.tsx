import React, { memo } from 'react'
import type { Industry } from '../../../shared/types/industry'

type IndustrySelectorProps = {
  industries: Industry[]
  selectedId: number
  onSelect: (id: number) => void
}

type IndustryOptionProps = {
  id: number
  name: string
  selected: boolean
  onSelect: () => void
}

const IndustryOption = memo(function IndustryOption({ id, name, selected, onSelect }: IndustryOptionProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <button
      key={id}
      type="button"
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      className={`
        group relative flex items-center justify-center h-20 sm:h-auto sm:min-h-[52px] px-3 py-2 rounded-xl sm:rounded-lg border text-sm font-medium sm:font-normal transition-colors cursor-pointer
        ${selected
          ? 'border-primary bg-primary/5 text-primary shadow-xs'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        } focus:outline-none focus-visible:ring-1 focus-visible:ring-ring/30
      `}
    >
      <span className="text-center leading-tight select-none">{name}</span>
      {selected && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center">
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
})

const IndustrySelector = ({ industries, selectedId, onSelect }: IndustrySelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Select industry">
      {industries.map((industry) => (
        <IndustryOption
          key={industry.id}
          id={industry.id}
          name={industry.name}
          selected={selectedId === industry.id}
          onSelect={() => onSelect(industry.id)}
        />
      ))}
    </div>
  )
}

export default memo(IndustrySelector)


