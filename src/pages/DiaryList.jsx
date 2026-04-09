import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useHabitStore } from '../stores/useHabitStore'
import { useUserStore } from '../stores/useUserStore'

const allFruitImages = import.meta.glob('../assets/fruit_frames/**/*.png', { eager: true, import: 'default' })

const PHASE_THEME = {
  s1: { bg: 'bg-[#F0C3C4]' },
  s2: { bg: 'bg-[#C2DEE9]' },
  s3: { bg: 'bg-[#a7c4d4]' },
  s4: { bg: 'bg-[#5B3054]' },
  s5: { bg: 'bg-[#4a2745]' },
}

function getPrefix(startDate) {
  const day = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
  if (day <= 7) return 's1'
  if (day <= 14) return 's2'
  if (day <= 21) return 's3'
  if (day <= 28) return 's4'
  return 's5'
}

function getDayFromDate(startDate, diaryDate) {
  return Math.max(1, Math.min(35, Math.floor((new Date(diaryDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1))
}

export default function DiaryList() {
  const { currentSet, diaries } = useHabitStore()
  const user = useUserStore((s) => s.user)
  const [viewingDiary, setViewingDiary] = useState(null)

  const prefix = currentSet ? getPrefix(currentSet.start_date) : 's1'
  const theme = PHASE_THEME[prefix]
  const fruit = user?.fruit || 'strawberry'

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500 pb-20`}>
      <div className="max-w-md mx-auto px-4 py-5">
        <h2 className="text-sm font-bold text-charcoal text-center mb-5">일기 모아보기</h2>

        {diaries.length === 0 ? (
          <p className="text-xs text-charcoal/30 text-center py-10">아직 작성한 일기가 없어요</p>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {diaries.map((d) => {
              const dt = new Date(d.date + 'T00:00:00')
              const label = `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`
              const day = currentSet ? getDayFromDate(currentSet.start_date, d.date) : 1
              const imgSrc = allFruitImages[`../assets/fruit_frames/${fruit}/${fruit}_${day}.png`]
              return (
                <button
                  key={d.id}
                  onClick={() => setViewingDiary(d)}
                  className="flex flex-col items-center gap-0.5 transition hover:scale-105"
                >
                  <img src={imgSrc} alt="" className="w-full aspect-square object-contain" />
                  <span className="text-[9px] text-charcoal/40">{label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {viewingDiary && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingDiary(null)} onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          <div className="bg-cream rounded-2xl shadow-2xl p-5 max-w-sm w-full max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-charcoal">
                {new Date(viewingDiary.date + 'T00:00:00').toLocaleDateString('ko-KR')}
              </h2>
              <button onClick={() => setViewingDiary(null)} className="text-charcoal/30">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-charcoal leading-relaxed">
              {[viewingDiary.highlight, viewingDiary.habit_reflection, viewingDiary.tomorrow_intention].filter(Boolean).join(' ')}
            </p>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
