import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import AuthScreen from './components/Auth/AuthScreen'
import EditProfileScreen from './components/Tabs/EditProfileScreen'
import DeleteAccountDialog from './components/UI/DeleteAccountDialog'
import AboutScreen from './components/Settings/AboutScreen'
import CardYearScreen from './components/Settings/CardYearScreen'
import { useCardYear } from './hooks/useCardYear'
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
import HomeTab from './components/Tabs/HomeTab'
import { useFaves } from './hooks/useFaves'
import { useUsageLog } from './hooks/useUsageLog'
import { useFirestoreSync } from './hooks/useFirestoreSync'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <AuthScreen />
  return <AppShell />
}

function AppShell() {
  const { signOut, user } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showCardYear, setShowCardYear] = useState(false)
  const { isExpired, isExpiring } = useCardYear()
  const [activeView, setActiveView] = useState('map')
  const [showUseToast, setShowUseToast] = useState(false)
  const [pendingNearest, setPendingNearest] = useState(false)

  const { dealsWithUsage, usageMap, recordUse, resetAll } = useDeals(dealsData)
  const { faves, toggleFave, isFave } = useFaves()
  const { usageLog, logUse, clearLog } = useUsageLog()

  useFirestoreSync(user.uid, usageMap, faves, usageLog)

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
    clearLog()
    setSelectedDeal(null)
    setShowResetConfirm(false)
  }

  const handleUse = (dealId) => {
    recordUse(dealId)
    logUse(dealId)
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

  const handleSelectDeal = useCallback((deal) => {
    if (!deal.contact?.phone && deal.locations?.length) {
      const phone = deal.locations.find(l => l.phone)?.phone ?? null
      setSelectedDeal({ ...deal, contact: { ...deal.contact, phone } })
    } else {
      setSelectedDeal(deal)
    }
  }, [])
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>
      {/* ── Home tab ────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <HomeTab
              deals={dealsWithUsage}
              filteredDeals={filteredDeals}
              usageLog={usageLog}
              userCoords={coords}
              onSelectDeal={handleSelectDeal}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategories={activeCategories}
              onCategoryToggle={toggleCategory}
              onClearFilters={clearFilters}
              sortBy={sortBy}
              setSortBy={handleSetSortBy}
              categoryCounts={categoryCounts}
              permissionDenied={permissionDenied}
              geoLoading={geoLoading}
              hasCoords={!!coords}
              onNearestRequest={handleNearestRequest}
              dealCount={filteredDeals.length}
            />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} settingsBadge={isExpired || isExpiring} />
        </div>
      )}

      {/* ── Map tab ─────────────────────────────────────── */}
      {isMapTab && (
        <div className="flex flex-col flex-1 overflow-hidden">
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
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab settingsBadge={isExpired || isExpiring} />
          </div>
        </div>
        {/* Nav sits full-width below sidebar+map on desktop */}
        <div className="hidden md:block">
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} settingsBadge={isExpired || isExpiring} />
        </div>
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
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} settingsBadge={isExpired || isExpiring} />
        </div>
      )}

      {/* ── Rewards tab ─────────────────────────────────── */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <RewardsTab
              usageLog={usageLog}
              dealsWithUsage={dealsWithUsage}
              usageMap={usageMap}
            />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} settingsBadge={isExpired || isExpiring} />
        </div>
      )}

      {/* ── Settings tab ────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {showEditProfile
              ? <EditProfileScreen onBack={() => setShowEditProfile(false)} />
              : showAbout
              ? <AboutScreen onBack={() => setShowAbout(false)} />
              : showCardYear
              ? <CardYearScreen onBack={() => setShowCardYear(false)} />
              : <SettingsTab
                  onEditProfile={() => setShowEditProfile(true)}
                  onReset={handleReset}
                  onSignOut={signOut}
                  onDeleteAccount={() => setShowDeleteDialog(true)}
                  onAbout={() => setShowAbout(true)}
                  onCardYear={() => setShowCardYear(true)}
                  showBadge={isExpired || isExpiring}
                />
            }
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isMapTab={false} settingsBadge={isExpired || isExpiring} />
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
      {showDeleteDialog && <DeleteAccountDialog onCancel={() => setShowDeleteDialog(false)} />}
    </div>
  )
}
