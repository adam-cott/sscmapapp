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
        height: '64px',
        background: isMapTab
          ? 'rgba(255,255,255,0.92)'
          : '#ffffff',
        backdropFilter: isMapTab ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isMapTab ? 'blur(16px)' : 'none',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      }}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ background: 'none', border: 'none', cursor: 'pointer', paddingTop: '6px' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '28px',
              borderRadius: '14px',
              background: active ? 'var(--ssc-blue-light)' : 'transparent',
              transition: 'background 0.15s ease',
            }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.emoji}</span>
            </div>
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
