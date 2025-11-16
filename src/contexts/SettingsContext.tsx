import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { CourtThemeId } from '../types/CourtTheme'

type SettingsContextType = {
  courtTheme: CourtThemeId
  setCourtTheme: (theme: CourtThemeId) => void
  unlockedThemes: CourtThemeId[]
  unlockAllThemes: () => void
  soundMuted: boolean
  setSoundMuted: (muted: boolean) => void
  volume: number
  setVolume: (v: number) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [courtTheme, setCourtThemeState] = useState<CourtThemeId>(() => {
    const stored = localStorage.getItem('courtTheme')
    return (stored as CourtThemeId) || 'highschool'
  })
  
  const [unlockedThemes, setUnlockedThemes] = useState<CourtThemeId[]>(() => {
    const stored = localStorage.getItem('unlockedThemes')
    return stored ? JSON.parse(stored) : ['stadium', 'beach', 'blacktop', 'highschool']
  })

  const [soundMuted, setSoundMutedState] = useState<boolean>(() => {
    const stored = localStorage.getItem('soundMuted')
    return stored ? JSON.parse(stored) : false
  })
  const [volume, setVolumeState] = useState<number>(() => {
    const stored = localStorage.getItem('volume')
    const v = stored ? Number(stored) : 0.8
    return isNaN(v) ? 0.8 : Math.max(0, Math.min(1, v))
  })

  useEffect(() => {
    localStorage.setItem('unlockedThemes', JSON.stringify(unlockedThemes))
  }, [unlockedThemes])

  useEffect(() => {
    localStorage.setItem('soundMuted', JSON.stringify(soundMuted))
  }, [soundMuted])
  useEffect(() => {
    localStorage.setItem('volume', String(volume))
  }, [volume])

  function setSoundMuted(muted: boolean) {
    setSoundMutedState(muted)
  }
  function setVolume(v: number) {
    setVolumeState(Math.max(0, Math.min(1, v)))
  }

  function setCourtTheme(theme: CourtThemeId) {
    if (unlockedThemes.includes(theme)) {
      setCourtThemeState(theme)
      localStorage.setItem('courtTheme', theme)
    }
  }

  function unlockAllThemes() {
    const allThemes: CourtThemeId[] = ['highschool', 'stadium', 'beach', 'blacktop', 'snow_court', 'jungle_court']
    setUnlockedThemes(allThemes)
  }

  const value = {
    courtTheme,
    setCourtTheme,
    unlockedThemes,
    unlockAllThemes,
    soundMuted,
    setSoundMuted,
    volume,
    setVolume
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export { COURT_THEME_DATA } from '../types/CourtTheme'

