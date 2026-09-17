import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'
import SortControl from './SortControl'

export default function Sidebar({
  searchQuery,
  onSearchChange,
  activeCategories,
  onCategoryToggle,
  onClearFilters,
  sortBy,
  setSortBy,
  permissionDenied,
  geoLoading,
  hasCoords,
  onNearestRequest,
  categoryCounts,
}) {
  return (
    <div className="flex flex-col gap-2">
      <SearchBar value={searchQuery} onChange={onSearchChange} />
      <FilterPanel
        activeCategories={activeCategories}
        onToggle={onCategoryToggle}
        onClear={onClearFilters}
        categoryCounts={categoryCounts}
      />
      <SortControl
        sortBy={sortBy}
        setSortBy={setSortBy}
        permissionDenied={permissionDenied}
        geoLoading={geoLoading}
        hasCoords={hasCoords}
        onNearestRequest={onNearestRequest}
      />
    </div>
  )
}
