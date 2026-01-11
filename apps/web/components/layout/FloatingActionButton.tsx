'use client'

export function FloatingActionButton() {
  const handleClick = () => {
    const event = new CustomEvent('openAddTransaction')
    window.dispatchEvent(event)
  }

  return (
    <button
      className="fab md:hidden"
      aria-label="Yeni i\u015flem ekle"
      onClick={handleClick}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}

