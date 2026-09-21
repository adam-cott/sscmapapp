import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'

export default function Sidebar({
  searchQuery,
  onSearchChange,
  activeCategories,
  onCategoryToggle,
  onClearFilters,
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
    </div>
  )
}
