import { Check, Undo2 } from 'lucide-react'
import { ALL_CATEGORIES } from '../../constants/categories'
import { CATEGORY_COLORS, CATEGORY_LIGHT, CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/categoryColors'

// Full-screen category picker for the Map tab: 7 category cards + "Back to map".
// Cards toggle independently (multi-select); the map filters live behind it.
export default function MapFilterMenu({ activeCategories, onToggle, onClear, categoryCounts = {}, onClose }) {
  const cardClass = 'relative flex flex-col items-center justify-center gap-2 rounded-2xl transition-all'

  return (
    // Same centering as RedemptionScreen: stays inside the desktop phone panel
    // (App.css's --app-panel-width) instead of covering the whole window.
    <div
      className="fixed top-0 bottom-0 z-[1000] flex flex-col px-4 pt-4"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'var(--app-panel-width)',
        backgroundColor: '#f0f4f8',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0f172a' }}>Categories</h2>
        <button
          onClick={onClear}
          disabled={activeCategories.length === 0}
          className="text-sm font-semibold"
          style={{ fontFamily: 'Sora, sans-serif', color: activeCategories.length ? '#0170B9' : '#cbd5e1', background: 'none', border: 'none' }}
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 grid-rows-4 gap-3 flex-1 min-h-0">
        {ALL_CATEGORIES.map(cat => {
          const Icon = CATEGORY_ICON[cat]
          const color = CATEGORY_COLORS[cat]
          const isActive = activeCategories.includes(cat)
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              className={cardClass}
              style={{
                backgroundColor: isActive ? color : CATEGORY_LIGHT[cat],
                border: `2px solid ${isActive ? color : `${color}33`}`,
                boxShadow: isActive ? `0 4px 14px ${color}55` : 'none',
              }}
            >
              {isActive && (
                <span className="absolute top-2 right-2 flex items-center justify-center rounded-full" style={{ width: 22, height: 22, backgroundColor: 'white' }}>
                  <Check size={14} color={color} strokeWidth={3} />
                </span>
              )}
              <Icon size={30} color={isActive ? 'white' : color} />
              <span className="text-sm font-bold text-center leading-tight px-2" style={{ fontFamily: 'Sora, sans-serif', color: isActive ? 'white' : '#0f172a' }}>
                {CATEGORY_LABELS[cat]}
              </span>
              <span className="text-xs" style={{ color: isActive ? 'rgba(255,255,255,0.85)' : '#64748b' }}>
                {categoryCounts[cat] ?? 0} deals
              </span>
            </button>
          )
        })}

        <button
          onClick={onClose}
          className={cardClass}
          style={{ backgroundColor: 'white', border: '2px solid #e2e8f0' }}
        >
          <Undo2 size={28} color="#0170B9" />
          <span className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0170B9' }}>Back to map</span>
        </button>
      </div>
    </div>
  )
}
