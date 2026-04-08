import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUserStore } from '../stores/useUserStore'
import { useHabitStore } from '../stores/useHabitStore'
import { api } from '../lib/api'

const HABIT_TYPES = [
  { value: 'S-R', label: 'S-R (자극-반응)' },
  { value: 'R-O', label: 'R-O (반응-결과)' },
  { value: 'mixed', label: '혼합' },
]

const EXAMPLES = {
  'S-R': ['아침 7시 운동', '점심 후 명상 10분', '출근길 영어 듣기', '저녁 9시 스트레칭', '기상 직후 물 한 잔', '잠들기 전 독서'],
  'R-O': ['독서 20분', '코딩 1시간', '일기 작성', '새로운 단어 5개 암기', '강의 하나 듣기', '블로그 글 쓰기'],
  'mixed': ['운동 30분', '식단 기록', '영어 공부 30분', '감사 일기', '취미 활동 1시간', '정리정돈 15분'],
}

function randomExample(type) {
  const list = EXAMPLES[type]
  return list[Math.floor(Math.random() * list.length)]
}

export default function Setup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNew = searchParams.get('new') === '1'
  const existingUser = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const { setCurrentSet, setHabits } = useHabitStore()

  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState('')
  const [userData, setUserData] = useState(null)
  const [habitSetData, setHabitSetData] = useState(null)

  // 습관 입력
  const [habitName, setHabitName] = useState('')
  const [habitType, setHabitType] = useState('S-R')
  const [placeholder, setPlaceholder] = useState(() => randomExample('S-R'))

  function handleTypeChange(type) {
    setHabitType(type)
    setPlaceholder(randomExample(type))
  }
  const [habitList, setHabitList] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 새 셋 만들기 모드: 기존 유저가 있으면 바로 습관 추가로
  useEffect(() => {
    if (isNew && existingUser) {
      async function createNewSet() {
        setLoading(true)
        try {
          const habitSet = await api.createHabitSet(existingUser.user_id)
          setUserData(existingUser)
          setHabitSetData(habitSet)
          setStep(2)
        } catch (e) {
          setError('새 셋 생성에 실패했습니다.')
        }
        setLoading(false)
      }
      createNewSet()
    }
  }, [isNew, existingUser])

  // Step 1: 사용자 등록 / 기존 유저 복구
  async function handleUserSubmit(e) {
    e.preventDefault()
    if (!userId.trim()) return
    setLoading(true)
    setError('')
    try {
      const user = await api.createUser(userId.trim())

      // 기존 유저에 활성 셋이 있으면 바로 대시보드로
      try {
        const activeSet = await api.getActiveSet(user.user_id)
        const existingHabits = await api.getHabits(activeSet.id)
        if (existingHabits.length > 0) {
          localStorage.setItem('tiny_wins_user_id', user.user_id)
          setUser(user)
          setCurrentSet(activeSet)
          setHabits(existingHabits)
          navigate('/dashboard', { replace: true })
          return
        }
      } catch (_) {
        // 활성 셋 없음 → 새로 생성
      }

      setUserData(user)
      const habitSet = await api.createHabitSet(user.user_id)
      setHabitSetData(habitSet)
      setStep(2)
    } catch (err) {
      setError('서버 연결에 실패했습니다. API 서버가 실행 중인지 확인하세요.')
    }
    setLoading(false)
  }

  // 습관 추가
  function handleAddHabit() {
    if (!habitName.trim()) return
    if (habitList.length >= 10) {
      setError('습관은 최대 10개까지 추가할 수 있습니다.')
      return
    }
    setHabitList([...habitList, { name: habitName.trim(), type: habitType }])
    setHabitName('')
    setError('')
  }

  function handleRemoveHabit(index) {
    setHabitList(habitList.filter((_, i) => i !== index))
  }

  // Step 2: 습관 저장 후 대시보드로
  async function handleComplete() {
    if (habitList.length < 3) {
      setError('최소 3개의 습관을 추가해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const created = []
      for (let i = 0; i < habitList.length; i++) {
        const h = await api.createHabit({
          set_id: habitSetData.id,
          name: habitList[i].name,
          type: habitList[i].type,
          order: i,
        })
        created.push(h)
      }
      localStorage.setItem('tiny_wins_user_id', userData.user_id)
      setUser(userData)
      setCurrentSet(habitSetData)
      setHabits(created)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError('습관 저장에 실패했습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-s1-bg">
      <div className="max-w-md w-full p-6">
        <h1 className="text-3xl font-bold text-center text-charcoal mb-1">
          Tiny Wins
        </h1>
        <p className="text-center text-charcoal/60 mb-4">
          작은 성공들이 모여 큰 변화를 만드는 35일 습관 형성
        </p>
        <div className="text-xs text-s1-point2 mb-8 space-y-1 text-center">
          <p><span className="font-semibold">S-R</span> 자극-반응 — 시간·장소 기반, 자동화가 빠름</p>
          <p className="opacity-70">예: 아침 7시 운동, 점심 후 명상</p>
          <p className="mt-1"><span className="font-semibold">R-O</span> 반응-결과 — 목표·결과 기반, 동기가 필요</p>
          <p className="opacity-70">예: 독서로 지식 습득, 코딩 실력 향상</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                사용자 ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="닉네임"
                className="w-full px-4 py-3 rounded-lg border border-s1-point2/40 bg-cream
                  text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-s1-point1"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !userId.trim()}
              className="w-full py-3 rounded-lg bg-s1-point1 text-s1-text font-semibold
                hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? '처리 중...' : '시작하기'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-cream rounded-lg p-4 text-sm text-charcoal/70">
              <p className="font-semibold text-charcoal mb-1">📅 이번 5주</p>
              <p>{habitSetData.start_date} ~ {habitSetData.end_date}</p>
              <p className="mt-2 text-xs">최소 3개, 최대 10개의 습관을 추가하세요</p>
            </div>

            {/* 타입 선택 */}
            <div className="flex gap-2">
              {HABIT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition
                    ${habitType === t.value
                      ? 'bg-s1-point1 text-s1-text'
                      : 'bg-cream text-charcoal/60 border border-s1-point2/40'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 습관 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHabit())}
                placeholder={`예: ${placeholder}`}
                className="flex-1 px-3 py-2 rounded-lg border border-s1-point2/40 bg-cream
                  text-charcoal text-sm placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-s1-point1"
              />
              <button
                onClick={handleAddHabit}
                className="px-4 py-2 rounded-lg bg-s1-point1 text-s1-text text-sm font-medium
                  hover:opacity-90 transition"
              >
                추가
              </button>
            </div>

            {/* 습관 리스트 */}
            <ul className="space-y-2">
              {habitList.map((h, i) => (
                <li key={i} className="flex items-center justify-between bg-cream rounded-lg px-4 py-3">
                  <div>
                    <span className="text-charcoal font-medium">{h.name}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-s1-point2/20 text-charcoal/60">
                      {h.type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveHabit(i)}
                    className="text-charcoal/40 hover:text-charcoal text-lg"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            {habitList.length > 0 && (
              <p className="text-xs text-charcoal/50 text-center">
                {habitList.length}개 추가됨 {habitList.length < 3 && `(${3 - habitList.length}개 더 필요)`}
              </p>
            )}

            <button
              onClick={handleComplete}
              disabled={loading || habitList.length < 3}
              className="w-full py-3 rounded-lg bg-s1-point1 text-s1-text font-semibold
                hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? '저장 중...' : '완료'}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
