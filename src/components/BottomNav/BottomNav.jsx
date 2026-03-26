import { Map, Tag, Heart, Trophy, Settings } from 'lucide-react'

const TABS = [
  { id: 'rewards',  label: 'Rewards', Icon: Trophy   },
  { id: 'map',      label: 'Map',     Icon: Map      },
  { id: 'deals',    label: 'Deals',   Icon: Tag      },
  { id: 'faves',    label: 'Faves',   Icon: Heart    },
  { id: 'settings', label: 'Settings',Icon: Settings },
]

export default function BottomNav({ activeTab, onTabChange, isMapTab }) {
  return (
    <nav
      className="flex items-stretch"
      style={{
        height: '64px',
        background: isMapTab ? 'rgba(255,255,255,0.92)' : '#ffffff',
        backdropFilter: isMapTab ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isMapTab ? 'blur(16px)' : 'none',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
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
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                color={active ? 'var(--ssc-blue)' : '#94a3b8'}
              />
            </div>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-body)',
              fontWeight: active ? 700 : 400,
              color: active ? 'var(--ssc-blue)' : '#94a3b8',
              letterSpacing: '0.02em',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
