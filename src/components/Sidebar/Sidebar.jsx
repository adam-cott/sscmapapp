import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'
import SortControl from './SortControl'

export default function Sidebar({
  searchQuery,
  onSearchChange,
  activeCategories,
  onCategoryToggle,
  onClearFilters,
  dealCount,
  sortBy,
  setSortBy,
  permissionDenied,
  geoLoading,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <SearchBar value={searchQuery} onChange={onSearchChange} />
        <FilterPanel
          activeCategories={activeCategories}
          onToggle={onCategoryToggle}
          onClear={onClearFilters}
          compact
        />
        <SortControl
          sortBy={sortBy}
          setSortBy={setSortBy}
          permissionDenied={permissionDenied}
          geoLoading={geoLoading}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ borderBottom: '1px solid #f1f5f9' }}>
      {/* Search */}
      <div className="px-4 pt-4 pb-3">
        <SearchBar value={searchQuery} onChange={onSearchChange} />
      </div>

      {/* Filters */}
      <div className="px-4 pb-3">
        <div
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: '#94a3b8', fontFamily: 'Sora, sans-serif', fontSize: '10px' }}
        >
          Categories
        </div>
        <FilterPanel
          activeCategories={activeCategories}
          onToggle={onCategoryToggle}
          onClear={onClearFilters}
        />
      </div>

      {/* Sort */}
      <div className="px-4 pb-4">
        <div
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: '#94a3b8', fontFamily: 'Sora, sans-serif', fontSize: '10px' }}
        >
          Sort by
        </div>
        <SortControl
          sortBy={sortBy}
          setSortBy={setSortBy}
          permissionDenied={permissionDenied}
          geoLoading={geoLoading}
        />
      </div>

      {/* Count strip */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}
      >
        <span className="text-xs" style={{ color: '#94a3b8', fontFamily: 'Sora, sans-serif' }}>
          Showing
        </span>
        <span
          className="text-xs font-bold"
          style={{ color: '#0170B9', fontFamily: 'Sora, sans-serif' }}
        >
          {dealCount} deal{dealCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
