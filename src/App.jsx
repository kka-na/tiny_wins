import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './stores/useUserStore'
import { useHabitStore } from './stores/useHabitStore'
import { api } from './lib/api'
import Setup from './pages/Setup'
import MainView from './pages/MainView'
import HabitSets from './pages/HabitSets'
import Battle from './pages/Battle'

function App() {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const { setCurrentSet, setHabits } = useHabitStore()
  const [loading, setLoading] = useState(true)

  // 앱 시작 시 localStorage에서 userId 복구
  useEffect(() => {
    const savedUserId = localStorage.getItem('tiny_wins_user_id')
    if (!savedUserId) {
      setLoading(false)
      return
    }

    async function restore() {
      try {
        const userData = await api.getUser(savedUserId)
        setUser(userData)

        const activeSet = await api.getActiveSet(savedUserId)
        setCurrentSet(activeSet)

        const habits = await api.getHabits(activeSet.id)
        setHabits(habits)
      } catch (e) {
        // 유저나 셋이 없으면 Setup으로
        localStorage.removeItem('tiny_wins_user_id')
      }
      setLoading(false)
    }
    restore()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s1-bg">
        <p className="text-charcoal/50 text-sm">로딩 중...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route
          path="/dashboard"
          element={user ? <MainView /> : <Navigate to="/setup" replace />}
        />
        <Route
          path="/habit-sets"
          element={user ? <HabitSets /> : <Navigate to="/setup" replace />}
        />
        <Route
          path="/battle"
          element={user ? <Battle /> : <Navigate to="/setup" replace />}
        />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/setup'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
