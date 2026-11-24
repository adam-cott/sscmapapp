import { useState } from 'react'
import { User, Calendar, RotateCcw, Info, ChevronRight, LogOut, Trash2, Accessibility } from 'lucide-react'
import { STORAGE_KEYS } from '../../constants/storageKeys'

const rowClass = 'flex items-center w-full text-left px-4 py-4 cursor-pointer active:bg-gray-50'
const rowStyle = { background: 'none', border: 'none', font: 'inherit' }

export default function SettingsTab({ onEditProfile, onCardYear, onReset, onAbout, onSignOut, onDeleteAccount, showBadge, isAdmin }) {
  const mainRows = [
    { label: 'Edit Profile',     Icon: User,      onClick: onEditProfile },
    { label: 'Card Year',        Icon: Calendar,  onClick: onCardYear,   badge: showBadge },
    { label: 'Reset Usage Data', Icon: RotateCcw, onClick: onReset },
    { label: 'About',            Icon: Info,      onClick: onAbout },
  ]

  // Saved on the phone; read by SwipeToConfirm when a deal opens.
  const [a11y, setA11y] = useState(() => { try { return localStorage.getItem(STORAGE_KEYS.accessibility) === '1' } catch { return false } })
  const toggleA11y = () => {
    const on = !a11y
    setA11y(on)
    try { on ? localStorage.setItem(STORAGE_KEYS.accessibility, '1') : localStorage.removeItem(STORAGE_KEYS.accessibility) } catch { /* private mode */ }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="px-4 pt-6 pb-2">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Settings</h2>
      </div>

      {/* Main rows */}
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-white shadow-sm">
        {mainRows.map((row, i) => (
          <button
            key={row.label}
            onClick={row.onClick}
            className={rowClass}
            style={{ ...rowStyle, borderBottom: i < mainRows.length - 1 ? '1px solid #f1f5f9' : 'none' }}
          >
            <div style={{ position: 'relative', marginRight: '12px', flexShrink: 0 }}>
              <row.Icon size={18} color="#94a3b8" />
              {row.badge && (
                <div style={{
                  position: 'absolute', top: '-3px', right: '-3px',
                  width: '7px', height: '7px', borderRadius: '50%',
                  backgroundColor: '#ef4444', border: '1.5px solid #fff',
                }} />
              )}
            </div>
            <span className="flex-1 text-base text-gray-800">{row.label}</span>
            <ChevronRight size={16} color="#d1d5db" />
          </button>
        ))}
      </div>

      {/* Accessibility options */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden bg-white shadow-sm">
        <button role="switch" aria-checked={a11y} onClick={toggleA11y} className={rowClass} style={rowStyle}>
          <Accessibility size={18} color="#94a3b8" className="mr-3 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-base text-gray-800 block">Accessibility options</span>
            <span className="text-xs text-gray-400">Adds a "Tap to redeem" button below the slider</span>
          </div>
          <span aria-hidden style={{
            width: '44px', height: '26px', borderRadius: '13px', flexShrink: 0, marginLeft: '12px', position: 'relative',
            backgroundColor: a11y ? 'var(--ssc-blue)' : '#e2e8f0', transition: 'background-color 0.2s',
          }}>
            <span style={{
              position: 'absolute', top: '3px', left: '3px', width: '20px', height: '20px', borderRadius: '50%',
              backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transform: a11y ? 'translateX(18px)' : 'none', transition: 'transform 0.2s',
            }} />
          </span>
        </button>
      </div>

      {/* Sign out */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden bg-white shadow-sm">
        <button onClick={onSignOut} className={rowClass} style={rowStyle}>
          <LogOut size={18} color="#94a3b8" className="mr-3 flex-shrink-0" />
          <span className="flex-1 text-base text-gray-800">Sign Out</span>
          <ChevronRight size={16} color="#d1d5db" />
        </button>
      </div>

      {/* Delete account */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={onDeleteAccount}
          disabled={isAdmin}
          className="flex items-center w-full text-left px-4 py-4"
          style={{ ...rowStyle, cursor: isAdmin ? 'default' : 'pointer', opacity: isAdmin ? 0.4 : 1 }}
        >
          <Trash2 size={18} color="#ef4444" className="mr-3 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-base block" style={{ color: '#ef4444' }}>Delete Account</span>
            {isAdmin && (
              <span className="text-xs text-gray-400">Not available for the admin account</span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
