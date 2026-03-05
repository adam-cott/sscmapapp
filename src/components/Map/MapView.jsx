import { useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import BusinessMarker from './BusinessMarker'
import MapLegend from './MapLegend'
import { getDealUsageState } from '../../utils/dealHelpers'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

const PROVO_CENTER = [40.2468, -111.6490]
const DEFAULT_ZOOM = 13
const JITTER_RADIUS = 0.00018 // ~20 m — enough to separate, invisible at normal zoom

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

export default function MapView({ deals, selectedDeal, onSelectDeal, usageMap }) {
  // Build flat list of pins; apply spiral jitter to exact coordinate duplicates
  const pins = useMemo(() => {
    const raw = deals.flatMap(deal => {
      const usageState = deal.usage ?? getDealUsageState(deal, usageMap)
      const locs = deal.locations?.length
        ? deal.locations
        : (deal.lat != null ? [{ lat: deal.lat, lng: deal.lng, address: deal.address }] : [])
      return locs.map((loc, i) => ({ deal, loc, usageState, key: `${deal.id}-${i}` }))
    })

    // Group pins by exact coordinate
    const groups = {}
    raw.forEach(pin => {
      const k = `${pin.loc.lat},${pin.loc.lng}`
      ;(groups[k] = groups[k] || []).push(pin)
    })

    // Spread duplicates in a spiral ring
    return raw.map(pin => {
      const k = `${pin.loc.lat},${pin.loc.lng}`
      const group = groups[k]
      if (group.length === 1) {
        return { ...pin, mapLat: pin.loc.lat, mapLng: pin.loc.lng }
      }
      const idx = group.indexOf(pin)
      const angle = (2 * Math.PI * idx) / group.length
      const cosLat = Math.cos(pin.loc.lat * Math.PI / 180)
      return {
        ...pin,
        mapLat: pin.loc.lat + JITTER_RADIUS * Math.cos(angle),
        mapLng: pin.loc.lng + (JITTER_RADIUS / cosLat) * Math.sin(angle),
      }
    })
  }, [deals, usageMap])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={PROVO_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          chunkedLoading
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {pins.map(({ deal, loc, usageState, key, mapLat, mapLng }) => {
            // locDeal: keeps original lat/lng for Google Maps link, uses mapLat/mapLng for pin position
            const locDeal = { ...deal, lat: mapLat, lng: mapLng, address: loc.address, _origLat: loc.lat, _origLng: loc.lng }
            return (
              <BusinessMarker
                key={key}
                deal={locDeal}
                isSelected={selectedDeal?.id === deal.id}
                usageState={usageState}
                onClick={() => onSelectDeal({ ...deal, lat: loc.lat, lng: loc.lng, address: loc.address })}
              />
            )
          })}
        </MarkerClusterGroup>
      </MapContainer>
      <MapLegend />
    </div>
  )
}
