export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        placeholder="Search businesses or deals…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm rounded-xl pl-9 pr-8 py-2.5 outline-none transition-all"
        style={{
          fontFamily: 'DM Sans, sans-serif',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          color: '#1e293b',
        }}
        onFocus={e => { e.target.style.borderColor = '#0170B9'; e.target.style.backgroundColor = '#fff' }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-colors"
          style={{ color: '#94a3b8', backgroundColor: '#e2e8f0' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}
