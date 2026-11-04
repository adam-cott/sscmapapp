import { useLayoutEffect, useRef, useState } from 'react'
import { Home, Map, Heart, Trophy, Settings, ShieldCheck } from 'lucide-react'

const TABS = [
  { id: 'rewards',  label: 'Rewards', Icon: Trophy      },
  { id: 'map',      label: 'Map',     Icon: Map         },
  { id: 'home',     label: 'Home',    Icon: Home        },
  { id: 'faves',    label: 'Faves',   Icon: Heart       },
  { id: 'settings', label: 'Settings',Icon: Settings    },
]

const ADMIN_TAB = { id: 'admin', label: 'Admin', Icon: ShieldCheck }

// The Map tab and the other tabs each render their own BottomNav, so the
// highlight's last spot lives here to let it slide across that remount.
let lastPill = null

export default function BottomNav({ activeTab, onTabChange, isMapTab, settingsBadge, isAdmin }) {
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS
  const navRef = useRef(null)
  const pillRefs = useRef({})
  const [pill, setPill] = useState(lastPill)

  useLayoutEffect(() => {
    const measure = () => {
      const el = pillRefs.current[activeTab]
      if (!el) return setPill(null)
      const n = navRef.current.getBoundingClientRect(), r = el.getBoundingClientRect()
      lastPill = { left: r.left - n.left, top: r.top - n.top }
      setPill(lastPill)
    }
    // Wait a frame so a freshly mounted nav paints the old spot first and slides.
    const frame = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', measure) }
  }, [activeTab, isAdmin])

  return (
    <nav
      ref={navRef}
      className="flex items-stretch"
      style={{
        position: 'relative',
        isolation: 'isolate',
        height: '64px',
        background: isMapTab ? 'rgba(255,255,255,0.92)' : '#ffffff',
        backdropFilter: isMapTab ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isMapTab ? 'blur(16px)' : 'none',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      }}
    >
      {pill && (
        <div
          className="nav-indicator"
          style={{
            position: 'absolute', left: pill.left, top: pill.top, zIndex: -1,
            width: '40px', height: '28px', borderRadius: '14px',
            background: 'var(--ssc-blue-light)',
          }}
        />
      )}
      {tabs.map(({ id, label, Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ background: 'none', border: 'none', cursor: 'pointer', paddingTop: '6px' }}
          >
            <div ref={el => { pillRefs.current[id] = el }} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '28px',
              position: 'relative',
            }}>
              <Icon
                className={active ? 'nav-pop' : undefined}
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                color={active ? 'var(--ssc-blue)' : '#94a3b8'}
              />
              {id === 'settings' && settingsBadge && (
                <div style={{
                  position: 'absolute', top: '2px', right: '4px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: '#ef4444', border: '1.5px solid #fff',
                }} />
              )}
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
