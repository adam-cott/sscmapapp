const rows = [
  { label: 'Edit Profile', icon: '👤' },
  { label: 'Card Year', icon: '📅' },
  { label: 'Reset Usage Data', icon: '🔄' },
  { label: 'About', icon: 'ℹ️' },
]

export default function SettingsTab() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="px-4 pt-6 pb-2">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Settings</h2>
      </div>
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-white shadow-sm">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center px-4 py-4 cursor-pointer active:bg-gray-50"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}
          >
            <span className="text-xl mr-3">{row.icon}</span>
            <span className="flex-1 text-base text-gray-800">{row.label}</span>
            <span className="text-gray-300 text-lg">›</span>
          </div>
        ))}
      </div>
    </div>
  )
}
