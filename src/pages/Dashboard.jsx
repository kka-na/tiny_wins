import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Settings, Check, Calendar, BookOpen } from 'lucide-react'
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useUserStore } from '../stores/useUserStore'
import { useHabitStore } from '../stores/useHabitStore'
import { api } from '../lib/api'

const FRUITS = [
  { key: 'strawberry', emoji: '🍓' },
  { key: 'blueberry', emoji: '🫐' },
  { key: 'cherry', emoji: '🍒' },
  { key: 'grape', emoji: '🍇' },
  { key: 'lemon', emoji: '🍋' },
  { key: 'mango', emoji: '🥭' },
  { key: 'orange', emoji: '🍊' },
  { key: 'peach', emoji: '🍑' },
  { key: 'watermelon', emoji: '🍉' },
]

const allFruitImages = import.meta.glob('../assets/fruit_frames/**/*.png', { eager: true, import: 'default' })

const DIARY_EXAMPLES = [
  { highlight: '저녁 운동 건너뜀', reflection: '퇴근이 늦어 피로가 쌓였던 게 원인', intention: '내일은 점심에 짧게라도 움직이기' },
  { highlight: '집중이 잘 됐던 하루', reflection: '오전에 카페인 없이 시작한 게 도움된 것 같음', intention: '이 패턴 유지해보기' },
  { highlight: '독서 30분 완료', reflection: '자기 전 폰 대신 책을 집어든 게 효과적', intention: '내일도 폰은 침대 밖에 두기' },
  { highlight: '식단이 무너졌음', reflection: '점심 약속이 변수였고 선택지가 없었음', intention: '외식 예정일엔 저녁을 가볍게 조정하기' },
  { highlight: '명상 빠짐', reflection: '아침이 바빠서 미뤘다가 그냥 넘어감', intention: '내일은 일어나자마자 2분만이라도 하기' },
  { highlight: '글쓰기 잘 됐음', reflection: '조용한 오전 시간이 확보된 게 컸음', intention: '오전 집중 블록 지키는 것 계속하기' },
  { highlight: '잠을 늦게 잠', reflection: '유튜브를 멍하니 보다 놓쳤음', intention: '11시에 폰 알람 설정해두기' },
  { highlight: '물 마시기 잘 지킴', reflection: '책상에 텀블러를 미리 꺼내둔 덕분', intention: '내일도 아침에 바로 세팅하기' },
  { highlight: '계획했던 공부 절반만 함', reflection: '중간에 다른 일이 끼어들었고 집중이 흐트러짐', intention: '내일은 방해 차단 앱 켜두기' },
  { highlight: '하루가 빠르게 지나간 느낌', reflection: '의도 없이 흘려보낸 탓', intention: '내일 아침 딱 한 가지 우선순위 정하고 시작하기' },
]

function getPhase(startDate) {
  const start = new Date(startDate)
  const today = new Date()
  const day = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
  if (day <= 7) return { day, total: 35, prefix: 's1' }
  if (day <= 14) return { day, total: 35, prefix: 's2' }
  if (day <= 21) return { day, total: 35, prefix: 's3' }
  if (day <= 28) return { day, total: 35, prefix: 's4' }
  return { day, total: 35, prefix: 's5' }
}

