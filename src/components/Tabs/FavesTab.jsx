export default function FavesTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="text-5xl mb-4">🤍</div>
      <p className="text-lg font-semibold text-gray-700" style={{ fontFamily: 'var(--font-display)' }}>No favorites yet</p>
      <p className="text-sm text-gray-400 mt-1">Your favorited deals will appear here</p>
    </div>
  )
}
