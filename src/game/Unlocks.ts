import { GameState, Archetype } from '../types/Game'

export type UnlockRequirement =
  | { type: 'beat_archetype'; difficulty: 'easy' | 'medium' | 'hard'; opponentArchetype: Archetype }
  | { type: 'win_hard' }
  | { type: 'win_hard_11_0' }
  | { type: 'win_hard_100_fg' }
  | { type: 'gold_chain' } // 11-0 on Hard + 100% FG

export type UnlockEntry = { cosmeticId: string; requirement: UnlockRequirement }

const UNLOCK_TABLE: UnlockEntry[] = [
  // Easy: beat each archetype on Easy
  { cosmeticId: 'headband_red', requirement: { type: 'beat_archetype', difficulty: 'easy', opponentArchetype: 'shooter' } },
  { cosmeticId: 'socks_red', requirement: { type: 'beat_archetype', difficulty: 'easy', opponentArchetype: 'midrange' } },
  { cosmeticId: 'wristbands_red', requirement: { type: 'beat_archetype', difficulty: 'easy', opponentArchetype: 'defender' } },
  // Medium: beat each archetype on Medium
  { cosmeticId: 'cap_black', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'shooter' } },
  { cosmeticId: 'arm_sleeve_black', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'midrange' } },
  { cosmeticId: 'socks_blue', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'defender' } },
  // Hard: beat each archetype on Hard
  { cosmeticId: 'glasses', requirement: { type: 'beat_archetype', difficulty: 'hard', opponentArchetype: 'shooter' } },
  { cosmeticId: 'silver_chain', requirement: { type: 'beat_archetype', difficulty: 'hard', opponentArchetype: 'midrange' } },
  { cosmeticId: 'sunglasses', requirement: { type: 'beat_archetype', difficulty: 'hard', opponentArchetype: 'defender' } },
  // Jerseys / harder
  { cosmeticId: 'headband_blue', requirement: { type: 'win_hard' } },
  { cosmeticId: 'jersey_classic', requirement: { type: 'win_hard' } },
  { cosmeticId: 'army_jersey', requirement: { type: 'win_hard' } },
  { cosmeticId: 'championship_jersey', requirement: { type: 'win_hard_11_0' } },
  { cosmeticId: 'flame_jersey', requirement: { type: 'win_hard_11_0' } },
  // Tuxedos, striped socks, yellow sneakers (hard)
  { cosmeticId: 'tuxedo_white', requirement: { type: 'win_hard_11_0' } },
  { cosmeticId: 'socks_striped', requirement: { type: 'win_hard_100_fg' } },
  { cosmeticId: 'high_tops_yellow', requirement: { type: 'win_hard_11_0' } },
  { cosmeticId: 'tuxedo_black', requirement: { type: 'win_hard_100_fg' } },
  // Balls
  { cosmeticId: 'ball_red', requirement: { type: 'beat_archetype', difficulty: 'easy', opponentArchetype: 'shooter' } },
  { cosmeticId: 'ball_blue', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'shooter' } },
  { cosmeticId: 'ball_green', requirement: { type: 'win_hard' } },
  { cosmeticId: 'ball_gold', requirement: { type: 'win_hard_11_0' } },
  // Gold chain = hardest: 11-0 on Hard with 100% FG
  { cosmeticId: 'gold_chain', requirement: { type: 'gold_chain' } },
  // Arm sleeve white
  { cosmeticId: 'arm_sleeve_white', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'shooter' } },
  { cosmeticId: 'retro_sneakers_blue', requirement: { type: 'beat_archetype', difficulty: 'hard', opponentArchetype: 'shooter' } },
]

const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const ARCHETYPE_LABELS: Record<Archetype, string> = { shooter: 'Shooter', midrange: 'Mid Range', defender: 'Defender' }

export function getUnlockInstruction(cosmeticId: string): string {
  const entry = UNLOCK_TABLE.find(e => e.cosmeticId === cosmeticId)
  if (!entry) return 'Complete challenges to unlock.'
  const r = entry.requirement
  switch (r.type) {
    case 'beat_archetype':
      return `Beat ${ARCHETYPE_LABELS[r.opponentArchetype]} on Practice (${DIFFICULTY_LABELS[r.difficulty]}).`
    case 'win_hard':
      return 'Win a game on Practice (Hard).'
    case 'win_hard_11_0':
      return 'Win 11–0 on Practice (Hard).'
    case 'win_hard_100_fg':
      return 'Win on Practice (Hard) with 100% FG (make every shot you take).'
    case 'gold_chain':
      return 'Win 11–0 on Practice (Hard) with 100% FG (make every shot).'
    default:
      return 'Complete challenges to unlock.'
  }
}

function requirementSatisfied(requirement: UnlockRequirement, state: GameState, isPlayer1: boolean): boolean {
  const player = isPlayer1 ? state.player1 : state.player2
  const opponent = isPlayer1 ? state.player2 : state.player1
  const won = state.winner === player.username
  const modeOk = state.mode === 'ai' && state.aiDifficulty
  const difficulty = state.aiDifficulty!

  switch (requirement.type) {
    case 'beat_archetype':
      return !!modeOk && difficulty === requirement.difficulty && opponent.archetype === requirement.opponentArchetype && won
    case 'win_hard':
      return modeOk && difficulty === 'hard' && won
    case 'win_hard_11_0':
      return modeOk && difficulty === 'hard' && won && player.score === 11 && opponent.score === 0
    case 'win_hard_100_fg':
      return modeOk && difficulty === 'hard' && won && player.shotsAttempted > 0 && player.shotsMade === player.shotsAttempted
    case 'gold_chain':
      return modeOk && difficulty === 'hard' && won && player.score === 11 && opponent.score === 0 &&
        player.shotsAttempted > 0 && player.shotsMade === player.shotsAttempted
    default:
      return false
  }
}

export function checkUnlocks(endedGameState: GameState, currentUnlocked: string[]): string[] {
  if (endedGameState.status !== 'finished' || !endedGameState.winner) return []
  const isPlayer1 = endedGameState.winner === endedGameState.player1.username
  const newlyUnlocked: string[] = []
  for (const entry of UNLOCK_TABLE) {
    if (currentUnlocked.includes(entry.cosmeticId)) continue
    if (requirementSatisfied(entry.requirement, endedGameState, isPlayer1)) {
      newlyUnlocked.push(entry.cosmeticId)
    }
  }
  return newlyUnlocked
}

export function getAllUnlockableCosmeticIds(): string[] {
  return UNLOCK_TABLE.map(e => e.cosmeticId)
}

/** Coin prices for shop. */
export const COSMETIC_PRICES: Record<string, number> = {
  gold_chain: 1000,
  tuxedo_black: 1000,
  socks_striped: 50,
  tuxedo_white: 1000,
  ball_gold: 75,
  championship_jersey: 100,
  flame_jersey: 100,
  high_tops_yellow: 75,
  silver_chain: 750,
  sunglasses: 250,
  glasses: 150,
  jersey_classic: 100,
  army_jersey: 100,
  headband_blue: 25,
  ball_green: 75,
  retro_sneakers_blue: 150,
  cap_black: 80,
  arm_sleeve_black: 40,
  socks_blue: 25,
  arm_sleeve_white: 40,
  ball_blue: 75,
  headband_red: 25,
  socks_red: 25,
  wristbands_red: 25,
  ball_red: 75,
}

export function getCosmeticPrice(cosmeticId: string): number {
  return COSMETIC_PRICES[cosmeticId] ?? 0
}
