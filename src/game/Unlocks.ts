import { GameState, Archetype } from '../types/Game'

export type UnlockContext = {
  consecutiveHardWins: number
  hard11_0WinsThisSession: number
  /** Number of different friends (challenge opponents) played, for ball unlocks */
  friendsOpponentCount?: number
}

export type UnlockRequirement =
  | { type: 'win_easy' }
  | { type: 'beat_archetype'; difficulty: 'easy' | 'medium' | 'hard'; opponentArchetype: Archetype }
  | { type: 'win_hard' }
  | { type: 'win_hard_n_in_a_row'; n: number }
  | { type: 'win_hard_11_0' }
  | { type: 'win_hard_11_0_twice' }
  | { type: 'win_hard_100_fg' }
  | { type: 'win_hard_11_0_100_fg' }
  | { type: 'gold_chain' }
  | { type: 'play_n_different_friends'; n: number }

export type UnlockEntry = { cosmeticId: string; requirement: UnlockRequirement }

// One unique requirement per item; difficulty ordered to match price (cheapest = easiest).
const UNLOCK_TABLE: UnlockEntry[] = [
  // Price 25 (easiest)
  { cosmeticId: 'headband_blue', requirement: { type: 'win_easy' } },
  { cosmeticId: 'headband_red', requirement: { type: 'beat_archetype', difficulty: 'easy', opponentArchetype: 'shooter' } },
  { cosmeticId: 'socks_red', requirement: { type: 'beat_archetype', difficulty: 'easy', opponentArchetype: 'midrange' } },
  { cosmeticId: 'wristbands_red', requirement: { type: 'beat_archetype', difficulty: 'easy', opponentArchetype: 'defender' } },
  { cosmeticId: 'socks_blue', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'shooter' } },
  // Price 40
  { cosmeticId: 'arm_sleeve_black', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'midrange' } },
  { cosmeticId: 'arm_sleeve_white', requirement: { type: 'beat_archetype', difficulty: 'medium', opponentArchetype: 'defender' } },
  // Price 50
  { cosmeticId: 'socks_striped', requirement: { type: 'beat_archetype', difficulty: 'hard', opponentArchetype: 'shooter' } },
  // Price 75
  { cosmeticId: 'ball_red', requirement: { type: 'play_n_different_friends', n: 3 } },
  { cosmeticId: 'ball_blue', requirement: { type: 'play_n_different_friends', n: 5 } },
  { cosmeticId: 'ball_green', requirement: { type: 'win_hard' } },
  { cosmeticId: 'ball_gold', requirement: { type: 'play_n_different_friends', n: 10 } },
  { cosmeticId: 'high_tops_yellow', requirement: { type: 'win_hard_11_0' } },
  // Price 80
  { cosmeticId: 'cap_black', requirement: { type: 'win_hard_100_fg' } },
  { cosmeticId: 'cap_white', requirement: { type: 'win_easy' } },
  // Price 100
  { cosmeticId: 'championship_jersey', requirement: { type: 'win_hard_n_in_a_row', n: 3 } },
  { cosmeticId: 'flame_jersey', requirement: { type: 'win_hard_11_0_twice' } },
  { cosmeticId: 'jersey_classic', requirement: { type: 'win_hard_11_0_100_fg' } },
  { cosmeticId: 'army_jersey', requirement: { type: 'win_hard_n_in_a_row', n: 4 } },
  // Price 150
  { cosmeticId: 'glasses', requirement: { type: 'win_hard_n_in_a_row', n: 5 } },
  { cosmeticId: 'retro_sneakers_blue', requirement: { type: 'win_hard_n_in_a_row', n: 6 } },
  // Price 250
  { cosmeticId: 'sunglasses', requirement: { type: 'win_hard_n_in_a_row', n: 7 } },
  // Price 750
  { cosmeticId: 'silver_chain', requirement: { type: 'win_hard_n_in_a_row', n: 8 } },
  // Price 1000 (hardest)
  { cosmeticId: 'gold_chain', requirement: { type: 'gold_chain' } },
  { cosmeticId: 'tuxedo_black', requirement: { type: 'win_hard_n_in_a_row', n: 9 } },
  { cosmeticId: 'tuxedo_white', requirement: { type: 'win_hard_n_in_a_row', n: 10 } },
]

const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const ARCHETYPE_LABELS: Record<Archetype, string> = { shooter: 'Shooter', midrange: 'Mid Range', defender: 'Defender' }

