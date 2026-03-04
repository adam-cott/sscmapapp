import { ALL_CATEGORIES } from '../../constants/categories'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/categoryColors'

export default function FilterPanel({ activeCategories, onToggle, onClear, compact = false }) {
  const allActive = activeCategories.length === 0

  const chips = [
    { key: 'all', label: 'All', icon: '✦', color: '#0170B9' },
    ...ALL_CATEGORIES.map(cat => ({
      key: cat,
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICON[cat],
      color: CATEGORY_COLORS[cat],
    })),
  ]

  return (
    <div className={`flex gap-1.5 ${compact ? 'overflow-x-auto' : 'flex-wrap'}`}
      style={{ scrollbarWidth: 'none' }}
    >
      {chips.map(({ key, label, icon, color }) => {
        const isActive = key === 'all' ? allActive : activeCategories.includes(key)
        return (
          <button
            key={key}
            onClick={key === 'all' ? onClear : () => onToggle(key)}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 transition-all"
            style={{
              fontFamily: 'Sora, sans-serif',
              backgroundColor: isActive ? color : 'transparent',
              color: isActive ? 'white' : '#64748b',
              border: `1.5px solid ${isActive ? color : '#e2e8f0'}`,
              letterSpacing: '0.01em',
            }}
          >
            <span style={{ fontSize: '10px' }}>{icon}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
