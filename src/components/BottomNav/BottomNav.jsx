const TABS = [
  { id: 'map',      label: 'Map',     emoji: '🗺️' },
  { id: 'deals',    label: 'Deals',   emoji: '🏷️' },
  { id: 'faves',    label: 'Faves',   emoji: '🤍' },
  { id: 'rewards',  label: 'Rewards', emoji: '🎁' },
  { id: 'settings', label: 'Settings',emoji: '⚙️' },
]

export default function BottomNav({ activeTab, onTabChange, isMapTab }) {
  return (
    <nav
      className="flex items-stretch"
      style={{
        height: '60px',
        background: isMapTab
          ? 'rgba(255,255,255,0.72)'
          : '#ffffff',
        backdropFilter: isMapTab ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: isMapTab ? 'blur(12px)' : 'none',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 -1px 12px rgba(0,0,0,0.06)',
      }}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.emoji}</span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-body)',
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--ssc-blue)' : '#94a3b8',
                letterSpacing: '0.02em',
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
