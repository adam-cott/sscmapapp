import { useState } from 'react'
import { createPortal } from 'react-dom'
import { LocateFixed, SlidersHorizontal } from 'lucide-react'
import SearchBar from './SearchBar'
import MapFilterMenu from './MapFilterMenu'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/categoryColors'

const BLUE = '#0170B9'

function PillButton({ onClick, active, color = BLUE, children }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-full py-2 transition-all"
      style={{
        fontFamily: 'Sora, sans-serif',
        backgroundColor: active ? color : 'white',
        color: active ? 'white' : '#334155',
        border: `1.5px solid ${active ? color : '#e2e8f0'}`,
      }}
    >
      {children}
    </button>
  )
}

export default function Sidebar({
  searchQuery,
  onSearchChange,
  activeCategories,
  onCategoryToggle,
  onClearFilters,
  categoryCounts,
  nearMe,
  nearMeLoading,
  nearMeMessage,
  onNearMeToggle,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const single = activeCategories.length === 1 ? activeCategories[0] : null
  const filterLabel = single ? CATEGORY_LABELS[single] : activeCategories.length ? `Filter · ${activeCategories.length}` : 'Filter'

  return (
    <div className="flex flex-col gap-2">
      <SearchBar value={searchQuery} onChange={onSearchChange} />
      <div className="flex gap-2">
        <PillButton onClick={onNearMeToggle} active={nearMe}>
          <LocateFixed size={15} />
          {nearMeLoading ? 'Locating…' : 'Near Me'}
        </PillButton>
        <PillButton onClick={() => setMenuOpen(true)} active={activeCategories.length > 0} color={single ? CATEGORY_COLORS[single] : BLUE}>
          <SlidersHorizontal size={15} />
          {filterLabel}
        </PillButton>
      </div>
      {nearMeMessage && (
        <p className="text-xs text-center" style={{ color: '#b45309' }}>Turn on location to use Near Me</p>
      )}
      {/* Portaled to <body>: this bar's z-[500] stacking context would otherwise
          trap the menu under the z-[600] bottom nav. */}
      {menuOpen && createPortal(
        <MapFilterMenu
          activeCategories={activeCategories}
          onToggle={onCategoryToggle}
          onClear={onClearFilters}
          categoryCounts={categoryCounts}
          onClose={() => setMenuOpen(false)}
        />,
        document.body,
      )}
    </div>
  )
}
