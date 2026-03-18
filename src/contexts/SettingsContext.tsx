import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { CourtThemeId } from '../types/CourtTheme'

type SettingsContextType = {
  courtTheme: CourtThemeId
  setCourtTheme: (theme: CourtThemeId) => void
  unlockedThemes: CourtThemeId[]
  unlockCourtTheme: (themeId: CourtThemeId) => void
  unlockAllThemes: () => void
  soundMuted: boolean
  setSoundMuted: (muted: boolean) => void
  volume: number
  setVolume: (v: number) => void
  musicMuted: boolean
  setMusicMuted: (muted: boolean) => void
  sfxMuted: boolean
  setSfxMuted: (muted: boolean) => void
  musicVolume: number
  setMusicVolume: (v: number) => void
  musicUrl1: string
  musicUrl2: string
  setMusicUrl1: (url: string) => void
  setMusicUrl2: (url: string) => void
  newUnlockBadgeIds: string[]
  addNewUnlockBadgeIds: (ids: string[]) => void
  clearNewUnlockBadges: () => void
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
    if (!stored) return ['highschool', 'blacktop']
    try {
      const parsed = JSON.parse(stored) as CourtThemeId[]
      if (!Array.isArray(parsed)) return ['highschool', 'blacktop']
      const sorted = [...parsed].sort().join(',')
      const legacyFour = ['stadium', 'beach', 'blacktop', 'highschool'].sort().join(',')
      const legacySix = ['highschool', 'stadium', 'beach', 'blacktop', 'snow_court', 'jungle_court'].sort().join(',')
      if (sorted === legacyFour || sorted === legacySix) return ['highschool', 'blacktop']
      return parsed
    } catch {
      return ['highschool', 'blacktop']
    }
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
  const [musicMuted, setMusicMutedState] = useState<boolean>(() => {
    const stored = localStorage.getItem('musicMuted')
    return stored !== null ? JSON.parse(stored) : true
  })
  const [sfxMuted, setSfxMutedState] = useState<boolean>(() => {
    const stored = localStorage.getItem('sfxMuted')
    return stored ? JSON.parse(stored) : false
  })
  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    const stored = localStorage.getItem('musicVolume')
    const v = stored ? Number(stored) : 0.5
    return isNaN(v) ? 0.5 : Math.max(0, Math.min(1, v))
  })
  const [musicUrl1, setMusicUrl1State] = useState<string>(() => {
    return localStorage.getItem('musicUrl1') || `${import.meta.env.BASE_URL || '/'}menu-music.mp3`
  })
  const [musicUrl2, setMusicUrl2State] = useState<string>(() => {
    return localStorage.getItem('musicUrl2') || ''
  })
  const [newUnlockBadgeIds, setNewUnlockBadgeIds] = useState<string[]>([])

  function addNewUnlockBadgeIds(ids: string[]) {
    if (ids.length === 0) return
    setNewUnlockBadgeIds(prev => [...new Set([...prev, ...ids])])
  }
  function clearNewUnlockBadges() {
    setNewUnlockBadgeIds([])
  }

  useEffect(() => {
    localStorage.setItem('unlockedThemes', JSON.stringify(unlockedThemes))
  }, [unlockedThemes])

  useEffect(() => {
    localStorage.setItem('soundMuted', JSON.stringify(soundMuted))
  }, [soundMuted])
  useEffect(() => {
    localStorage.setItem('volume', String(volume))
  }, [volume])
  useEffect(() => {
    localStorage.setItem('musicMuted', JSON.stringify(musicMuted))
  }, [musicMuted])
  useEffect(() => {
    localStorage.setItem('sfxMuted', JSON.stringify(sfxMuted))
  }, [sfxMuted])
  useEffect(() => {
    localStorage.setItem('musicVolume', String(musicVolume))
  }, [musicVolume])
  useEffect(() => {
    localStorage.setItem('musicUrl1', musicUrl1)
  }, [musicUrl1])
  useEffect(() => {
    localStorage.setItem('musicUrl2', musicUrl2)
  }, [musicUrl2])

  function setSoundMuted(muted: boolean) {
    setSoundMutedState(muted)
  }
  function setVolume(v: number) {
    setVolumeState(Math.max(0, Math.min(1, v)))
  }
  function setMusicMuted(muted: boolean) {
    setMusicMutedState(muted)
  }
  function setSfxMuted(muted: boolean) {
    setSfxMutedState(muted)
  }
  function setMusicVolume(v: number) {
    setMusicVolumeState(Math.max(0, Math.min(1, v)))
  }
  function setMusicUrl1(url: string) {
    setMusicUrl1State(url)
  }
  function setMusicUrl2(url: string) {
    setMusicUrl2State(url)
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

  function unlockCourtTheme(themeId: CourtThemeId) {
    setUnlockedThemes(prev => (prev.includes(themeId) ? prev : [...prev, themeId]))
  }

  const value = {
    courtTheme,
    setCourtTheme,
    unlockedThemes,
    unlockCourtTheme,
    unlockAllThemes,
    soundMuted,
    setSoundMuted,
    volume,
    setVolume,
    musicMuted,
    setMusicMuted,
    sfxMuted,
    setSfxMuted,
    musicVolume,
    setMusicVolume,
    musicUrl1,
    musicUrl2,
    setMusicUrl1,
    setMusicUrl2,
    newUnlockBadgeIds,
    addNewUnlockBadgeIds,
    clearNewUnlockBadges
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export { COURT_THEME_DATA } from '../types/CourtTheme'

