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
import { useOverlayHistory } from './hooks/useOverlayHistory'
import { useGeolocation } from './hooks/useGeolocation'
import Sidebar from './components/Sidebar/Sidebar'
import MapView from './components/Map/MapView'
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
import { useFeaturedDeals } from './hooks/useFeaturedDeals'
import AdminTab from './components/Tabs/AdminTab'
import { ADMIN_UID } from './constants/admin'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <AuthScreen />
  return <AppShell />
}

function AppShell() {
  const { signOut, user } = useAuth()
  const isAdmin = user.uid === ADMIN_UID
  const { featuredIds } = useFeaturedDeals()
  const [activeTab, setActiveTab] = useState('home')
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showCardYear, setShowCardYear] = useState(false)
  const { isExpired, isExpiring } = useCardYear()
  const [showUseToast, setShowUseToast] = useState(false)
  const [lastUsedDealId, setLastUsedDealId] = useState(null)
  const [pendingNearest, setPendingNearest] = useState(false)

  const { dealsWithUsage, usageMap, recordUse, undoUse, resetAll } = useDeals(dealsData.filter(d => d.active !== false))
  const { faves, toggleFave, isFave } = useFaves()
  const { usageLog, logUse, undoLog, clearLog } = useUsageLog()

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
    pinnedIds,
    showCategory,
    showPinned,
    showAllNearest,
    isListMode,
  } = useFilters(dealsWithUsage, coords)

  // Back (hardware button, edge-swipe, or the browser's own back control)
  // closes whichever of these is topmost instead of leaving the app. See
  // useOverlayHistory for how a physical back press only closes one layer
  // at a time when several are open (e.g. a deal opened from Home's
  // filtered list).
  useOverlayHistory(isListMode, clearFilters)
  useOverlayHistory(!!selectedDeal, () => setSelectedDeal(null))
  useOverlayHistory(!!selectedLocation, () => setSelectedLocation(null))
  useOverlayHistory(showResetConfirm, () => setShowResetConfirm(false))
  useOverlayHistory(showEditProfile, () => setShowEditProfile(false))
  useOverlayHistory(showDeleteDialog, () => setShowDeleteDialog(false))
  useOverlayHistory(showAbout, () => setShowAbout(false))
  useOverlayHistory(showCardYear, () => setShowCardYear(false))

  // Leaving Home resets its filtered-list state, so it's never left running
  // in the background — otherwise a later back press on a different tab
  // could silently consume a history entry with no visible change.
  useEffect(() => {
    if (activeTab !== 'home' && isListMode) clearFilters()
  }, [activeTab, isListMode, clearFilters])

  // Tapping Home while already on Home resets to the carousel view, since
  // switching to an already-active tab is otherwise a no-op.
  const handleTabChange = (id) => {
    if (id === 'home' && activeTab === 'home') clearFilters()
    setActiveTab(id)
  }

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
    setLastUsedDealId(dealId)
    setShowUseToast(true)
  }

  const handleUndoUse = () => {
    if (!lastUsedDealId) return
    undoUse(lastUsedDealId)
    undoLog(lastUsedDealId)
    setLastUsedDealId(null)
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
              onSelectLocation={handleSelectLocation}
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
              featuredIds={featuredIds}
              faves={faves}
              pinnedIds={pinnedIds}
              isListMode={isListMode}
              onShowCategory={showCategory}
              onShowPinned={showPinned}
              onShowAllNearest={showAllNearest}
              onNavigateFaves={() => setActiveTab('faves')}
            />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} isMapTab={false} settingsBadge={isExpired || isExpiring} isAdmin={isAdmin} />
        </div>
      )}

      {/* ── Map tab ─────────────────────────────────────── */}
      {isMapTab && (
        <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 relative overflow-hidden">
            {/* Map */}
            <div className="absolute inset-0">
              <MapView
                deals={filteredDeals}
                selectedDeal={selectedDeal}
                onSelectDeal={handleSelectDeal}
                onSelectLocation={handleSelectLocation}
                usageMap={usageMap}
                userCoords={coords}
              />
            </div>

            {/* Compact filter bar over map — no sort control, map pins aren't ordered */}
            <div className="absolute top-0 left-0 right-0 z-[500] bg-white border-b border-gray-100 px-3 py-2 shadow-sm">
              <Sidebar {...sidebarProps} />
            </div>
          </main>

          {/* Nav floats over map */}
          <div className="absolute bottom-0 left-0 right-0 z-[600]">
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} isMapTab settingsBadge={isExpired || isExpiring} isAdmin={isAdmin} />
          </div>
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
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} isMapTab={false} settingsBadge={isExpired || isExpiring} isAdmin={isAdmin} />
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
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} isMapTab={false} settingsBadge={isExpired || isExpiring} isAdmin={isAdmin} />
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
                  isAdmin={isAdmin}
                />
            }
          </div>
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} isMapTab={false} settingsBadge={isExpired || isExpiring} isAdmin={isAdmin} />
        </div>
      )}

      {/* ── Admin tab ───────────────────────────────────── */}
      {activeTab === 'admin' && isAdmin && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AdminTab deals={dealsWithUsage} />
          </div>
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} isMapTab={false} settingsBadge={isExpired || isExpiring} isAdmin={isAdmin} />
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
      {showUseToast && (
        <UseToast
          dealName={dealsWithUsage.find(d => d.id === lastUsedDealId)?.name}
          onUndo={handleUndoUse}
          onDismiss={() => setShowUseToast(false)}
        />
      )}
      {!hasRequested && activeTab === 'map' && <LocationPrompt onAllow={requestLocation} onDecline={decline} />}
      <UpdatePrompt />
      {showDeleteDialog && <DeleteAccountDialog onCancel={() => setShowDeleteDialog(false)} />}
    </div>
  )
}
