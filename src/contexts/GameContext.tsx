import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { GameState, GameMode, Archetype, MoveHistory } from '../types/Game'
import { initializeGame, processMove, validateMove } from '../game/GameEngine'
import { getAIMove, recordHumanStartMove, clearHumanStartMoves } from '../game/AI'
import { checkUnlocks } from '../game/Unlocks'
import { CHARACTERS } from '../types/Character'
import { useAuth } from './AuthContext'
import { getGameDoc, subscribeToGame, updateGameDoc } from '../firebase/online'

type GameContextType = {
  gameState: GameState | null
  lastShotResult: { made: boolean, points: number, probability: number, baseProbability: number, distance: number, shotBy: 'player1' | 'player2', shotPosition: number } | null
  showShotBanner: boolean
  moveHistory: MoveHistory[]
  showMoveComplete: number | null
  showBlockPopup: boolean
  completeShotAnimation: () => void
  startGame: (mode: GameMode, archetype: Archetype, difficulty?: 'easy' | 'medium' | 'hard', player2Archetype?: Archetype) => void
  startOnlineGameFromFirestore: (gameId: string, myRole: 'player1' | 'player2') => Promise<void>
  onlineGameLoading: boolean
  onlineMyRole: 'player1' | 'player2' | null
  selectPosition: (position: number) => void
  resetGame: () => void
  quitOnlineGame: () => Promise<void>
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
  const { currentUser, updateUserStats, updateUserUnlockedCosmetics, updateUserCoins, updateUserChallengeOpponents } = useAuth()
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
  const pendingShotStateRef = useRef<GameState | null>(null)
  const shotAnimationFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const consecutiveHardWinsRef = useRef(0)
  const hard11_0WinsThisSessionRef = useRef(0)
  const onlineGameIdRef = useRef<string | null>(null)
  const onlineMyRoleRef = useRef<'player1' | 'player2' | null>(null)
  const onlineUnsubRef = useRef<(() => void) | null>(null)
  const onlineSavedGameIdRef = useRef<string | null>(null)
  const [onlineGameLoading, setOnlineGameLoading] = useState(false)
  const [onlineMyRole, setOnlineMyRole] = useState<'player1' | 'player2' | null>(null)

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
    if (mode !== 'ai' || difficulty !== 'hard') {
      consecutiveHardWinsRef.current = 0
    }
    if (mode === 'ai' && difficulty === 'hard') {
      clearHumanStartMoves()
    }
    updateGameState(newGame)
    setMoveHistory([])
    setTurnNumber(0)
    setShowMoveComplete(null)
  }

  async function startOnlineGameFromFirestore(gameId: string, myRole: 'player1' | 'player2') {
    if (!currentUser) return
    if (onlineUnsubRef.current) {
      onlineUnsubRef.current()
      onlineUnsubRef.current = null
    }
    setOnlineGameLoading(true)
    onlineGameIdRef.current = gameId
    onlineMyRoleRef.current = myRole
    setOnlineMyRole(myRole)
    onlineSavedGameIdRef.current = null
    try {
      const gameDoc = await getGameDoc(gameId)
      if (!gameDoc?.gameState) {
        setOnlineGameLoading(false)
        updateGameState(null)
        return
      }
      let stateToUse = gameDoc.gameState
      if (myRole === 'player2') {
        const myCosmetics = currentUser.equippedCosmetics ?? {}
        stateToUse = {
          ...gameDoc.gameState,
          player2: {
            ...gameDoc.gameState.player2,
            equippedCosmetics: myCosmetics
          }
        }
        updateGameState(stateToUse)
        await updateGameDoc(gameId, stateToUse)
      } else {
        updateGameState(stateToUse)
      }
      setMoveHistory([])
      setTurnNumber(0)
      setShowMoveComplete(null)
      setOnlineGameLoading(false)
      onlineUnsubRef.current = subscribeToGame(gameId, (data) => {
        const remote = data.gameState
        if (!remote) return
        if (data.lastShotResult) {
          setLastShotResult({ ...data.lastShotResult, shotBy: data.lastShotResult.shotBy, shotPosition: data.lastShotResult.shotPosition })
          setShowShotBanner(false)
          pendingShotStateRef.current = remote
          return
        }
        if (pendingShotStateRef.current) return
        updateGameState(remote)
        if (remote.status === 'finished' && currentUser && onlineSavedGameIdRef.current !== gameId) {
          onlineSavedGameIdRef.current = gameId
          saveGameStats(remote)
        }
      })
    } catch (e) {
      setOnlineGameLoading(false)
      updateGameState(null)
      console.error('Failed to load online game', e)
    }
  }

  function selectPosition(position: number) {
    // Use ref to get latest state to avoid stale closures
    const currentState = gameStateRef.current
    if (!currentState || currentState.status !== 'playing') return

    // Online: only allow moves when it's our turn
    if (currentState.mode === 'online' && onlineMyRoleRef.current) {
      const myRole = onlineMyRoleRef.current
      const isOffenseTurn = currentState.currentTurn === 'offense'
      const isMyOffense = currentState.possession === 'player1' ? myRole === 'player1' : myRole === 'player2'
      const isMyDefense = currentState.possession === 'player1' ? myRole === 'player2' : myRole === 'player1'
      if (isOffenseTurn && !isMyOffense) return
      if (!isOffenseTurn && !isMyDefense) return
    }

    const gameId = currentState.mode === 'online' ? onlineGameIdRef.current : null

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
      if (gameId) updateGameDoc(gameId, updatedState).catch(console.error)
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
      if (gameId) updateGameDoc(gameId, updatedState).catch(console.error)
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

    // Record human's first move (3 → 2 or 4) for Hard AI adaptation
    if (currentState.mode === 'ai' && currentState.aiDifficulty === 'hard' && isPlayer1Offense && currentState.moveCount === 0 && currentOffensePos === 3 && (offenseMove === 2 || offenseMove === 4)) {
      recordHumanStartMove(offenseMove)
    }

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
      
      // Store state to apply when GameScreen calls completeShotAnimation (after ball animation ends)
      pendingShotStateRef.current = newState
      
      if (currentState.mode === 'online' && onlineGameIdRef.current) {
        updateGameDoc(onlineGameIdRef.current, newState, {
          ...shotResult,
          shotBy: currentPossession,
          shotPosition: offenseMove
        }).catch(console.error)
      }
      
      // Fallback: if completeShotAnimation is never called (e.g. user navigates away), apply after 8s
      if (shotAnimationFallbackTimeoutRef.current) clearTimeout(shotAnimationFallbackTimeoutRef.current)
      shotAnimationFallbackTimeoutRef.current = setTimeout(() => {
        if (pendingShotStateRef.current != null) {
          console.log('Shot animation fallback - applying pending state')
          const state = pendingShotStateRef.current
          pendingShotStateRef.current = null
          shotAnimationFallbackTimeoutRef.current = null
          updateGameState(state)
          setShowShotBanner(true)
          if (state.status === 'finished' && currentUser) saveGameStats(state)
          setTimeout(() => {
            setLastShotResult(null)
            setShowShotBanner(false)
          }, 2500)
        }
      }, 8000)
      return
    }
    
    // No shot - just a regular move
    console.log('No shot, updating state normally')
    
    // Update positions immediately (both players move visually)
    updateGameState(newState)
    
    // Switch to next turn (offense for next move) - possession stays the same until a shot
    const nextState = newState ? { ...newState, currentTurn: 'offense' as 'offense', offenseSelection: null } : null
    updateGameState(nextState)
    if (nextState && currentState.mode === 'online' && onlineGameIdRef.current) {
      updateGameDoc(onlineGameIdRef.current, nextState).catch(console.error)
    }
  }

  function completeShotAnimation() {
    if (pendingShotStateRef.current == null) return
    if (shotAnimationFallbackTimeoutRef.current) {
      clearTimeout(shotAnimationFallbackTimeoutRef.current)
      shotAnimationFallbackTimeoutRef.current = null
    }
    const state = pendingShotStateRef.current
    pendingShotStateRef.current = null
    // Update score and player positions at the same time so they don't appear out of sync
    updateGameState(state)
    setShowShotBanner(true)
    if (state.status === 'finished' && currentUser) saveGameStats(state)
    setTimeout(() => {
      setLastShotResult(null)
      setShowShotBanner(false)
    }, 2500)
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
    let modeKey: string = endedGameState.mode
    if (endedGameState.mode === 'ai' && endedGameState.aiDifficulty) {
      modeKey = `practice_${endedGameState.aiDifficulty}`
    }
    if (endedGameState.mode === 'online') {
      // Default to 'challenge' when gameSource is missing (legacy games or propagation bug)
      modeKey = endedGameState.gameSource === 'quickmatch' ? 'online' : 'online_friends'
    }
    
    // For online, use the player that matches currentUser to get stats and won
    const isPlayer1 = endedGameState.player1.uid === currentUser.uid
    const playerStats = isPlayer1 ? endedGameState.player1 : endedGameState.player2
    const won = endedGameState.winner === (isPlayer1 ? endedGameState.player1.username : endedGameState.player2.username)

    // Record challenge opponent for "play against N different friends" ball unlocks
    if (endedGameState.mode === 'online' && endedGameState.gameSource === 'challenge') {
      const opponentUid = isPlayer1 ? endedGameState.player2.uid : endedGameState.player1.uid
      updateUserChallengeOpponents(opponentUid)
    }
    
    // Update session counters for Practice Hard (before unlock check)
    const isPracticeHard = endedGameState.mode === 'ai' && endedGameState.aiDifficulty === 'hard'
    if (isPracticeHard) {
      if (won) {
        consecutiveHardWinsRef.current += 1
        const is11_0 = endedGameState.player1.score === 11 && endedGameState.player2.score === 0
        if (is11_0) hard11_0WinsThisSessionRef.current += 1
      } else {
        consecutiveHardWinsRef.current = 0
      }
    }
    
    updateUserStats(
      modeKey,
      won,
      playerStats.score,
      playerStats.shotsMade,
      playerStats.shotsAttempted,
      playerStats.threesMade,
      playerStats.threesAttempted
    )

    const currentUnlocked = currentUser.unlockedCosmetics || []
    const baseCount = currentUser.challengeOpponentUids?.length ?? 0
    const isChallenge = endedGameState.mode === 'online' && endedGameState.gameSource === 'challenge'
    const opponentUidForCount = isChallenge ? (isPlayer1 ? endedGameState.player2.uid : endedGameState.player1.uid) : ''
    const alreadyInList = opponentUidForCount ? (currentUser.challengeOpponentUids?.includes(opponentUidForCount) ?? false) : false
    const friendsOpponentCount = baseCount + (isChallenge && !alreadyInList ? 1 : 0)
    const unlockContext = {
      consecutiveHardWins: consecutiveHardWinsRef.current,
      hard11_0WinsThisSession: hard11_0WinsThisSessionRef.current,
      friendsOpponentCount
    }
    const newlyUnlocked = checkUnlocks(endedGameState, currentUnlocked, unlockContext)
    if (newlyUnlocked.length > 0) {
      updateUserUnlockedCosmetics(newlyUnlocked)
    }

    if (won && endedGameState.mode === 'ai' && endedGameState.aiDifficulty) {
      const coinsByDifficulty = { easy: 1, medium: 3, hard: 5 }
      updateUserCoins(coinsByDifficulty[endedGameState.aiDifficulty])
    }
  }

  function resetGame() {
    if (onlineUnsubRef.current) {
      onlineUnsubRef.current()
      onlineUnsubRef.current = null
    }
    onlineGameIdRef.current = null
    onlineMyRoleRef.current = null
    setOnlineMyRole(null)
    onlineSavedGameIdRef.current = null
    updateGameState(null)
    setLastShotResult(null)
    setShowShotBanner(false)
    pendingShotStateRef.current = null
    if (shotAnimationFallbackTimeoutRef.current) {
      clearTimeout(shotAnimationFallbackTimeoutRef.current)
      shotAnimationFallbackTimeoutRef.current = null
    }
    setMoveHistory([])
    setTurnNumber(0)
    setShowMoveComplete(null)
    setShowBlockPopup(false)
  }

  /** End the online game for both players and record a loss for the quitter. */
  async function quitOnlineGame(): Promise<void> {
    const state = gameStateRef.current
    if (!state || state.mode !== 'online' || !onlineGameIdRef.current || !onlineMyRoleRef.current) {
      resetGame()
      return
    }
    const myRole = onlineMyRoleRef.current
    const winnerUsername = myRole === 'player1' ? state.player2.username : state.player1.username
    const finishedState: GameState = { ...state, status: 'finished', winner: winnerUsername }
    const gameId = onlineGameIdRef.current
    try {
      await updateGameDoc(gameId, finishedState)
      if (currentUser) saveGameStats(finishedState)
    } finally {
      resetGame()
    }
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
    
    if (gameState.mode === 'ai' && gameState.aiDifficulty === 'hard') {
      clearHumanStartMoves()
    }
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
    completeShotAnimation,
    startGame,
    startOnlineGameFromFirestore,
    onlineGameLoading,
    onlineMyRole,
    selectPosition,
    resetGame,
    quitOnlineGame,
    restartCurrentGame
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

