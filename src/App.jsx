import { useState, useEffect, useCallback } from 'react'
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
import UpdatePrompt from './components/UI/UpdatePrompt'
import BottomNav from './components/BottomNav/BottomNav'
import FavesTab from './components/Tabs/FavesTab'
import RewardsTab from './components/Tabs/RewardsTab'
import SettingsTab from './components/Tabs/SettingsTab'
import { useFaves } from './hooks/useFaves'

export default function App() {
  const [activeTab, setActiveTab] = useState('deals')
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [activeView, setActiveView] = useState('map')
  const [showUseToast, setShowUseToast] = useState(false)
  const [pendingNearest, setPendingNearest] = useState(false)

  const { dealsWithUsage, usageMap, recordUse, resetAll } = useDeals(dealsData)
  const { faves, toggleFave, isFave } = useFaves()

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
    categoryCounts,
  } = useFilters(dealsWithUsage, coords)

  useEffect(() => {
    if (coords && pendingNearest) {
      setSortBy('nearest')
      setPendingNearest(false)
    }
  }, [coords, pendingNearest])

  useEffect(() => {
    if (permissionDenied) setPendingNearest(false)
  }, [permissionDenied])

  const handleSetSortBy = (val) => {
    if (val !== 'nearest') setPendingNearest(false)
    setSortBy(val)
  }

  const handleNearestRequest = () => {
    setPendingNearest(true)
    if (!geoLoading) requestLocation()
  }

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

  const handleSelectDeal = useCallback((deal) => { setSelectedDeal(deal) }, [])
  const handleSelectLocation = useCallback((location) => { setSelectedLocation(location) }, [])
  const handleSelectFromPicker = useCallback((deal) => {
    setSelectedLocation(null)
    setSelectedDeal(deal)
  }, [])

  const sidebarProps = {
    searchQuery,
    onSearchChange: setSearchQuery,
    activeCategories,
    onCategoryToggle: toggleCategory,
    onClearFilters: clearFilters,
    dealCount: filteredDeals.length,
    sortBy,
    setSortBy: handleSetSortBy,
    permissionDenied,
    geoLoading,
    hasCoords: !!coords,
    onNearestRequest: handleNearestRequest,
    categoryCounts,
  }

  const isMapTab = activeTab === 'map'

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>
      {/* ── Map tab ─────────────────────────────────────── */}
      {isMapTab && (
        <div className="flex flex-1 overflow-hidden relative">
          {/* Desktop sidebar */}
          <aside className="hidden md:flex flex-col flex-shrink-0" style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e8edf3' }}>
            <Header
              activeView={activeView}
              onViewToggle={() => setActiveView(v => v === 'map' ? 'list' : 'map')}
              onReset={handleReset}
              filteredCount={filteredDeals.length}
            />
            <Sidebar {...sidebarProps} />
            <div className="flex-1 overflow-y-auto">
              <ListView deals={filteredDeals} onSelectDeal={handleSelectDeal} userCoords={coords} />
            </div>
          </aside>

          {/* Main map area */}
          <main className="flex-1 relative overflow-hidden">
            {/* Mobile header */}
            <div className="md:hidden">
              <Header
                activeView={activeView}
                onViewToggle={() => setActiveView(v => v === 'map' ? 'list' : 'map')}
                onReset={handleReset}
                filteredCount={filteredDeals.length}
              />
            </div>

            {/* Map — always rendered so it stays alive */}
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
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
                <Sidebar {...sidebarProps} compact />
              </div>
              <ListView deals={filteredDeals} onSelectDeal={handleSelectDeal} userCoords={coords} />
            </div>

            {/* Mobile compact filter bar over map */}
            {activeView === 'map' && (
              <div className="md:hidden absolute top-0 left-0 right-0 z-[500] bg-white border-b border-gray-100 px-3 py-2 shadow-sm">
                <Sidebar {...sidebarProps} compact />
              </div>
            )}
          </main>

          {/* Nav floats over map on mobile */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-[600]">
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab />
          </div>
        </div>
      )}

      {/* ── Deals tab ───────────────────────────────────── */}
      {activeTab === 'deals' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
              <Sidebar {...sidebarProps} compact />
            </div>
            <ListView deals={filteredDeals} onSelectDeal={handleSelectDeal} userCoords={coords} />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} />
        </div>
      )}

      {/* ── Faves tab ───────────────────────────────────── */}
      {activeTab === 'faves' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <FavesTab
              deals={dealsWithUsage.filter(d => faves.includes(d.id))}
              onSelectDeal={handleSelectDeal}
              userCoords={coords}
            />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} />
        </div>
      )}

      {/* ── Rewards tab ─────────────────────────────────── */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1">
            <RewardsTab />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} />
        </div>
      )}

      {/* ── Settings tab ────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <SettingsTab />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} />
        </div>
      )}

      {/* ── Overlays (shared across all tabs) ───────────── */}
      {selectedDeal && (
        <div className="hidden md:block">
          <DealModal deal={selectedDeal} onUse={() => handleUse(selectedDeal.id)} onClose={() => setSelectedDeal(null)} isFave={isFave(selectedDeal.id)} onToggleFave={toggleFave} />
        </div>
      )}
      {selectedDeal && (
        <div className="md:hidden">
          <BottomSheet deal={selectedDeal} onUse={() => handleUse(selectedDeal.id)} onClose={() => setSelectedDeal(null)} isFave={isFave(selectedDeal.id)} onToggleFave={toggleFave} />
        </div>
      )}
      {showResetConfirm && (
        <ConfirmDialog
          title="Reset all deal usage?"
          message="This cannot be undone. All tracked usage history will be cleared."
          confirmLabel="Reset"
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
      {selectedLocation && (
        <LocationPicker location={selectedLocation} onSelectDeal={handleSelectFromPicker} onClose={() => setSelectedLocation(null)} />
      )}
      {showUseToast && <UseToast onDismiss={() => setShowUseToast(false)} />}
      {!hasRequested && activeTab === 'map' && <LocationPrompt onAllow={requestLocation} onDecline={decline} />}
      <UpdatePrompt />
    </div>
  )
}
