import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/useUserStore'
import { useHabitStore } from '../stores/useHabitStore'
import { api } from '../lib/api'

const allFruitImages = import.meta.glob('../assets/fruit_frames/**/*.png', { eager: true, import: 'default' })

function getScore(records) {
  return records.reduce((sum, r) => sum + r.count, 0)
}

function getDayNumber(startDate) {
  const start = new Date(startDate)
  const today = new Date()
  return Math.min(Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1, 35)
}

export default function Battle({ embedded = false }) {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const { currentSet } = useHabitStore()

  const [friendId, setFriendId] = useState('')
  const [myProgress, setMyProgress] = useState(null)
  const [friendProgress, setFriendProgress] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFriendInput, setShowFriendInput] = useState(false)

  // 내 진척도 로드
  useEffect(() => {
    if (!user) return
    api.getProgress(user.user_id).then(setMyProgress).catch(() => {})
  }, [user])

  // 저장된 상대 복원
  useEffect(() => {
    const saved = localStorage.getItem('tiny_wins_battle_friend')
    if (saved) {
      api.getProgress(saved).then(setFriendProgress).catch(() => {
        localStorage.removeItem('tiny_wins_battle_friend')
      })
    }
  }, [])

  async function handleAddFriend() {
    if (!friendId.trim()) return
    setError('')
    setLoading(true)
    try {
      const progress = await api.getProgress(friendId.trim())
      setFriendProgress(progress)
      localStorage.setItem('tiny_wins_battle_friend', friendId.trim())
      await api.addFriend(user.user_id, friendId.trim())
      setShowFriendInput(false)
      setFriendId('')
    } catch (e) {
      setError('유저를 찾을 수 없습니다')
    }
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  function build35DayData(progress) {
    if (!progress) return []
    const start = new Date(progress.start_date)
    const data = []
    for (let i = 0; i < 35; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const rec = progress.records.find((r) => r.date === dateStr)
      data.push({
        label: `${month}/${day}`,
        fullDate: dateStr,
        count: rec ? rec.count : 0,
        total: progress.habit_count || 1,
      })
    }
    return data
  }

  const myData = useMemo(() => build35DayData(myProgress), [myProgress])
  const friendData = useMemo(() => build35DayData(friendProgress), [friendProgress])

  function ScatterColumn({ data, dotColor, dotToday, alignRight }) {
    const reversed = [...data].reverse()
    const maxCount = data.length > 0 ? data[0].total : 1
    return (
      <div className="flex-1">
        {reversed.map((item, i) => {
          const isToday = item.fullDate === today
          const isFuture = item.fullDate > today
          const pct = ((item.count + 0.5) / (maxCount + 1)) * 100
          return (
            <div key={i} className="flex items-center gap-0 py-[1px]" style={{ direction: alignRight ? 'rtl' : 'ltr' }}>
              <div className="flex-1 h-[8px] relative">
                {!isFuture && (
                  <div
                    className="absolute top-1/2 w-[6px] h-[6px] rounded-full"
                    style={{
                      left: alignRight ? undefined : `${pct}%`,
                      right: alignRight ? `${pct}%` : undefined,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: isToday ? dotToday : dotColor,
                      boxShadow: isToday ? `0 0 4px ${dotToday}` : 'none',
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <header className="sticky top-0 z-40 bg-cream border-b border-charcoal/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {!embedded && (
            <button onClick={() => navigate('/dashboard', { replace: true })} className="text-charcoal/50 text-sm">
              ← 돌아가기
            </button>
          )}
          <h1 className={`text-sm font-bold text-charcoal ${embedded ? 'mx-auto' : ''}`}>겨루기</h1>
          {!embedded && <div className="w-16" />}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* 친구 추가/변경 입력 */}
        {(!friendProgress || showFriendInput) && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                placeholder="상대방 사용자 ID"
                className="flex-1 px-3 py-2.5 rounded-xl border border-charcoal/10 bg-white text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none"
              />
              <button
                onClick={handleAddFriend}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-charcoal text-cream text-xs font-semibold disabled:opacity-50"
              >
                {loading ? '...' : '도전'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {showFriendInput && (
              <button onClick={() => setShowFriendInput(false)} className="w-full text-[10px] text-charcoal/30 text-center">취소</button>
            )}
            {!friendProgress && <p className="text-[10px] text-charcoal/30 text-center">상대방의 습관 내용은 비공개입니다</p>}
          </div>
        )}

        {/* 비교 뷰 */}
        {friendProgress && (
          <div className="space-y-4">
            {/* 이름 + 점수 헤더 */}
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs font-bold text-charcoal">{myProgress?.display_name}</span>
                <span className="text-[10px] text-charcoal/40 ml-1">{getScore(myProgress?.records || [])}점</span>
              </div>
              <span className="text-[10px] text-charcoal/30">vs</span>
              <div className="text-right">
                <span className="text-xs font-bold text-charcoal">{friendProgress.display_name}</span>
                <span className="text-[10px] text-charcoal/40 ml-1">{getScore(friendProgress.records)}점</span>
              </div>
            </div>

            {/* 35일 비교 그래프 */}
            <div className="bg-white rounded-xl shadow-sm p-3">
              <div className="flex gap-0">
                {/* 왼쪽: 나 (오른쪽 정렬) */}
                <ScatterColumn
                  data={myData}
                  dotColor="#A6A18C"
                  dotToday="#BB8DB9"
                  alignRight={true}
                />

                {/* 가운데: 날짜 */}
                <div className="flex-shrink-0 w-10">
                  {[...myData].reverse().map((item, i) => {
                    const isToday = item.fullDate === today
                    const isFuture = item.fullDate > today
                    return (
                      <div key={i} className="h-[10px] flex items-center justify-center">
                        <span className={`text-[7px] ${isToday ? 'font-bold text-charcoal' : isFuture ? 'text-charcoal/15' : 'text-charcoal/30'}`}>
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 오른쪽: 상대 (왼쪽 정렬) */}
                <ScatterColumn
                  data={friendData}
                  dotColor="#93BDE2"
                  dotToday="#E9BF99"
                  alignRight={false}
                />
              </div>
            </div>

            {/* 과일 화분 */}
            <div className="flex items-center justify-around py-2">
              <div className="text-center">
                <img
                  src={allFruitImages[`../assets/fruit_frames/${myProgress?.fruit || 'strawberry'}/${myProgress?.fruit || 'strawberry'}_${getDayNumber(myProgress?.start_date)}.png`]}
                  alt="my fruit"
                  className="w-16 h-16 object-contain mx-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-center">
                <img
                  src={allFruitImages[`../assets/fruit_frames/${friendProgress.fruit || 'strawberry'}/${friendProgress.fruit || 'strawberry'}_${getDayNumber(friendProgress.start_date)}.png`]}
                  alt="friend fruit"
                  className="w-16 h-16 object-contain mx-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            <p className="text-[10px] text-charcoal/30 text-center">습관 내용 및 개수는 비공개입니다</p>

            {/* 상대 변경 / 해제 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFriendInput(true)}
                className="flex-1 py-2.5 rounded-xl bg-charcoal/5 text-charcoal/50 text-xs font-medium"
              >
                상대 변경
              </button>
              <button
                onClick={() => { setFriendProgress(null); localStorage.removeItem('tiny_wins_battle_friend') }}
                className="flex-1 py-2.5 rounded-xl bg-charcoal/5 text-red-400 text-xs font-medium"
              >
                해제
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
