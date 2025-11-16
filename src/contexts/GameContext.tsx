import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { GameState, GameMode, Archetype, MoveHistory } from '../types/Game'
import { initializeGame, processMove, validateMove } from '../game/GameEngine'
import { getAIMove } from '../game/AI'
import { getPosition } from '../game/CourtPositions'
import { CHARACTERS } from '../types/Character'
import { useAuth } from './AuthContext'

type GameContextType = {
  gameState: GameState | null
  lastShotResult: { made: boolean, points: number, probability: number, baseProbability: number, distance: number, shotBy: 'player1' | 'player2', shotPosition: number } | null
  showShotBanner: boolean // Controls when banner is shown (after animation completes)
  moveHistory: MoveHistory[]
  showMoveComplete: number | null
  showBlockPopup: boolean // Show "-1 dribble" popup when defender guesses correctly
  startGame: (mode: GameMode, archetype: Archetype, difficulty?: 'easy' | 'medium' | 'hard', player2Archetype?: Archetype) => void
  selectPosition: (position: number) => void
  resetGame: () => void
  restartCurrentGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { currentUser, updateUserStats } = useAuth()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const gameStateRef = useRef<GameState | null>(null)
  
  // Helper function to update both state and ref synchronously
  const updateGameState = (newState: GameState | null) => {
    gameStateRef.current = newState
    setGameState(newState)
  }
  const [lastShotResult, setLastShotResult] = useState<{ made: boolean, points: number, probability: number, baseProbability: number, distance: number, shotBy: 'player1' | 'player2', shotPosition: number } | null>(null)
  const [showShotBanner, setShowShotBanner] = useState(false) // Controls when banner is shown
  const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([])
  const [turnNumber, setTurnNumber] = useState(0)
  const [showMoveComplete, setShowMoveComplete] = useState<number | null>(null) // Show popup for move number
  const [showBlockPopup, setShowBlockPopup] = useState(false) // Show "-1 dribble" popup

  function startGame(mode: GameMode, archetype: Archetype, difficulty?: 'easy' | 'medium' | 'hard', player2Archetype?: Archetype) {
    if (!currentUser) {
      console.error('No current user when starting game')
      return
    }

    // Use character from user profile, default to 'rocket' if not set
    const player1CharacterId = currentUser.selectedCharacter || 'rocket'
    
    // Get a random character for player 2/AI
    function getRandomCharacter(): string {
      return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id
    }
    const player2CharacterId = getRandomCharacter()

    const player1 = {
      uid: currentUser.uid,
      username: currentUser.displayName,
      archetype: archetype,
      score: 0,
      currentPosition: 3,
      characterId: player1CharacterId,
      shotsMade: 0,
      shotsAttempted: 0,
      threesMade: 0,
      threesAttempted: 0
    }

    const player2 = {
      uid: mode === 'ai' ? 'ai' : 'player2',
      username: mode === 'ai' ? 'Computer' : 'Player 2',
      archetype: player2Archetype || (mode === 'ai' ? getRandomArchetype() : 'shooter'),
      score: 0,
      currentPosition: 8,
      characterId: player2CharacterId,
      shotsMade: 0,
      shotsAttempted: 0,
      threesMade: 0,
      threesAttempted: 0
    }

    const newGame = initializeGame(player1, player2, mode, difficulty)
    updateGameState(newGame)
    setMoveHistory([])
    setTurnNumber(0)
    setShowMoveComplete(null)
  }

  function selectPosition(position: number) {
    // Use ref to get latest state to avoid stale closures
    const currentState = gameStateRef.current
    if (!currentState || currentState.status !== 'playing') return

    // Special case: position -1 means shoot from current position
    if (position === -1 && currentState.currentTurn === 'offense') {
      console.log('Shoot Now clicked')
      const isPlayer1Turn = currentState.possession === 'player1'
      const currentPos = isPlayer1Turn ? currentState.player1.currentPosition : currentState.player2.currentPosition
      
      // Set offenseSelection to current position and switch to defense turn
      const updatedState = { 
        ...currentState, 
        offenseSelection: currentPos, 
        currentTurn: 'defense' as 'defense' 
      }
      updateGameState(updatedState)
      return
    }

    // Simplified: Just handle offense and defense turns
    if (currentState.currentTurn === 'offense') {
      // Validate offense move
      if (!validateMove(currentState, position, true)) return
      
      console.log('Offense selected:', position, 'Switching to defense turn')
      // Set offenseSelection and switch to defense turn
      const updatedState = { ...currentState, offenseSelection: position, currentTurn: 'defense' as 'defense' }
      updateGameState(updatedState)
    } else if (currentState.currentTurn === 'defense') {
      // Validate defense move
      const isValid = validateMove(currentState, position, false)
      console.log('[AI DEBUG] selectPosition defense - position:', position, 'isValid:', isValid, 'currentDefensePos:', currentState.player2.currentPosition)
      
      if (!isValid) {
        console.error('[AI ERROR] Defense move validation failed!', {
          position,
          currentDefensePos: currentState.player2.currentPosition,
          offenseSelection: currentState.offenseSelection,
          mode: currentState.mode
        })
        return
      }
      
      console.log('Defense selected:', position)
      // Ensure offenseSelection is set before processing
      if (currentState.offenseSelection !== null) {
        console.log('Processing turn with offense:', currentState.offenseSelection, 'defense:', position)
        processTurn(currentState.offenseSelection, position)
      } else {
        console.error('No offense selection found!')
      }
    }
  }

  function processTurn(offenseMove: number, defenseMove: number, stateOverride?: GameState) {
    // Use stateOverride if provided, otherwise use ref to get latest state
    const currentState = stateOverride || gameStateRef.current
    if (!currentState) return

    console.log('Processing turn:', { 
      offenseMove, 
      defenseMove, 
      moveCount: currentState.moveCount, 
      possession: currentState.possession,
      p1Pos: currentState.player1.currentPosition,
      p2Pos: currentState.player2.currentPosition
    })
    
    const currentTurnNumber = turnNumber
    setTurnNumber(currentTurnNumber + 1)
    
    // Check if this is a "Shoot Now" (offense didn't move, shooting from current position)
    const isPlayer1Offense = currentState.possession === 'player1'
    const currentOffensePos = isPlayer1Offense ? currentState.player1.currentPosition : currentState.player2.currentPosition
    // If offenseMove is the same as current position, it's a "Shoot Now" forced shot
    const forceShot = offenseMove === currentOffensePos
    
    // Process the move
    const { newState, shotResult, moveHistory: newMoveHistory } = processMove(
      currentState, 
      offenseMove, 
      defenseMove, 
      currentTurnNumber,
      forceShot
    )
    
    // Check if a block occurred (defender guessed correctly)
    const wasBlock = offenseMove === defenseMove && !forceShot
    
    console.log('[BLOCK DEBUG]', {
      offenseMove,
      defenseMove,
      forceShot,
      wasBlock,
      moveCount: newState.moveCount,
      shotResult: shotResult ? 'SHOT' : 'no shot'
    })
    
    // Add move history entry
    setMoveHistory(prev => [...prev, newMoveHistory])
    
    // Show block popup if a block occurred (even if shot is forced)
    if (wasBlock) {
      console.log('[BLOCK DEBUG] Setting showBlockPopup to true')
      setShowBlockPopup(true)
      setTimeout(() => {
        console.log('[BLOCK DEBUG] Clearing showBlockPopup after 2 seconds')
        setShowBlockPopup(false)
      }, 2000)
    }
    
    console.log('After processMove:', { 
      shotResult: shotResult ? 'SHOT' : 'no shot',
      made: shotResult?.made,
      newMoveCount: newState.moveCount, 
      newPossession: newState.possession,
      newP1Pos: newState.player1.currentPosition,
      newP2Pos: newState.player2.currentPosition,
      status: newState.status
    })
    
    // If a shot was taken, handle shot animation
    if (shotResult) {
      console.log('Shot taken!', shotResult)
      
      // Show animation from current shot positions (before reset)
      const currentPossession = currentState.possession
      const tempState = {
        ...currentState,
        player1: {
          ...currentState.player1,
          currentPosition: currentPossession === 'player1' ? offenseMove : defenseMove
        },
        player2: {
          ...currentState.player2,
          currentPosition: currentPossession === 'player2' ? offenseMove : defenseMove
        }
      }
      updateGameState(tempState)
      
      // Set lastShotResult IMMEDIATELY to trigger animation in GameScreen
      // But don't show banner until animation completes
      // Track who actually took the shot (before possession changes) and from which position
      setLastShotResult({ ...shotResult, shotBy: currentPossession, shotPosition: offenseMove })
      setShowShotBanner(false) // Hide banner during animation
      
      // Calculate animation duration based on shot distance
      // offenseMove is the position the offense is shooting from
      const offensePosition = offenseMove
      const offensePos = getPosition(offensePosition)
      const basketX = 35
      const basketY = 72
      const distanceToBasket = Math.sqrt(Math.pow(offensePos.x - basketX, 2) + Math.pow(offensePos.y - basketY, 2))
      
      const isPaintShot = offensePosition === 11
      const isTopOfKeyShot = offensePosition === 3
      
      let baseDuration = 3000
      if (isTopOfKeyShot) {
        baseDuration = 5000
      } else if (isPaintShot) {
        baseDuration = 1500
      } else if (distanceToBasket > 28) {
        baseDuration = 4500
      } else if (distanceToBasket > 20) {
        baseDuration = 3500
      }
      
      const animationDuration = shotResult.made ? baseDuration : baseDuration + 500
      setTimeout(() => {
        // Animation complete - NOW show the banner and update scores/game state
        console.log('Animation complete - showing banner and updating scores/game state')
        setShowShotBanner(true) // Show banner AFTER animation completes
        
        // Update game state (but keep lastShotResult so banner can display it)
        updateGameState(newState)
        
        // If game ended, save stats
        if (newState.status === 'finished' && currentUser) {
          saveGameStats(newState)
        }
        
        // Clear shot result and banner after showing it
        setTimeout(() => {
          setLastShotResult(null)
          setShowShotBanner(false)
        }, 2500)
      }, animationDuration)
      return
    }
    
    // No shot - just a regular move
    console.log('No shot, updating state normally')
    
    // Update positions immediately (both players move visually)
    updateGameState(newState)
    
    // Switch to next turn (offense for next move) - possession stays the same until a shot
    const nextState = newState ? { ...newState, currentTurn: 'offense' as 'offense', offenseSelection: null } : null
    updateGameState(nextState)
  }

  // Auto-trigger AI moves when it's AI's turn
  useEffect(() => {
    // Check ref directly for immediate updates (especially important on first move)
    const currentState = gameStateRef.current
    if (!currentState || currentState.status !== 'playing' || currentState.mode !== 'ai') return
    
    // AI is on offense when player2 has possession
    const isAIOffense = currentState.possession === 'player2' && currentState.currentTurn === 'offense'
    // AI is on defense when player1 has possession and it's defense turn
    const isAIDefense = currentState.possession === 'player1' && currentState.currentTurn === 'defense'
    
    console.log('[AI DEBUG] useEffect triggered:', {
      possession: currentState.possession,
      currentTurn: currentState.currentTurn,
      isAIOffense,
      isAIDefense,
      offenseSelection: currentState.offenseSelection,
      player1Pos: currentState.player1.currentPosition,
      player2Pos: currentState.player2.currentPosition,
      moveCount: currentState.moveCount
    })
    
    if (isAIOffense || isAIDefense) {
      // Small delay to make AI moves feel natural
      const timer = setTimeout(() => {
        // Use ref to get latest state
        const latestState = gameStateRef.current
        if (!latestState || latestState.status !== 'playing' || latestState.mode !== 'ai') {
          console.error('[AI ERROR] State invalid in setTimeout:', { latestState })
          return
        }
        
        const stillAIOffense = latestState.possession === 'player2' && latestState.currentTurn === 'offense'
        const stillAIDefense = latestState.possession === 'player1' && latestState.currentTurn === 'defense'
        
        console.log('[AI DEBUG] Inside setTimeout:', {
          stillAIOffense,
          stillAIDefense,
          offenseSelection: latestState.offenseSelection,
          player1Pos: latestState.player1.currentPosition,
          player2Pos: latestState.player2.currentPosition
        })
        
        if (stillAIOffense || stillAIDefense) {
          const aiMove = getAIMove(latestState, stillAIOffense)
          console.log('[AI DEBUG] getAIMove returned:', aiMove, 'isOffense:', stillAIOffense)
          
          if (stillAIOffense) {
            // AI is on offense - automatically select their move
            console.log('[AI DEBUG] Calling selectPosition for AI offense with move:', aiMove)
            selectPosition(aiMove)
          } else if (stillAIDefense && latestState.offenseSelection !== null) {
            // AI is on defense - automatically select their defensive position
            console.log('[AI DEBUG] Calling selectPosition for AI defense with move:', aiMove, 'offenseSelection:', latestState.offenseSelection)
            selectPosition(aiMove)
          } else {
            console.error('[AI ERROR] Defense condition not met!', {
              stillAIDefense,
              offenseSelection: latestState.offenseSelection
            })
          }
        } else {
          console.error('[AI ERROR] AI turn conditions not met in setTimeout!', {
            stillAIOffense,
            stillAIDefense
          })
        }
      }, 800) // 800ms delay for natural feel
      
      return () => clearTimeout(timer)
    } else {
      console.log('[AI DEBUG] AI turn conditions not met, not setting timer')
    }
  }, [gameState?.possession, gameState?.currentTurn, gameState?.offenseSelection, gameState?.mode, gameState?.status])

  function saveGameStats(endedGameState: GameState) {
    if (!currentUser) return
    
    // Determine mode key for stats
    let modeKey = endedGameState.mode
    if (endedGameState.mode === 'ai' && endedGameState.aiDifficulty) {
      modeKey = `practice_${endedGameState.aiDifficulty}` as any
    }
    
    // Check if player 1 won
    const won = endedGameState.winner === currentUser.displayName
    
    // Use player 1's stats (the current user)
    const playerStats = endedGameState.player1
    
    updateUserStats(
      modeKey,
      won,
      playerStats.score,
      playerStats.shotsMade,
      playerStats.shotsAttempted,
      playerStats.threesMade,
      playerStats.threesAttempted
    )
  }

  function resetGame() {
    updateGameState(null)
    setLastShotResult(null)
    setShowShotBanner(false)
    setMoveHistory([])
    setTurnNumber(0)
    setShowMoveComplete(null)
    setShowBlockPopup(false)
  }

  function restartCurrentGame() {
    if (!gameState) return
    
    // Store current game settings
    const { mode, aiDifficulty, player1, player2, possession } = gameState
    
    // Clear current game
    setLastShotResult(null)
    
    // Reinitialize with fresh scores/stats but same settings
    const freshPlayer1 = {
      uid: player1.uid,
      username: player1.username,
      archetype: player1.archetype,
      score: 0,
      currentPosition: 3,
      characterId: player1.characterId,
      shotsMade: 0,
      shotsAttempted: 0,
      threesMade: 0,
      threesAttempted: 0
    }

    const freshPlayer2 = {
      uid: player2.uid,
      username: player2.username,
      archetype: player2.archetype,
      score: 0,
      currentPosition: 8,
      characterId: player2.characterId,
      shotsMade: 0,
      shotsAttempted: 0,
      threesMade: 0,
      threesAttempted: 0
    }

    const newGame = initializeGame(freshPlayer1, freshPlayer2, mode, aiDifficulty)
    
    // Alternate possession on rematch - if player1 had it last, give it to player2
    if (possession === 'player1') {
      newGame.possession = 'player2'
      // Swap starting positions - offense at 3, defense at 8
      newGame.player1.currentPosition = 8
      newGame.player2.currentPosition = 3
    }
    // If player2 had it last, player1 gets it (which is the default)
    
    updateGameState(newGame)
    setMoveHistory([])
    setTurnNumber(0)
    setShowMoveComplete(null)
  }

  function getRandomArchetype(): Archetype {
    const archetypes: Archetype[] = ['midrange', 'shooter', 'defender']
    return archetypes[Math.floor(Math.random() * archetypes.length)]
  }

  const value = {
    gameState,
    lastShotResult,
    showShotBanner,
    moveHistory,
    showMoveComplete,
    showBlockPopup,
    startGame,
    selectPosition,
    resetGame,
    restartCurrentGame
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

