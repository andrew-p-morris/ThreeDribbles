import { EquippedCosmetics } from './Cosmetics'

export type User = {
  uid: string
  email: string | null
  displayName: string
  isGuest: boolean
  stats: UserStats
  createdAt: number
  selectedCharacter?: string
  equippedCosmetics?: EquippedCosmetics
}

export type ModeStats = {
  wins: number
  losses: number
  totalGames: number
  totalPoints: number
  shotsMade: number
  shotsAttempted: number
  threesMade: number
  threesAttempted: number
}

export type UserStats = {
  wins: number
  losses: number
  totalGames: number
  totalPoints: number
  favoriteArchetype: string | null
  // Detailed stats by mode
  local?: ModeStats
  practice_easy?: ModeStats
  practice_medium?: ModeStats
  practice_hard?: ModeStats
  online?: ModeStats
}

