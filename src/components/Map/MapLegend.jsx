import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/categoryColors'
import { ALL_CATEGORIES } from '../../constants/categories'

export default function MapLegend() {
  return (
    <div
      className="hidden md:block"
      style={{
        position: 'absolute',
        bottom: '28px',
        right: '12px',
        zIndex: 800,
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        fontSize: '11px',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        minWidth: '140px',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Categories */}
      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '7px' }}>
        Categories
      </div>
      {ALL_CATEGORIES.map(cat => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: CATEGORY_COLORS[cat],
            border: '2px solid white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            flexShrink: 0,
          }} />
          <span style={{ color: '#475569', fontSize: '11px' }}>{CATEGORY_ICON[cat]} {CATEGORY_LABELS[cat]}</span>
        </div>
      ))}

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '9px 0' }} />

      {/* Status */}
      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '7px' }}>
        Usage
      </div>
      {[
        { color: '#059669', label: 'Available' },
        { color: '#f59e0b', label: 'Partially used' },
        { color: '#94a3b8', label: 'Exhausted' },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: color,
            border: '2px solid white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            flexShrink: 0,
          }} />
          <span style={{ color: '#475569', fontSize: '11px' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
