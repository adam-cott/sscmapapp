import { useState } from 'react'
import './App.css'
import dealsData from './data/deals.json'
import { useDeals } from './hooks/useDeals'
import { useFilters } from './hooks/useFilters'
import { useGeolocation } from './hooks/useGeolocation'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import MapView from './components/Map/MapView'
import ListView from './components/ListView/ListView'
import DealModal from './components/Modal/DealModal'
import BottomSheet from './components/BottomSheet/BottomSheet'
import LocationPicker from './components/LocationPicker/LocationPicker'
import ConfirmDialog from './components/UI/ConfirmDialog'
import UseToast from './components/UI/UseToast'
import LocationPrompt from './components/UI/LocationPrompt'

export default function App() {
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [activeView, setActiveView] = useState('map')
  const [showUseToast, setShowUseToast] = useState(false)

  const { dealsWithUsage, usageMap, recordUse, resetAll } = useDeals(dealsData)

  // Geolocation: called once at the top level and threaded via props.
  // The tree is only 2 levels deep on each path (App → ListView → DealCard,
  // App → Sidebar → FilterPanel) so prop drilling is cleaner than a Context.
  const { coords, loading: geoLoading, permissionDenied, hasRequested, requestLocation, decline } = useGeolocation()

  const {
    searchQuery,
    setSearchQuery,
    activeCategories,
    toggleCategory,
    clearFilters,
    filteredDeals,
    sortBy,
    setSortBy,
  } = useFilters(dealsWithUsage, coords)

  const handleReset = () => setShowResetConfirm(true)

  const confirmReset = () => {
    resetAll()
    setSelectedDeal(null)
    setShowResetConfirm(false)
  }

  const handleUse = (dealId) => {
    recordUse(dealId)
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
    setShowUseToast(true)
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
            sortBy={sortBy}
            setSortBy={setSortBy}
            permissionDenied={permissionDenied}
            geoLoading={geoLoading}
          />
          {/* Desktop list view in sidebar */}
          <div className="flex-1 overflow-y-auto">
            <ListView deals={filteredDeals} onSelectDeal={handleSelectDeal} userCoords={coords} />
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
              userCoords={coords}
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
                sortBy={sortBy}
                setSortBy={setSortBy}
                permissionDenied={permissionDenied}
                geoLoading={geoLoading}
                compact
              />
            </div>
            <ListView deals={filteredDeals} onSelectDeal={handleSelectDeal} userCoords={coords} />
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
                sortBy={sortBy}
                setSortBy={setSortBy}
                permissionDenied={permissionDenied}
                geoLoading={geoLoading}
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

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <ConfirmDialog
          title="Reset all deal usage?"
          message="This cannot be undone. All tracked usage history will be cleared."
          confirmLabel="Reset"
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* Location picker — multiple deals at one pin */}
      {selectedLocation && (
        <LocationPicker
          location={selectedLocation}
          onSelectDeal={handleSelectFromPicker}
          onClose={() => setSelectedLocation(null)}
        />
      )}

      {/* Use confirmation toast */}
      {showUseToast && (
        <UseToast onDismiss={() => setShowUseToast(false)} />
      )}

      {/* Location permission prompt — shown once on load before geo is requested */}
      {!hasRequested && (
        <LocationPrompt onAllow={requestLocation} onDecline={decline} />
      )}
    </div>
  )
}