export function getUnlockInstruction(cosmeticId: string): string {
  const entry = UNLOCK_TABLE.find(e => e.cosmeticId === cosmeticId)
  if (!entry) return 'Complete challenges to unlock.'
  const r = entry.requirement
  switch (r.type) {
    case 'win_easy':
      return 'Win a game on Practice (Easy).'
    case 'beat_archetype':
      return `Beat ${ARCHETYPE_LABELS[r.opponentArchetype]} on Practice (${DIFFICULTY_LABELS[r.difficulty]}).`
    case 'win_hard':
      return 'Win a game on Practice (Hard).'
    case 'win_hard_n_in_a_row':
      return `Win ${r.n} games in a row on Practice (Hard).`
    case 'win_hard_11_0':
      return 'Win 11–0 on Practice (Hard).'
    case 'win_hard_11_0_twice':
      return 'Win 11–0 on Practice (Hard) twice (this session).'
    case 'win_hard_100_fg':
      return 'Win on Practice (Hard) with 100% FG (make every shot you take).'
    case 'win_hard_11_0_100_fg':
      return 'Win 11–0 on Practice (Hard) with 100% FG (make every shot).'
    case 'gold_chain':
      return 'Win 11–0 on Practice (Hard) with 100% FG (make every shot).'
    case 'play_n_different_friends':
      return `Play against ${r.n} different friends.`
    default:
      return 'Complete challenges to unlock.'
  }
}

function requirementSatisfied(
  requirement: UnlockRequirement,
  state: GameState,
  isPlayer1: boolean,
  context?: UnlockContext
): boolean {
  const player = isPlayer1 ? state.player1 : state.player2
  const opponent = isPlayer1 ? state.player2 : state.player1
  const won = state.winner === player.username
  const modeOk = !!(state.mode === 'ai' && state.aiDifficulty)
  const difficulty = state.aiDifficulty ?? 'medium'
  const consec = context?.consecutiveHardWins ?? 0
  const hard11_0Count = context?.hard11_0WinsThisSession ?? 0

  switch (requirement.type) {
    case 'win_easy':
      return modeOk && difficulty === 'easy' && !!won
    case 'beat_archetype':
      return modeOk && difficulty === requirement.difficulty && opponent.archetype === requirement.opponentArchetype && !!won
    case 'win_hard':
      return modeOk && difficulty === 'hard' && !!won
    case 'win_hard_n_in_a_row':
      return modeOk && difficulty === 'hard' && !!won && consec >= requirement.n
    case 'win_hard_11_0':
      return modeOk && difficulty === 'hard' && !!won && player.score === 11 && opponent.score === 0
    case 'win_hard_11_0_twice':
      return modeOk && difficulty === 'hard' && !!won && player.score === 11 && opponent.score === 0 && hard11_0Count >= 2
    case 'win_hard_100_fg':
      return modeOk && difficulty === 'hard' && !!won && player.shotsAttempted > 0 && player.shotsMade === player.shotsAttempted
    case 'win_hard_11_0_100_fg':
      return modeOk && difficulty === 'hard' && !!won && player.score === 11 && opponent.score === 0 &&
        player.shotsAttempted > 0 && player.shotsMade === player.shotsAttempted
    case 'gold_chain':
      return modeOk && difficulty === 'hard' && !!won && player.score === 11 && opponent.score === 0 &&
        player.shotsAttempted > 0 && player.shotsMade === player.shotsAttempted
    case 'play_n_different_friends':
      return (context?.friendsOpponentCount ?? 0) >= requirement.n
    default:
      return false
  }
}

export function checkUnlocks(
  endedGameState: GameState,
  currentUnlocked: string[],
  context?: UnlockContext
): string[] {
  if (endedGameState.status !== 'finished' || !endedGameState.winner) return []
  const isPlayer1 = endedGameState.winner === endedGameState.player1.username
  const newlyUnlocked: string[] = []
  for (const entry of UNLOCK_TABLE) {
    if (currentUnlocked.includes(entry.cosmeticId)) continue
    if (requirementSatisfied(entry.requirement, endedGameState, isPlayer1, context)) {
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
  cap_white: 85,
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

/** Court theme prices in shop (100 coins each for purchasable themes). */
export const COURT_THEME_PRICES: Record<string, number> = {
  stadium: 100,
  beach: 100,
  snow_court: 100,
  jungle_court: 100,
}

export function getCourtThemePrice(themeId: string): number {
  return COURT_THEME_PRICES[themeId] ?? 0
}
