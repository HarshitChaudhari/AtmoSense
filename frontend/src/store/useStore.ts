import { create } from 'zustand'

interface AtmoStore {
  selectedCity: string
  setSelectedCity: (city: string) => void
  compareCities: string[]
  setCompareCities: (cities: string[]) => void
  activePollutant: string
  setActivePollutant: (p: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useStore = create<AtmoStore>((set) => ({
  selectedCity: 'Delhi',
  setSelectedCity: (city) => set({ selectedCity: city }),
  compareCities: ['Delhi', 'Beijing', 'London'],
  setCompareCities: (cities) => set({ compareCities: cities }),
  activePollutant: 'pm25',
  setActivePollutant: (p) => set({ activePollutant: p }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))