const PHASE_THEME = {
  s1: {
    bg: 'bg-s1-bg', text: 'text-charcoal', textSub: 'text-charcoal/60',
    point1: 'bg-s1-point1', point1Text: 'text-s1-text',
    cardBg: 'bg-cream',
    dotColor: '#A6A18C', dotToday: '#BB8DB9',
    barProgress: 'from-[#BB8DB9] to-[#A6A18C]',
    point2Hex: '#A6A18C',
  },
  s2: {
    bg: 'bg-s2-bg', text: 'text-s2-text', textSub: 'text-s2-text/60',
    point1: 'bg-s2-point1', point1Text: 'text-cream',
    cardBg: 'bg-cream',
    dotColor: '#93BDE2', dotToday: '#E9BF99',
    barProgress: 'from-[#E9BF99] to-[#93BDE2]',
    point2Hex: '#93BDE2',
  },
  s3: {
    bg: 'bg-s3-bg', text: 'text-s3-text', textSub: 'text-s3-text/60',
    point1: 'bg-s3-point1', point1Text: 'text-s3-point2',
    cardBg: 'bg-cream',
    dotColor: '#a7b9d0', dotToday: '#474c14',
    barProgress: 'from-[#474c14] to-[#a7b9d0]',
    point2Hex: '#a7b9d0',
  },
  s4: {
    bg: 'bg-s4-bg', text: 'text-s4-text', textSub: 'text-s4-text/60',
    point1: 'bg-s4-point1', point1Text: 'text-s4-text',
    cardBg: 'bg-cream',
    dotColor: '#D3AB70', dotToday: '#B8503C',
    barProgress: 'from-[#B8503C] to-[#D3AB70]',
    point2Hex: '#D3AB70',
  },
  s5: {
    bg: 'bg-s5-bg', text: 'text-s5-text', textSub: 'text-s5-text/60',
    point1: 'bg-s5-point1', point1Text: 'text-s5-text',
    cardBg: 'bg-cream',
    dotColor: '#D19F59', dotToday: '#A4383E',
    barProgress: 'from-[#A4383E] to-[#D19F59]',
    point2Hex: '#D19F59',
  },
}

