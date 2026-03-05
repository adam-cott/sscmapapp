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
  const pins = useMemo(() => deals.flatMap(deal => {
    const usageState = deal.usage ?? getDealUsageState(deal, usageMap)
    const locs = deal.locations?.length
      ? deal.locations
      : (deal.lat != null ? [{ lat: deal.lat, lng: deal.lng, address: deal.address }] : [])
    return locs.map((loc, i) => ({ deal, loc, usageState, key: `${deal.id}-${i}` }))
  }), [deals, usageMap])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={PROVO_CENTER}
        zoom={DEFAULT_ZOOM}
        maxZoom={19}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          chunkedLoading
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {pins.map(({ deal, loc, usageState, key }) => (
            <BusinessMarker
              key={key}
              deal={{ ...deal, lat: loc.lat, lng: loc.lng, address: loc.address }}
              isSelected={selectedDeal?.id === deal.id}
              usageState={usageState}
              onClick={() => onSelectDeal({ ...deal, lat: loc.lat, lng: loc.lng, address: loc.address })}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      <MapLegend />
    </div>
  )
}
