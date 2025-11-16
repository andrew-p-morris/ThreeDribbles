export type Archetype = 'midrange' | 'shooter' | 'defender'

export type GameMode = 'local' | 'ai' | 'online'

export type Position = {
  id: number
  x: number
  y: number
  isThreePoint: boolean
  name: string
  adjacentPositions: number[]
}

export type PlayerState = {
  uid: string
  username: string
  archetype: Archetype
  score: number
  currentPosition: number
  characterId?: string
  shotsMade: number
  shotsAttempted: number
  threesMade: number
  threesAttempted: number
}

export type GameState = {
  mode: GameMode
  player1: PlayerState
  player2: PlayerState
  possession: 'player1' | 'player2'
  moveCount: number
  actualDribbles: number // Track actual number of dribbles made (not including block penalties)
  currentTurn: 'offense' | 'defense'
  offenseSelection: number | null
  defenseSelection: number | null
  defenderStartPosition: number | null
  status: 'setup' | 'playing' | 'finished'
  winner: string | null
  aiDifficulty?: 'easy' | 'medium' | 'hard'
}

export type ShotResult = {
  made: boolean
  points: number
  probability: number
  baseProbability: number
  distance: number
}

export type MoveHistory = {
  turnNumber: number
  offensePosition: number
  defensePosition: number
  player1Position: number
  player2Position: number
  player1Score: number
  player2Score: number
  possession: 'player1' | 'player2'
  moveCount: number
  shotResult: ShotResult | null
}