const STAGE_INFO = {
  s1: {
    title: '1단계 (1-7일)',
    emoji: '🌱',
    subtitle: '왜 이 습관들인지 생각하고 동기부여하세요.',
    brain: 'DMS(배내측 선조체)와 PFC(전전두엽 피질)가 활성화됩니다. 뇌가 각 행동의 결과를 분석하고, 이 습관이 왜 필요한지 이해하려 합니다.',
    balance: 'S-R 30% + R-O 70% → 목표 이해와 동기 중심',
    tips: '1. 왜 이 습관들이 필요한지 명확히 하기\n2. 매일 같은 시간에 반복하기\n3. 의식적 노력이 필요한 시기 — 동기부여가 핵심',
    strategy: 'R-O(목표 기반) 습관에 집중하세요. "왜 하는지"를 매일 떠올리는 것이 효과적입니다.',
  },
  s2: {
    title: '2단계 (8-14일)',
    emoji: '🔄',
    subtitle: '일관성이 가장 중요합니다. 계속하세요!',
    brain: 'DMS에서 DLS(배외측 선조체)로의 전환이 시작됩니다. 뇌가 의식적 판단(R-O)에서 자동 반응(S-R)으로 넘어가려 합니다.',
    balance: 'S-R 40% + R-O 60% → 자동화 시작, 동기 유지',
    tips: '1. 절대 놓치지 말기 — 연속성이 전환의 핵심\n2. S-R 습관이 조금씩 편해지기 시작\n3. 가장 포기하기 쉬운 시기, 버티는 것이 중요',
    strategy: 'S-R 습관이 자동화되기 시작합니다. 시간/장소 단서를 일정하게 유지하세요.',
  },
  s3: {
    title: '3단계 (15-21일)',
    emoji: '⚡',
    subtitle: '절반을 넘었습니다. 변화가 느껴지기 시작해요.',
    brain: 'DMS와 DLS가 균형을 이루는 전환 구간입니다. 일부 습관은 의식 없이 실행되고, 일부는 아직 노력이 필요합니다.',
    balance: 'S-R 50% + R-O 50% → 자동화와 동기 균형',
    tips: '1. 결과가 서서히 보이기 시작합니다\n2. 쉬운 습관은 자동화, 어려운 습관에 에너지 집중\n3. 중간 점검 — 습관 난이도 재평가 시점',
    strategy: '자동화된 S-R 습관의 안정성을 확인하고, R-O 습관에 의식적 에너지를 투자하세요.',
  },
  s4: {
    title: '4단계 (22-28일)',
    emoji: '🔥',
    subtitle: '거의 다 왔습니다. 뇌가 새 회로를 굳히고 있어요.',
    brain: 'DLS(배외측 선조체)가 우세해집니다. 대부분의 행동이 자극에 의해 자동 실행되기 시작합니다.',
    balance: 'S-R 65% + R-O 35% → 자동화 우세',
    tips: '1. 대부분의 S-R 습관이 자동화 완료\n2. R-O 습관도 루틴에 편입되기 시작\n3. 의지력 소모가 눈에 띄게 줄어듦',
    strategy: '자동화를 믿고 유지하세요. 의식적 노력 없이도 습관이 실행되는 경험이 늘어납니다.',
  },
  s5: {
    title: '5단계 (29-35일)',
    emoji: '👑',
    subtitle: '습관이 당신의 일부가 되었습니다.',
    brain: 'DLS가 지배적입니다. 행동이 자극에 의해 완전 자동으로 실행되며, 의식적 노력 없이도 습관이 유지됩니다.',
    balance: 'S-R 80% + R-O 20% → 완전 자동화',
    tips: '1. 의지력이 거의 필요 없는 단계\n2. 습관이 정착되어 자연스럽게 반복됩니다\n3. 다음 5주 습관 셋을 계획해볼 시기',
    strategy: '축하합니다! 습관이 정착되었습니다. 새로운 도전을 준비하세요.',
  },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const { currentSet, habits, records, diaries, setHabits, setRecords, setDiaries } = useHabitStore()

  const [displayDays, setDisplayDays] = useState(10)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showFruitPicker, setShowFruitPicker] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHabitManager, setShowHabitManager] = useState(false)
  const [resetStep, setResetStep] = useState(0) // 0: 안보임, 1: 첫번째 확인, 2: 두번째 확인
  const [editingHabit, setEditingHabit] = useState(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('S-R')
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitType, setNewHabitType] = useState('S-R')
  const [checkedHabits, setCheckedHabits] = useState([])
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const selectedFruit = user?.fruit || localStorage.getItem('tiny_wins_fruit') || 'strawberry'
  const [showDiaryModal, setShowDiaryModal] = useState(false)
  const [diaryExample, setDiaryExample] = useState(null)
  const [diaryHighlight, setDiaryHighlight] = useState('')
  const [diaryReflection, setDiaryReflection] = useState('')
  const [diaryIntention, setDiaryIntention] = useState('')
  const [diaryDate, setDiaryDate] = useState(() => new Date().toISOString().split('T')[0])
  const [diarySaving, setDiarySaving] = useState(false)
  const scrollRef = useRef(null)

  const phase = currentSet ? getPhase(currentSet.start_date) : { day: 1, total: 35, prefix: 's1' }
  const theme = PHASE_THEME[phase.prefix]
  const stageInfo = STAGE_INFO[phase.prefix]


  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayLabel = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

  // 오늘 기록 가져오기
  const todayRecord = records.find((r) => r.date === todayStr)
  const completedToday = todayRecord ? todayRecord.completed_habits : []

  // 초기 로드
  useEffect(() => {
    if (!currentSet) return
    api.getRecords(currentSet.id).then(setRecords).catch(() => {})
  }, [currentSet])

  // 그래프 데이터 생성
  const chartData = useMemo(() => {
    if (!currentSet) return []
    const start = new Date(currentSet.start_date)
    const data = []

    for (let i = 0; i < 35; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const record = records.find((r) => r.date === dateStr)

      data.push({
        date: `${month}/${day}`,
        fullDate: dateStr,
        count: record ? record.completion_count : 0,
      })
    }
    return data
  }, [currentSet, records, displayDays])

  const chartDataReversed = useMemo(() => [...chartData].reverse(), [chartData])

  // 모달 열 때 오늘 기록 반영
  function openRecordModal() {
    setRecordDate(todayStr)
    setCheckedHabits([...completedToday])
    setShowRecordModal(true)
  }

  function handleRecordDateChange(dateStr) {
    setRecordDate(dateStr)
    const existing = records.find((r) => r.date === dateStr)
    setCheckedHabits(existing ? [...existing.completed_habits] : [])
  }

  // 일기 로드
  useEffect(() => {
    if (currentSet) {
      api.getDiaries(currentSet.id).then(setDiaries).catch(() => {})
    }
  }, [currentSet])

  function openDiaryModal() {
    setDiaryDate(todayStr)
    const existing = diaries.find((d) => d.date === todayStr)
    setDiaryHighlight(existing?.highlight || '')
    setDiaryReflection(existing?.habit_reflection || '')
    setDiaryIntention(existing?.tomorrow_intention || '')
    setDiaryExample(DIARY_EXAMPLES[Math.floor(Math.random() * DIARY_EXAMPLES.length)])
    setShowDiaryModal(true)
  }

  function handleDiaryDateChange(dateStr) {
    setDiaryDate(dateStr)
    const existing = diaries.find((d) => d.date === dateStr)
    setDiaryHighlight(existing?.highlight || '')
    setDiaryReflection(existing?.habit_reflection || '')
    setDiaryIntention(existing?.tomorrow_intention || '')
  }

  async function handleDiarySave() {
    if (!currentSet) return
    setDiarySaving(true)
    try {
      await api.saveDiary({
        set_id: currentSet.id,
        date: diaryDate,
        highlight: diaryHighlight,
        emotion: '',
        habit_reflection: diaryReflection,
        tomorrow_intention: diaryIntention,
      })
      const updated = await api.getDiaries(currentSet.id)
      setDiaries(updated)
      setShowDiaryModal(false)
    } catch (e) {
      console.error(e)
    }
    setDiarySaving(false)
  }

  function toggleHabit(habitId) {
    setCheckedHabits((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    )
  }

  function startEditHabit(habit) {
    setEditingHabit(habit)
    setEditName(habit.name)
    setEditType(habit.type)
  }

  async function handleSaveHabit() {
    if (!editingHabit || !editName.trim()) return
    await api.updateHabit(editingHabit.id, { name: editName.trim(), type: editType })
    const updated = await api.getHabits(currentSet.id)
    setHabits(updated)
    setEditingHabit(null)
  }

  async function handleAddHabit() {
    if (!newHabitName.trim() || !currentSet || habits.length >= 10) return
    await api.createHabit({
      set_id: currentSet.id,
      name: newHabitName.trim(),
      type: newHabitType,
      order: habits.length,
    })
    const updated = await api.getHabits(currentSet.id)
    setHabits(updated)
    setNewHabitName('')
  }

  async function handleDeleteHabit(id) {
    if (habits.length <= 3) return
    await api.deleteHabit(id)
    const updated = await api.getHabits(currentSet.id)
    setHabits(updated)
  }

  async function handleRecordSave() {
    if (!currentSet) return
    setSaving(true)
    try {
      await api.saveRecord(currentSet.id, recordDate, checkedHabits)
      const updated = await api.getRecords(currentSet.id)
      setRecords(updated)
      setShowRecordModal(false)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  // 스크롤 초기화: 오늘 날짜가 중앙에 오도록
  useEffect(() => {
    if (!scrollRef.current || displayDays !== 10) return
    const todayIndex = chartData.findIndex((d) => d.fullDate === todayStr)
    if (todayIndex === -1) return
    const colWidth = scrollRef.current.scrollWidth / chartData.length
    const containerWidth = scrollRef.current.clientWidth
    const targetScroll = todayIndex * colWidth - containerWidth / 2 + colWidth / 2
    scrollRef.current.scrollLeft = Math.max(0, targetScroll)
  }, [displayDays, chartData])

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500 pb-20`}>
      {/* 헤더 */}
      <header className={`sticky top-0 z-40 ${theme.bg} border-b border-black/10`}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 유저 습관 (터치하면 설정) */}
            <div className="relative">
              <button
                className={`text-xs font-medium ${theme.text} flex items-center gap-1 hover:opacity-70 transition`}
                onClick={() => setShowSettings(!showSettings)}
              >
                {user?.display_name}의 습관 만들기
              </button>
              {showSettings && (
                <div className="absolute top-8 left-0 bg-cream rounded-xl shadow-lg p-3 z-50 min-w-[160px] space-y-2">
                  <button className="w-full text-left text-xs text-charcoal hover:bg-charcoal/5 rounded-lg px-3 py-2" onClick={() => { setShowHabitManager(true); setShowSettings(false) }}>습관 수정/관리</button>
                  <button className="w-full text-left text-xs text-charcoal hover:bg-charcoal/5 rounded-lg px-3 py-2" onClick={() => { setShowSettings(false); navigate('/habit-sets') }}>새로운 5주 시작</button>
                  <button className="w-full text-left text-xs text-red-500 hover:bg-red-50 rounded-lg px-3 py-2" onClick={() => { setShowSettings(false); setResetStep(1) }}>초기화</button>
                </div>
              )}
            </div>

            {/* 오른쪽: 과일 이미지 */}
            <div className="relative">
              <img
                src={allFruitImages[`../assets/fruit_frames/${selectedFruit}/${selectedFruit}_${Math.min(phase.day, 35)}.png`]}
                alt={`Day ${phase.day}`}
                className="w-14 h-14 object-contain cursor-pointer"
                style={{ imageRendering: 'pixelated' }}
                onClick={() => setShowFruitPicker(!showFruitPicker)}
              />
              {showFruitPicker && (
                <div className="absolute top-16 right-0 bg-cream rounded-xl shadow-lg p-2 flex gap-1 z-50">
                  {FRUITS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        localStorage.setItem('tiny_wins_fruit', f.key)
                        if (user) {
                          api.updateUser(user.user_id, { fruit: f.key })
                          setUser({ ...user, fruit: f.key })
                        }
                        setShowFruitPicker(false)
                      }}
                      className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition ${
                        selectedFruit === f.key ? 'bg-charcoal/10' : 'hover:bg-charcoal/5'
                      }`}
                    >
                      {f.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* 그래프 */}
        <div className={`${theme.cardBg} rounded-xl shadow-sm p-4`}>
          <div className="flex justify-end items-center mb-4">
            <div className="flex gap-1">
              {[10, 35].map((d) => (
                <button
                  key={d}
                  onClick={() => setDisplayDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    displayDays === d
                      ? `${theme.point1} ${theme.point1Text}`
                      : 'bg-charcoal/5 text-charcoal/50'
                  }`}
                >
                  {d}일
                </button>
              ))}
            </div>
          </div>

          {displayDays === 10 ? (
            /* 14일 뷰: 가로 도트 (좌우 스크롤, 14개씩 보임) */
            <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
              <div className="flex gap-0 items-end" style={{ width: `${(chartData.length / 10) * 100}%` }}>
                {chartData.map((item, index) => {
                  const isToday = item.date === todayLabel
                  const isFuture = item.fullDate > todayStr
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      {/* 도트들 (아래에서부터 채움) */}
                      <div className="flex flex-col gap-1 items-center">
                        {Array(Math.max(habits.length - item.count, 0)).fill(0).map((_, j) => (
                          <div key={`e-${j}`} className="w-3 h-3 rounded-full bg-charcoal/10" />
                        ))}
                        {!isFuture && Array(item.count).fill(0).map((_, j) => (
                          <div
                            key={j}
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: isToday ? theme.dotToday : theme.dotColor,
                              boxShadow: isToday ? `0 0 5px ${theme.dotToday}` : 'none',
                            }}
                          />
                        ))}
                      </div>
                      {/* 스페이서 */}
                      <div className="flex-1 min-h-2" />
                      {/* 날짜 라벨 */}
                      <div
                        className={`text-[9px] flex items-center justify-center flex-shrink-0 ${
                          isToday ? 'font-bold text-charcoal' : isFuture ? 'text-charcoal/20' : 'text-charcoal/40'
                        }`}
                        style={{
                          width: '32px',
                          height: '28px',
                          whiteSpace: 'nowrap',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'center center',
                        }}
                      >
                        {item.date}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* 35일 뷰: scatter 점 그래프 (Y축=날짜, X축=완료 개수) */
            <div ref={scrollRef}>
              <div className="relative">
                {/* X축 라벨 */}
                <div className="flex ml-9 mb-3">
                  {Array.from({ length: habits.length + 1 }, (_, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[8px] text-charcoal/30">{i}</span>
                    </div>
                  ))}
                </div>
                {/* 행들 */}
                {chartDataReversed.map((item, index) => {
                  const isToday = item.date === todayLabel
                  const isPast = item.fullDate < todayStr
                  const isFuture = item.fullDate > todayStr
                  const maxCount = habits.length || 1
                  const dotLeft = ((item.count + 0.5) / (maxCount + 1)) * 100
                  return (
                    <div key={index} className="flex items-center gap-0 py-[1px]">
                      <span
                        className={`text-[8px] w-9 text-right pr-1 flex-shrink-0 ${
                          isToday ? 'font-bold text-charcoal' : isFuture ? 'text-charcoal/20' : 'text-charcoal/40'
                        }`}
                      >
                        {item.date}
                      </span>
                      <div className="flex-1 h-[10px] relative">
                        {!isFuture && (
                          <div
                            className="absolute top-1/2 w-[7px] h-[7px] rounded-full"
                            style={{
                              left: `${dotLeft}%`,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: isToday ? theme.dotToday : theme.dotColor,
                              boxShadow: isToday ? `0 0 6px ${theme.dotToday}` : 'none',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 오늘의 습관 기록 + 일기 버튼 (4:1) */}
        <div className="flex gap-2">
          <button
            onClick={openRecordModal}
            className={`flex-[4] py-3 px-4 rounded-xl font-semibold shadow-sm transition flex items-center justify-center gap-2 ${theme.point1} ${theme.point1Text}`}
          >
            <Calendar size={18} />
            습관 기록 ({completedToday.length}/{habits.length})
          </button>
          <button
            onClick={openDiaryModal}
            className={`flex-[1] py-3 rounded-xl font-semibold shadow-sm transition flex items-center justify-center ${theme.point1} ${theme.point1Text} opacity-80`}
          >
            <BookOpen size={18} />
          </button>
        </div>

        {/* 뇌 과학 팁 (10일 뷰에서만) */}
        {displayDays === 10 && <div className={`${theme.cardBg} rounded-xl shadow-sm p-4 border border-charcoal/5 space-y-3`}>
          <h4 className="font-semibold text-charcoal text-sm">
            {stageInfo.emoji} {stageInfo.title}
          </h4>
          <p className="text-xs text-charcoal/50">{stageInfo.subtitle}</p>
          <div>
            <h4 className="font-semibold text-charcoal text-xs mb-1">🧠 뇌 변화</h4>
            <p className="text-xs text-charcoal/60 leading-relaxed">{stageInfo.brain}</p>
          </div>
          <div>
            <h4 className="font-semibold text-charcoal text-xs mb-1">⚖️ S-R / R-O 균형</h4>
            <p className="text-xs text-charcoal/60 leading-relaxed">{stageInfo.balance}</p>
          </div>
          <div>
            <h4 className="font-semibold text-charcoal text-xs mb-1">💡 전략</h4>
            <p className="text-xs text-charcoal/60 leading-relaxed">{stageInfo.strategy}</p>
          </div>
          <div>
            <h4 className="font-semibold text-charcoal text-xs mb-1">💪 핵심</h4>
            <p className="text-xs text-charcoal/60 leading-relaxed whitespace-pre-line">{stageInfo.tips}</p>
          </div>
        </div>}
      </main>

      {/* 습관 기록 모달 (바텀시트) */}
      {showRecordModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowRecordModal(false)} onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          <div
            className="bg-cream w-full rounded-t-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <button
                  onClick={() => {
                    const input = document.getElementById('record-date-input')
                    if (input) { input.showPicker ? input.showPicker() : input.focus() }
                  }}
                  className="text-lg font-bold text-charcoal flex items-center gap-1.5 hover:opacity-70 transition"
                >
                  {new Date(recordDate + 'T00:00:00').toLocaleDateString('ko-KR')}
                  <span className="text-xs text-charcoal/40">▼</span>
                </button>
                {recordDate !== todayStr && (
                  <span className="text-[10px] text-charcoal/40 block">지난 기록 수정 중</span>
                )}
                <input
                  id="record-date-input"
                  type="date"
                  value={recordDate}
                  min={currentSet?.start_date}
                  max={todayStr}
                  onChange={(e) => handleRecordDateChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>
              <button onClick={() => setShowRecordModal(false)} className="text-2xl text-charcoal/30">
                ×
              </button>
            </div>

            <div className="space-y-1 mb-4">
              {habits.map((habit) => {
                const isChecked = checkedHabits.includes(habit.id)
                return (
                  <label
                    key={habit.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border ${
                      isChecked
                        ? 'bg-charcoal/[0.02]'
                        : 'bg-charcoal/[0.02] border-transparent hover:bg-charcoal/[0.05]'
                    }`}
                    style={isChecked ? { borderColor: theme.point2Hex } : {}}
                  >
                    <div
                      className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border"
                      style={{
                        borderColor: theme.point2Hex,
                        backgroundColor: isChecked ? theme.point2Hex : 'transparent',
                      }}
                    >
                      {isChecked && <Check size={10} className="text-white" />}
                    </div>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleHabit(habit.id)} className="hidden" />
                    <div className="flex-1">
                      <div className="font-medium text-charcoal text-xs">{habit.name}</div>
                    </div>
                    {isChecked && <Check size={14} style={{ color: theme.point2Hex }} />}
                  </label>
                )
              })}
            </div>

            <button
              onClick={handleRecordSave}
              disabled={saving}
              className={`w-full py-3 rounded-xl font-semibold transition ${theme.point1} ${theme.point1Text} disabled:opacity-50`}
            >
              {saving ? '저장 중...' : '확인'}
            </button>
          </div>
        </div>
      , document.body)}

      {/* 습관 수정/관리 모달 */}
      {showHabitManager && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => { setShowHabitManager(false); setEditingHabit(null) }} onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          <div
            className="bg-cream w-full rounded-t-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-charcoal">습관 수정/관리</h2>
              <button onClick={() => { setShowHabitManager(false); setEditingHabit(null) }} className="text-2xl text-charcoal/30">×</button>
            </div>

            <div className="space-y-2 mb-4">
              {habits.map((habit) => (
                <div key={habit.id}>
                  {editingHabit?.id === habit.id ? (
                    <div className="bg-charcoal/[0.03] rounded-xl p-3 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/10 bg-white text-sm text-charcoal focus:outline-none"
                      />
                      <div className="flex gap-1">
                        {['S-R', 'R-O', 'mixed'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setEditType(t)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                              editType === t ? 'bg-charcoal text-cream' : 'bg-charcoal/5 text-charcoal/50'
                            }`}
                          >
                            {t === 'S-R' ? 'S-R' : t === 'R-O' ? 'R-O' : '혼합'}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveHabit}
                          className="flex-1 py-2 rounded-lg bg-charcoal text-cream text-xs font-medium"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingHabit(null)}
                          className="flex-1 py-2 rounded-lg bg-charcoal/5 text-charcoal text-xs font-medium"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-charcoal/[0.03] rounded-xl p-3">
                      <div className="flex-1" onClick={() => startEditHabit(habit)}>
                        <div className="font-medium text-charcoal text-sm">{habit.name}</div>
                        <div className="text-xs text-charcoal/40">
                          {habit.type === 'S-R' ? '🔄 자극-반응' : habit.type === 'R-O' ? '🎯 반응-결과' : '🔀 혼합'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        disabled={habits.length <= 3}
                        className="text-red-400 hover:text-red-600 text-lg disabled:opacity-20 px-2"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 습관 추가 */}
            {habits.length < 10 && (
              <div className="space-y-2 mb-4">
                <div className="flex gap-1">
                  {['S-R', 'R-O', 'mixed'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewHabitType(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                        newHabitType === t ? 'bg-charcoal text-cream' : 'bg-charcoal/5 text-charcoal/50'
                      }`}
                    >
                      {t === 'mixed' ? '혼합' : t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                    placeholder="새 습관 추가"
                    className="flex-1 px-3 py-2 rounded-lg border border-charcoal/10 bg-white text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none"
                  />
                  <button
                    onClick={handleAddHabit}
                    className="px-4 py-2 rounded-lg bg-charcoal text-cream text-xs font-medium"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-charcoal/30 text-center">습관을 터치하면 수정 (최소 3개, 최대 10개)</p>
          </div>
        </div>
      , document.body)}

      {/* 초기화 확인 모달 */}
      {resetStep > 0 && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setResetStep(0)} onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          <div className="bg-cream rounded-xl shadow-2xl p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            {resetStep === 1 && (
              <>
                <h2 className="text-base font-bold text-charcoal mb-2">초기화</h2>
                <p className="text-xs text-charcoal/60 mb-4">
                  모든 습관, 기록, 셋이 삭제됩니다. 정말 초기화하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetStep(2)}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold"
                  >
                    네, 초기화
                  </button>
                  <button
                    onClick={() => setResetStep(0)}
                    className="flex-1 py-2.5 rounded-xl bg-charcoal/5 text-charcoal text-xs font-medium"
                  >
                    취소
                  </button>
                </div>
              </>
            )}
            {resetStep === 2 && (
              <>
                <h2 className="text-base font-bold text-red-500 mb-2">마지막 확인</h2>
                <p className="text-xs text-charcoal/60 mb-4">
                  이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구 삭제됩니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await api.resetUser(user.user_id)
                      localStorage.removeItem('tiny_wins_user_id')
                      localStorage.removeItem('tiny_wins_fruit')
                      window.location.href = '/setup'
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    영구 삭제
                  </button>
                  <button
                    onClick={() => setResetStep(0)}
                    className="flex-1 py-2.5 rounded-xl bg-charcoal/5 text-charcoal text-xs font-medium"
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      , document.body)}

      {/* 일기 작성 모달 */}
      {showDiaryModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDiaryModal(false)} onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          <div
            className="bg-cream w-full rounded-t-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <button
                  onClick={() => {
                    const input = document.getElementById('diary-date-input')
                    if (input) { input.showPicker ? input.showPicker() : input.focus() }
                  }}
                  className="text-lg font-bold text-charcoal flex items-center gap-1.5 hover:opacity-70 transition"
                >
                  {new Date(diaryDate + 'T00:00:00').toLocaleDateString('ko-KR')} 일기
                  <span className="text-xs text-charcoal/40">▼</span>
                </button>
                {diaryDate !== todayStr && (
                  <span className="text-[10px] text-charcoal/40 block">지난 일기 수정 중</span>
                )}
                <input
                  id="diary-date-input"
                  type="date"
                  value={diaryDate}
                  min={currentSet?.start_date}
                  max={todayStr}
                  onChange={(e) => handleDiaryDateChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>
              <button onClick={() => setShowDiaryModal(false)} className="text-2xl text-charcoal/30">×</button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-2 text-[10px] font-medium pointer-events-none" style={{ color: theme.point2Hex }}>무슨일</span>
                <textarea
                  value={diaryHighlight}
                  onChange={(e) => setDiaryHighlight(e.target.value)}
                  placeholder={diaryExample?.highlight || '오늘 가장 인상적이었던 일'}
                  className="w-full px-3 pt-6 pb-2.5 rounded-lg border border-charcoal/10 bg-white text-sm text-charcoal placeholder:text-charcoal/15 focus:outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2 text-[10px] font-medium pointer-events-none" style={{ color: theme.point2Hex }}>습관 회고</span>
                <input
                  type="text"
                  value={diaryReflection}
                  onChange={(e) => setDiaryReflection(e.target.value)}
                  placeholder={diaryExample?.reflection || '잘 됐거나 안 된 이유 한 줄'}
                  className="w-full px-3 pt-6 pb-2 rounded-lg border border-charcoal/10 bg-white text-sm text-charcoal placeholder:text-charcoal/15 focus:outline-none"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2 text-[10px] font-medium pointer-events-none" style={{ color: theme.point2Hex }}>내일</span>
                <input
                  type="text"
                  value={diaryIntention}
                  onChange={(e) => setDiaryIntention(e.target.value)}
                  placeholder={diaryExample?.intention || '내일 실행할 구체적인 의도 하나'}
                  className="w-full px-3 pt-6 pb-2 rounded-lg border border-charcoal/10 bg-white text-sm text-charcoal placeholder:text-charcoal/15 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleDiarySave}
              disabled={diarySaving}
              className={`w-full mt-4 py-3 rounded-xl font-semibold transition ${theme.point1} ${theme.point1Text} disabled:opacity-50`}
            >
              {diarySaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      , document.body)}

    </div>
  )
}
