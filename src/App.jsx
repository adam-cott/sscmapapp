import { useState } from 'react'
import './App.css'
import dealsData from './data/deals.json'
import { useDeals } from './hooks/useDeals'
import { useFilters } from './hooks/useFilters'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import MapView from './components/Map/MapView'
import ListView from './components/ListView/ListView'
import DealModal from './components/Modal/DealModal'
import BottomSheet from './components/BottomSheet/BottomSheet'
import LocationPicker from './components/LocationPicker/LocationPicker'

export default function App() {
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [activeView, setActiveView] = useState('map')

  const { dealsWithUsage, usageMap, recordUse, resetAll } = useDeals(dealsData)

  const {
    searchQuery,
    setSearchQuery,
    activeCategories,
    toggleCategory,
    clearFilters,
    filteredDeals,
  } = useFilters(dealsWithUsage)

  const handleReset = () => {
    if (window.confirm('Clear all deal usage history? This cannot be undone.')) {
      resetAll()
      setSelectedDeal(null)
    }
  }

  const handleUse = (dealId) => {
    recordUse(dealId)
    // Update selectedDeal reference so modal reflects new usage immediately
    setSelectedDeal(prev => {
      if (!prev) return null
      const updated = dealsWithUsage.find(d => d.id === dealId)
      if (!updated) return prev
      const newUsedCount = (usageMap[dealId] ?? 0) + 1
      const isUnlimited = updated.deal.maxUses === null
      const newRemaining = isUnlimited ? null : Math.max(0, updated.deal.maxUses - newUsedCount)
      return {
        ...updated,
        usage: {
          usedCount: newUsedCount,
          remaining: newRemaining,
          status: (!isUnlimited && newRemaining === 0) ? 'exhausted' : 'partial',
        },
      }
    })
  }

  const handleSelectDeal = (deal) => {
    setSelectedDeal(deal)
  }

  const handleSelectLocation = (location) => {
    setSelectedLocation(location)
  }

  const handleSelectFromPicker = (deal) => {
    setSelectedLocation(null)
    setSelectedDeal(deal)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>
      <Header
        activeView={activeView}
        onViewToggle={() => setActiveView(v => v === 'map' ? 'list' : 'map')}
        onReset={handleReset}
        filteredCount={filteredDeals.length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col flex-shrink-0" style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e8edf3' }}>
          <Sidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategories={activeCategories}
            onCategoryToggle={toggleCategory}
            onClearFilters={clearFilters}
            dealCount={filteredDeals.length}
          />
          {/* Desktop list view in sidebar */}
          <div className="flex-1 overflow-y-auto">
            <ListView deals={filteredDeals} onSelectDeal={handleSelectDeal} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 relative overflow-hidden">
          {/* Map view */}
          <div className={`absolute inset-0 ${activeView === 'map' ? 'block' : 'hidden md:block'}`}>
            <MapView
              deals={filteredDeals}
              selectedDeal={selectedDeal}
              onSelectDeal={handleSelectDeal}
              onSelectLocation={handleSelectLocation}
              usageMap={usageMap}
            />
          </div>

          {/* Mobile list view */}
          <div className={`absolute inset-0 overflow-y-auto ${activeView === 'list' ? 'block' : 'hidden'} md:hidden`}>
            {/* Mobile compact filter bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
              <Sidebar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeCategories={activeCategories}
                onCategoryToggle={toggleCategory}
                onClearFilters={clearFilters}
                dealCount={filteredDeals.length}
                compact
              />
            </div>
            <ListView deals={filteredDeals} onSelectDeal={handleSelectDeal} />
          </div>

          {/* Mobile compact filter bar overlay on map */}
          {activeView === 'map' && (
            <div className="md:hidden absolute top-0 left-0 right-0 z-[500] bg-white border-b border-gray-100 px-3 py-2 shadow-sm">
              <Sidebar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeCategories={activeCategories}
                onCategoryToggle={toggleCategory}
                onClearFilters={clearFilters}
                dealCount={filteredDeals.length}
                compact
              />
            </div>
          )}
        </main>
      </div>

      {/* Deal detail — desktop modal */}
      {selectedDeal && (
        <div className="hidden md:block">
          <DealModal
            deal={selectedDeal}
            onUse={() => handleUse(selectedDeal.id)}
            onClose={() => setSelectedDeal(null)}
          />
        </div>
      )}

      {/* Deal detail — mobile bottom sheet */}
      {selectedDeal && (
        <div className="md:hidden">
          <BottomSheet
            deal={selectedDeal}
            onUse={() => handleUse(selectedDeal.id)}
            onClose={() => setSelectedDeal(null)}
          />
        </div>
      )}

      {/* Location picker — multiple deals at one pin */}
      {selectedLocation && (
        <LocationPicker
          location={selectedLocation}
          onSelectDeal={handleSelectFromPicker}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  )
}
