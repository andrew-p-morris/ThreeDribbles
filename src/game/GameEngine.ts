import { GameState, ShotResult, MoveHistory } from '../types/Game'
import { attemptShot } from './ShotCalculator'
import { isAdjacent } from './CourtPositions'

export function initializeGame(
  player1: GameState['player1'],
  player2: GameState['player2'],
  mode: GameState['mode'],
  aiDifficulty?: GameState['aiDifficulty']
): GameState {
  return {
    mode,
    player1: { ...player1, score: 0, currentPosition: 3, shotsMade: 0, shotsAttempted: 0, threesMade: 0, threesAttempted: 0 },
    player2: { ...player2, score: 0, currentPosition: 8, shotsMade: 0, shotsAttempted: 0, threesMade: 0, threesAttempted: 0 },
    possession: 'player1', // Player 1 always starts with the ball
    moveCount: 0,
    actualDribbles: 0,
    currentTurn: 'offense',
    offenseSelection: null,
    defenseSelection: null,
    defenderStartPosition: null,
    status: 'playing',
    winner: null,
    aiDifficulty
  }
}

export function validateMove(
  gameState: GameState,
  selectedPosition: number,
  isOffense: boolean
): boolean {
  if (gameState.status !== 'playing') return false
  
  if (isOffense) {
    // Offense must move to adjacent position
    const currentPos = gameState.possession === 'player1' 
      ? gameState.player1.currentPosition 
      : gameState.player2.currentPosition
    return isAdjacent(currentPos, selectedPosition)
  } else {
    // Defense can move to any adjacent position from their current spot
    // OR can stay in current position to contest shot
    // NOW defenders CAN cross the 3-point line for aggressive defense
    const defenderPos = gameState.possession === 'player1'
      ? gameState.player2.currentPosition
      : gameState.player1.currentPosition
    
    // Allow staying in current position (contesting)
    if (selectedPosition === defenderPos) return true
    
    // Check if adjacent
    if (!isAdjacent(defenderPos, selectedPosition)) return false
    
    return true
  }
}

export function processMove(
  gameState: GameState,
  offenseMove: number,
  defenseMove: number,
  turnNumber: number = 0,
  forceShot: boolean = false
): { newState: GameState; shotResult: ShotResult | null; moveHistory: MoveHistory } {
  const isPlayer1Offense = gameState.possession === 'player1'
  
  // Track defender's starting position before this turn
  const defenderStartPos = isPlayer1Offense ? gameState.player2.currentPosition : gameState.player1.currentPosition
  
  // Update positions
  const newState = { ...gameState }
  if (isPlayer1Offense) {
    newState.player1.currentPosition = offenseMove
    newState.player2.currentPosition = defenseMove
  } else {
    newState.player2.currentPosition = offenseMove
    newState.player1.currentPosition = defenseMove
  }
  
  // Increment move count (this represents the move that just happened)
  newState.moveCount++
  // Track actual dribbles (only increment when offense makes a move, not for block penalty)
  newState.actualDribbles++
  
  // Check if defender guessed correctly (same spot as offense)
  if (offenseMove === defenseMove) {
    // Defender gets the spot! Offense loses a dribble (add extra move)
    newState.moveCount++  // Add 1 more, so total +2 from start
    // Don't increment actualDribbles for the penalty
  }
  
  // Check if shot should be attempted (after move 3 or forced shot)
  let shotResult: ShotResult | null = null
  if (forceShot || newState.moveCount >= 3) {
    // Attempt shot
    const offenseArchetype = isPlayer1Offense 
      ? newState.player1.archetype 
      : newState.player2.archetype
    const defenseArchetype = isPlayer1Offense 
      ? newState.player2.archetype 
      : newState.player1.archetype
    
    // Check if defender moved (true) or contested (false)
    const defenderMoved = defenderStartPos !== defenseMove
    
    shotResult = attemptShot(
      offenseMove,
      defenseMove,
      offenseArchetype,
      defenseArchetype,
      defenderMoved
    )
    
    // Update score and shot stats
    const offensePlayer = isPlayer1Offense ? newState.player1 : newState.player2
    offensePlayer.score += shotResult.points
    offensePlayer.shotsAttempted++
    if (shotResult.made) {
      offensePlayer.shotsMade++
    }
    
    // Track 3-point attempts/makes
    const offensePosition = isPlayer1Offense ? newState.player1.currentPosition : newState.player2.currentPosition
    const isThreePointer = [1, 2, 3, 4, 5].includes(offensePosition)
    if (isThreePointer) {
      offensePlayer.threesAttempted++
      if (shotResult.made) {
        offensePlayer.threesMade++
      }
    }
    
    // Check for winner
    // Sudden death: if either player reaches 30, next made shot wins
    if (newState.player1.score >= 30 || newState.player2.score >= 30) {
      if (shotResult.made) {
        newState.status = 'finished'
        newState.winner = isPlayer1Offense ? newState.player1.username : newState.player2.username
      }
    }
    // Win by 2: must be ahead by 2 points and have at least 11 points
    else if (newState.player1.score >= 11 && newState.player1.score >= newState.player2.score + 2) {
      newState.status = 'finished'
      newState.winner = newState.player1.username
    } else if (newState.player2.score >= 11 && newState.player2.score >= newState.player1.score + 2) {
      newState.status = 'finished'
      newState.winner = newState.player2.username
    } else {
      // Possession rules: Make it = keep ball, Miss it = other player gets ball
      if (shotResult.made) {
        // Keep possession - same player shoots again
        newState.possession = isPlayer1Offense ? 'player1' : 'player2'
      } else {
        // Switch possession on a miss
        newState.possession = isPlayer1Offense ? 'player2' : 'player1'
      }
      
      // Reset positions: whoever has possession goes to 3 (offense), defender to 8
      if (newState.possession === 'player1') {
        newState.player1.currentPosition = 3  // Offense at top of key
        newState.player2.currentPosition = 8  // Defense at free throw line
      } else {
        newState.player2.currentPosition = 3  // Offense at top of key
        newState.player1.currentPosition = 8  // Defense at free throw line
      }
      newState.moveCount = 0
      newState.actualDribbles = 0
    }
  }
  
  // Reset turn selections
  newState.offenseSelection = null
  newState.defenseSelection = null
  newState.currentTurn = 'offense'
  
  // Create move history entry
  const moveHistory: MoveHistory = {
    turnNumber,
    offensePosition: offenseMove,
    defensePosition: defenseMove,
    player1Position: newState.player1.currentPosition,
    player2Position: newState.player2.currentPosition,
    player1Score: newState.player1.score,
    player2Score: newState.player2.score,
    possession: newState.possession,
    moveCount: newState.moveCount,
    shotResult
  }
  
  return { newState, shotResult, moveHistory }
}

