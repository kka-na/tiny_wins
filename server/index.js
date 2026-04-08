import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { read, findById, insert, update, remove } from './db.js'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 2229

app.use(cors())
app.use(express.json())

const uuid = () => crypto.randomUUID()

// --- Users ---
app.post('/api/users', (req, res) => {
  const { user_id, display_name } = req.body
  const existing = read('users').find((u) => u.user_id === user_id)
  if (existing) return res.json(existing)

  const user = insert('users', {
    id: uuid(),
    user_id,
    display_name: display_name || user_id,
    created_at: new Date().toISOString(),
    current_set_id: null,
  })
  res.status(201).json(user)
})

app.get('/api/users/:userId', (req, res) => {
  const user = read('users').find((u) => u.user_id === req.params.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

app.put('/api/users/:userId', (req, res) => {
  const user = read('users').find((u) => u.user_id === req.params.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const updated = update('users', user.id, req.body)
  res.json(updated)
})

// --- Habit Sets ---
app.post('/api/habit-sets', (req, res) => {
  const { user_id } = req.body

  // 이미 활성 셋이 있으면 그걸 반환
  const existing = read('habit_sets').find((s) => s.user_id === user_id && s.is_active)
  if (existing) return res.json(existing)

  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 35)

  const set = insert('habit_sets', {
    id: uuid(),
    user_id,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    is_active: true,
  })

  // Update user's current_set_id
  const users = read('users')
  const user = users.find((u) => u.user_id === user_id)
  if (user) update('users', user.id, { current_set_id: set.id })

  res.status(201).json(set)
})

// 현재 활성 셋 종료
app.put('/api/habit-sets/:id/deactivate', (req, res) => {
  const updated = update('habit_sets', req.params.id, { is_active: false })
  if (!updated) return res.status(404).json({ error: 'Set not found' })
  res.json(updated)
})

// 셋 활성화 (다른 셋은 비활성화)
app.put('/api/habit-sets/:id/activate', (req, res) => {
  const target = findById('habit_sets', req.params.id)
  if (!target) return res.status(404).json({ error: 'Set not found' })

  // 같은 유저의 다른 활성 셋 비활성화
  const allSets = read('habit_sets')
  allSets.forEach((s) => {
    if (s.user_id === target.user_id && s.is_active) {
      update('habit_sets', s.id, { is_active: false })
    }
  })

  const updated = update('habit_sets', req.params.id, { is_active: true })
  // 유저의 current_set_id 업데이트
  const users = read('users')
  const user = users.find((u) => u.user_id === target.user_id)
  if (user) update('users', user.id, { current_set_id: req.params.id })

  res.json(updated)
})

app.get('/api/habit-sets/:userId', (req, res) => {
  const sets = read('habit_sets').filter((s) => s.user_id === req.params.userId)
  res.json(sets)
})

app.get('/api/habit-sets/:userId/active', (req, res) => {
  const set = read('habit_sets').find(
    (s) => s.user_id === req.params.userId && s.is_active
  )
  if (!set) return res.status(404).json({ error: 'No active set' })
  res.json(set)
})

// --- Habits ---
app.post('/api/habits', (req, res) => {
  const { set_id, name, description, type, order } = req.body
  const habit = insert('habits', {
    id: uuid(),
    set_id,
    name,
    description: description || '',
    type: type || 'mixed',
    order: order || 0,
    created_at: new Date().toISOString(),
  })
  res.status(201).json(habit)
})

app.get('/api/habits/:setId', (req, res) => {
  const habits = read('habits')
    .filter((h) => h.set_id === req.params.setId)
    .sort((a, b) => a.order - b.order)
  res.json(habits)
})

app.put('/api/habits/:id', (req, res) => {
  const updated = update('habits', req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Habit not found' })
  res.json(updated)
})

app.delete('/api/habits/:id', (req, res) => {
  remove('habits', req.params.id)
  res.json({ ok: true })
})

// --- Daily Records ---
app.post('/api/records', (req, res) => {
  const { set_id, date, completed_habits } = req.body
  const records = read('records')
  const existing = records.find((r) => r.set_id === set_id && r.date === date)

  if (existing) {
    const updated = update('records', existing.id, {
      completed_habits,
      completion_count: completed_habits.length,
      updated_at: new Date().toISOString(),
    })
    return res.json(updated)
  }

  const record = insert('records', {
    id: uuid(),
    set_id,
    date,
    completed_habits,
    completion_count: completed_habits.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  res.status(201).json(record)
})

app.get('/api/records/:setId', (req, res) => {
  const records = read('records')
    .filter((r) => r.set_id === req.params.setId)
    .sort((a, b) => a.date.localeCompare(b.date))
  res.json(records)
})

// 겨루기용: 유저의 활성 셋 진척도 (습관 내용 비공개, 비율만)
app.get('/api/progress/:userId', (req, res) => {
  const userId = req.params.userId
  const user = read('users').find((u) => u.user_id === userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const set = read('habit_sets').find((s) => s.user_id === userId && s.is_active)
  if (!set) return res.status(404).json({ error: 'No active set' })

  const habitCount = read('habits').filter((h) => h.set_id === set.id).length
  const records = read('records')
    .filter((r) => r.set_id === set.id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: r.date,
      count: r.completion_count,
      total: habitCount,
    }))

  res.json({
    user_id: userId,
    display_name: user.display_name,
    fruit: user.fruit || 'strawberry',
    start_date: set.start_date,
    end_date: set.end_date,
    habit_count: habitCount,
    records,
  })
})

// --- Friendships ---
app.post('/api/friends', (req, res) => {
  const { user_a, user_b } = req.body
  const existing = read('friendships').find(
    (f) =>
      (f.user_a === user_a && f.user_b === user_b) ||
      (f.user_a === user_b && f.user_b === user_a)
  )
  if (existing) return res.json(existing)

  const friendship = insert('friendships', {
    id: uuid(),
    user_a,
    user_b,
    created_at: new Date().toISOString(),
    active: true,
  })
  res.status(201).json(friendship)
})

// --- Reset ---
app.delete('/api/reset/:userId', (req, res) => {
  const userId = req.params.userId

  // 유저의 모든 셋 가져오기
  const sets = read('habit_sets').filter((s) => s.user_id === userId)
  const setIds = sets.map((s) => s.id)

  // 습관 삭제
  const allHabits = read('habits')
  write('habits', allHabits.filter((h) => !setIds.includes(h.set_id)))

  // 기록 삭제
  const allRecords = read('records')
  write('records', allRecords.filter((r) => !setIds.includes(r.set_id)))

  // 셋 삭제
  const allSets = read('habit_sets')
  write('habit_sets', allSets.filter((s) => s.user_id !== userId))

  // 유저 삭제
  const allUsers = read('users')
  write('users', allUsers.filter((u) => u.user_id !== userId))

  // 친구 관계 삭제
  const allFriends = read('friendships')
  write('friendships', allFriends.filter((f) => f.user_a !== userId && f.user_b !== userId))

  res.json({ ok: true })
})

// 프로덕션: dist 정적 파일 서빙
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tiny Wins running on http://0.0.0.0:${PORT}`)
})
