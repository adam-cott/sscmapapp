import { User, Calendar, RotateCcw, Info, ChevronRight, LogOut, Trash2 } from 'lucide-react'

export default function SettingsTab({ onEditProfile, onCardYear, onReset, onAbout, onSignOut, onDeleteAccount, showBadge, isAdmin }) {
  const mainRows = [
    { label: 'Edit Profile',     Icon: User,      onClick: onEditProfile },
    { label: 'Card Year',        Icon: Calendar,  onClick: onCardYear,   badge: showBadge },
    { label: 'Reset Usage Data', Icon: RotateCcw, onClick: onReset },
    { label: 'About',            Icon: Info,      onClick: onAbout },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="px-4 pt-6 pb-2">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Settings</h2>
      </div>

      {/* Main rows */}
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-white shadow-sm">
        {mainRows.map((row, i) => (
          <div
            key={row.label}
            onClick={row.onClick}
            className="flex items-center px-4 py-4 cursor-pointer active:bg-gray-50"
            style={{ borderBottom: i < mainRows.length - 1 ? '1px solid #f1f5f9' : 'none' }}
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
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div
          onClick={onSignOut}
          className="flex items-center px-4 py-4 cursor-pointer active:bg-gray-50"
        >
          <LogOut size={18} color="#94a3b8" className="mr-3 flex-shrink-0" />
          <span className="flex-1 text-base text-gray-800">Sign Out</span>
          <ChevronRight size={16} color="#d1d5db" />
        </div>
      </div>

      {/* Delete account — hidden for admin account */}
      {!isAdmin && (
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div
            onClick={onDeleteAccount}
            className="flex items-center px-4 py-4 cursor-pointer active:bg-gray-50"
          >
            <Trash2 size={18} color="#ef4444" className="mr-3 flex-shrink-0" />
            <span className="flex-1 text-base" style={{ color: '#ef4444' }}>Delete Account</span>
          </div>
        </div>
      )}
    </div>
  )
}
