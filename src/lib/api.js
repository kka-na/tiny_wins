const API_URL = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  // Users
  createUser: (user_id, display_name) =>
    request('/api/users', { method: 'POST', body: JSON.stringify({ user_id, display_name }) }),
  getUser: (userId) => request(`/api/users/${userId}`),
  updateUser: (userId, updates) =>
    request(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(updates) }),

  // Habit Sets
  createHabitSet: (user_id) =>
    request('/api/habit-sets', { method: 'POST', body: JSON.stringify({ user_id }) }),
  getHabitSets: (userId) => request(`/api/habit-sets/${userId}`),
  getActiveSet: (userId) => request(`/api/habit-sets/${userId}/active`),
  deactivateSet: (id) => request(`/api/habit-sets/${id}/deactivate`, { method: 'PUT' }),
  activateSet: (id) => request(`/api/habit-sets/${id}/activate`, { method: 'PUT' }),

  // Habits
  createHabit: (habit) =>
    request('/api/habits', { method: 'POST', body: JSON.stringify(habit) }),
  getHabits: (setId) => request(`/api/habits/${setId}`),
  updateHabit: (id, updates) =>
    request(`/api/habits/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteHabit: (id) => request(`/api/habits/${id}`, { method: 'DELETE' }),

  // Records
  saveRecord: (set_id, date, completed_habits) =>
    request('/api/records', { method: 'POST', body: JSON.stringify({ set_id, date, completed_habits }) }),
  getRecords: (setId) => request(`/api/records/${setId}`),

  // Diaries
  saveDiary: (diary) =>
    request('/api/diaries', { method: 'POST', body: JSON.stringify(diary) }),
  getDiaries: (setId) => request(`/api/diaries/${setId}`),

  // Progress (겨루기)
  getProgress: (userId) => request(`/api/progress/${userId}`),

  // Reset
  resetUser: (userId) => request(`/api/reset/${userId}`, { method: 'DELETE' }),

  // Friends
  addFriend: (user_a, user_b) =>
    request('/api/friends', { method: 'POST', body: JSON.stringify({ user_a, user_b }) }),
}
