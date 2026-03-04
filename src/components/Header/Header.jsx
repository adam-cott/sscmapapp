export default function Header({ activeView, onViewToggle, onReset, filteredCount }) {
  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-5 py-0"
      style={{
        background: 'linear-gradient(135deg, #013f6e 0%, #0159a0 100%)',
        height: '56px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-lg text-white text-sm font-bold"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.25)',
            fontFamily: 'Sora, sans-serif',
            fontSize: '14px',
          }}
        >
          S
        </div>
        <div>
          <div
            className="text-white font-bold leading-none"
            style={{ fontFamily: 'Sora, sans-serif', fontSize: '15px', letterSpacing: '-0.01em' }}
          >
            Starving Student Card
          </div>
          <div className="text-xs leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Provo, UT
            {filteredCount !== undefined && (
              <span
                className="ml-2 font-semibold rounded-full px-1.5 py-px"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '10px' }}
              >
                {filteredCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Map / List toggle — mobile only */}
        <button
          onClick={onViewToggle}
          className="md:hidden flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.25)',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {activeView === 'map' ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>List</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 6 12 3 21 6 21 18 12 21 3 18 3 6"/></svg>Map</>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all"
          style={{
            backgroundColor: 'rgba(239,68,68,0.12)',
            color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.2)',
            fontFamily: 'Sora, sans-serif',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.22)'
            e.currentTarget.style.color = '#fecaca'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'
            e.currentTarget.style.color = '#fca5a5'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          </svg>
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  )
}
