import { MapContainer, TileLayer } from 'react-leaflet'
import BusinessMarker from './BusinessMarker'
import MapLegend from './MapLegend'
import { getDealUsageState } from '../../utils/dealHelpers'

const PROVO_CENTER = [40.2468, -111.6490]
const DEFAULT_ZOOM = 13

export default function MapView({ deals, selectedDeal, onSelectDeal, usageMap }) {
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
        {deals.filter(d => d.lat != null && d.lng != null).map(deal => {
          const usageState = deal.usage ?? getDealUsageState(deal, usageMap)
          return (
            <BusinessMarker
              key={deal.id}
              deal={deal}
              isSelected={selectedDeal?.id === deal.id}
              usageState={usageState}
              onClick={() => onSelectDeal(deal)}
            />
          )
        })}
      </MapContainer>
      <MapLegend />
    </div>
  )
}
