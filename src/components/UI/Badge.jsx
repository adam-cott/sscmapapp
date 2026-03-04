import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/categoryColors'

export default function Badge({ category, className = '' }) {
  const color = CATEGORY_COLORS[category] || '#64748b'
  const label = CATEGORY_LABELS[category] || category
  const icon  = CATEGORY_ICON[category] || ''

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${className}`}
      style={{ color, backgroundColor: color + '18', border: `1px solid ${color}30` }}
    >
      <span style={{ fontSize: '10px' }}>{icon}</span>
      {label}
    </span>
  )
}
