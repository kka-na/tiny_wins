import { useState, useRef, useEffect } from 'react'
import DiaryList from './DiaryList'
import Dashboard from './Dashboard'
import Battle from './Battle'

export default function MainView() {
  const [page, setPage] = useState(1)
  const touchStart = useRef(null)
  const touchEnd = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e) {
      if (e.target.closest('.fixed')) {
        touchStart.current = null
        return
      }
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      touchEnd.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    function onTouchMove(e) {
      if (!touchStart.current) return
      touchEnd.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    function onTouchEnd() {
      if (!touchStart.current) return
      const dx = touchStart.current.x - touchEnd.current.x
      const dy = Math.abs(touchStart.current.y - touchEnd.current.y)
      const threshold = 80
      if (Math.abs(dx) > threshold && Math.abs(dx) > dy * 2) {
        if (dx > 0 && page < 2) setPage(page + 1)
        else if (dx < 0 && page > 0) setPage(page - 1)
      }
      touchStart.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [page])

  return (
    <div ref={containerRef} className="overflow-hidden">
      {/* 페이지 인디케이터 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition ${page === i ? 'bg-charcoal/50' : 'bg-charcoal/15'}`} />
        ))}
      </div>

      {/* 슬라이딩 컨테이너 */}
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ width: '300%', transform: `translateX(-${page * (100 / 3)}%)` }}
      >
        <div className="w-1/3">
          <DiaryList />
        </div>
        <div className="w-1/3">
          <Dashboard />
        </div>
        <div className="w-1/3">
          <Battle embedded />
        </div>
      </div>
    </div>
  )
}
