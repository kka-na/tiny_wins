import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/useUserStore'
import { useHabitStore } from '../stores/useHabitStore'
import { api } from '../lib/api'
import { Crown } from 'lucide-react'

export default function HabitSets() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const { currentSet, setCurrentSet, setHabits } = useHabitStore()

  const [sets, setSets] = useState([])
  const [setsHabits, setSetsHabits] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const allSets = await api.getHabitSets(user.user_id)
      // 최신순 정렬
      allSets.sort((a, b) => b.start_date.localeCompare(a.start_date))
      setSets(allSets)

      // 각 셋의 습관 목록 가져오기
      const habitsMap = {}
      for (const s of allSets) {
        habitsMap[s.id] = await api.getHabits(s.id)
      }
      setSetsHabits(habitsMap)
      setLoading(false)
    }
    load()
  }, [user])

  async function handleNewSet() {
    setCreating(true)
    try {
      // 현재 활성 셋 종료
      if (currentSet) {
        await api.deactivateSet(currentSet.id)
      }
      // 새 셋으로 Setup 화면 이동
      navigate('/setup?new=1', { replace: true })
    } catch (e) {
      console.error(e)
    }
    setCreating(false)
  }

  async function handleActivateSet(e, set) {
    e.stopPropagation()
    await api.activateSet(set.id)
    // 스토어 업데이트
    setCurrentSet({ ...set, is_active: true })
    const habits = await api.getHabits(set.id)
    setHabits(habits)
    // 리스트 갱신
    const allSets = await api.getHabitSets(user.user_id)
    allSets.sort((a, b) => b.start_date.localeCompare(a.start_date))
    setSets(allSets)
  }

  function handleViewSet(set) {
    if (set.is_active) {
      navigate('/dashboard', { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-charcoal/50 text-sm">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <header className="sticky top-0 z-40 bg-cream border-b border-charcoal/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard', { replace: true })} className="text-charcoal/50 text-sm">
            ← 돌아가기
          </button>
          <h1 className="text-sm font-bold text-charcoal">기간별 습관</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* 새 셋 시작 버튼 */}
        <button
          onClick={handleNewSet}
          disabled={creating}
          className="w-full py-3 rounded-xl bg-charcoal text-cream font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {creating ? '처리 중...' : '+ 새로운 5주 시작'}
        </button>

        {/* 기간별 셋 리스트 */}
        {sets.map((set) => {
          const habits = setsHabits[set.id] || []
          return (
            <div
              key={set.id}
              className={`rounded-xl p-4 border transition ${
                set.is_active
                  ? 'bg-white border-charcoal/20 shadow-sm'
                  : 'bg-charcoal/[0.02] border-charcoal/5'
              }`}
              onClick={() => handleViewSet(set)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-charcoal">
                  {set.start_date} ~ {set.end_date}
                </span>
                <button
                  onClick={(e) => handleActivateSet(e, set)}
                  className="p-1 rounded-lg transition"
                >
                  <Crown
                    size={18}
                    className={set.is_active ? 'text-yellow-500 fill-yellow-500' : 'text-charcoal/20'}
                  />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {habits.map((h) => (
                  <span
                    key={h.id}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-charcoal/5 text-charcoal/50"
                  >
                    {h.name}
                  </span>
                ))}
                {habits.length === 0 && (
                  <span className="text-[10px] text-charcoal/30">습관 없음</span>
                )}
              </div>
            </div>
          )
        })}

        {sets.length === 0 && (
          <p className="text-center text-charcoal/30 text-sm py-8">아직 습관 셋이 없습니다</p>
        )}
      </main>
    </div>
  )
}
