import { useMemo } from 'react'
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import BusinessMarker from './BusinessMarker'
import MapLegend from './MapLegend'
import { getDealUsageState } from '../../utils/dealHelpers'
import allDealsRaw from '../../data/deals.json'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

// Pre-compute fallback coordinates: coords shared by 4+ different businesses
// are city-level geocoding fallbacks, not real locations. Computed once from
// the full dataset so filtering doesn't affect the detection.
const FALLBACK_COORDS = (() => {
  const coordToBiz = new Map()
  allDealsRaw.forEach(deal => {
    deal.locations?.forEach(loc => {
      if (!loc.lat || !loc.lng) return
      const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`
      if (!coordToBiz.has(key)) coordToBiz.set(key, new Set())
      coordToBiz.get(key).add(deal.name)
    })
  })
  const bad = new Set()
  coordToBiz.forEach((bizSet, key) => { if (bizSet.size >= 8) bad.add(key) })
  return bad
})()

const PROVO_CENTER = [40.2468, -111.6490]
const DEFAULT_ZOOM = 13
const MAX_ZOOM = 19

function createClusterIcon(cluster) {
  const count = cluster.getChildCount()
  const [tier, size] = count < 10 ? ['sm', 34] : count < 40 ? ['md', 42] : ['lg', 50]
  return L.divIcon({
    html: `<div class="ssc-cluster ssc-cluster-${tier}" style="width:${size}px;height:${size}px;">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function spiderfyAll(map) {
  map.eachLayer(layer => {
    if (!layer._featureGroup) return
    layer._featureGroup.eachLayer(sub => {
      if (typeof sub.spiderfy === 'function') sub.spiderfy()
    })
  })
}

function AutoSpiderfy() {
  useMapEvents({
    zoomend: (e) => { if (e.target.getZoom() === MAX_ZOOM) setTimeout(() => spiderfyAll(e.target), 100) },
  })
  return null
}

const LOCATION_ICON = L.divIcon({
  className: '',
  html: '<div class="loc-ring"></div><div class="loc-dot"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export default function MapView({ deals, selectedDeal, onSelectDeal, onSelectLocation, usageMap, userCoords }) {
  // Group pins by unique coordinate — one pin per physical location
  const pins = useMemo(() => {
    const byCoord = new Map()
    deals.forEach(deal => {
      const usageState = deal.usage ?? getDealUsageState(deal, usageMap)
      const locs = deal.locations?.length
        ? deal.locations
        : (deal.lat != null ? [{ lat: deal.lat, lng: deal.lng, address: deal.address }] : [])
      locs.forEach(loc => {
        if (!loc.lat || !loc.lng) return
        const coordKey = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`
        if (FALLBACK_COORDS.has(coordKey)) return
        const key = `${deal.name}__${loc.lat},${loc.lng}`
        if (!byCoord.has(key)) byCoord.set(key, { loc, items: [], key })
        byCoord.get(key).items.push({ deal, usageState })
      })
    })
    return [...byCoord.values()]
  }, [deals, usageMap])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={PROVO_CENTER}
        zoom={DEFAULT_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={MAX_ZOOM}
        />
        <AutoSpiderfy />
        {userCoords && (
          <Marker
            position={[userCoords.lat, userCoords.lng]}
            icon={LOCATION_ICON}
            interactive={false}
            zIndexOffset={1000}
          />
        )}
        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          chunkedLoading
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          removeOutsideVisibleBounds={false}
          circleSpiralSwitchover={1}
        >
          {pins.map(({ loc, items, key }) => (
            <BusinessMarker
              key={key}
              loc={loc}
              items={items}
              isSelected={items.some(i => i.deal.id === selectedDeal?.id)}
              onSelectDeal={onSelectDeal}
              onSelectLocation={onSelectLocation}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      <MapLegend />
    </div>
  )
}
