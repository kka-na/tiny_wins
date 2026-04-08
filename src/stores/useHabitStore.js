import { create } from 'zustand'

export const useHabitStore = create((set) => ({
  currentSet: null,
  habits: [],
  records: [],
  setCurrentSet: (currentSet) => set({ currentSet }),
  setHabits: (habits) => set({ habits }),
  setRecords: (records) => set({ records }),
}))
