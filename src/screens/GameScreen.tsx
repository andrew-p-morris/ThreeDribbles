import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import Court from '../components/Court'
import { COURT_POSITIONS, getPosition } from '../game/CourtPositions'
import './GameScreen.css'
import { audioManager } from '../audio/AudioManager'

function GameScreen() {
  const { gameState, selectPosition, resetGame, restartCurrentGame, lastShotResult, showShotBanner, showBlockPopup } = useGame()
  const { currentUser } = useAuth()
  const { soundMuted, volume, setSoundMuted } = useSettings()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [shotAnimation, setShotAnimation] = useState<{ from: { x: number, y: number }, show: boolean } | null>(null)
  const lastAnimatedShotRef = useRef<{ shotBy: 'player1' | 'player2', shotPosition: number, timestamp: number } | null>(null)
  const animationInProgressRef = useRef(false)
  const [ballPosition, setBallPosition] = useState<{ x: number, y: number } | null>(null)
  const [showShotResult, setShowShotResult] = useState(false)
  const [showBlockIndicator, setShowBlockIndicator] = useState(false)
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)

  // Keep AudioManager mute in sync
  useEffect(() => {
    audioManager.setMuted(!!soundMuted)
  }, [soundMuted])
  // Keep AudioManager volume in sync
  useEffect(() => {
    audioManager.setVolume(volume)
  }, [volume])

  useEffect(() => {
    if (!gameState) {
      console.log('No game state, redirecting to home')
      navigate('/home')
      return
    }

    if (gameState.status === 'finished') {
      setMessage(`🏆 ${gameState.winner} wins!`)
    } else if (lastShotResult !== null) {
      // Shot animation is playing
      setMessage('🏀 Shot is up!')
    } else if (gameState.currentTurn === 'offense') {
      // Only show message if it's the player's turn (not AI's)
      if (gameState.mode === 'ai' && gameState.possession === 'player2') {
        // AI's offensive turn - no message (happens automatically)
        return
      }
      const currentPlayer = gameState.possession === 'player1' ? gameState.player1 : gameState.player2
      // Calculate dribble number using actualDribbles (which doesn't include block penalties)
      // actualDribbles = number of actual dribbles made
      // Next dribble number = actualDribbles + 1, capped at 3
      const dribbleNumber = Math.min(gameState.actualDribbles + 1, 3)
      setMessage(`${currentPlayer.username} Turn - Select dribble move (${dribbleNumber}/3)`)
    } else if (gameState.currentTurn === 'defense') {
      // The defender is always the player who does NOT have possession
      if (gameState.mode === 'ai') {
        // In AI mode, if player1 has possession, player2 (AI) defends
        // If player2 has possession, player1 defends
        // Only show message if it's the player's turn to defend (not AI's)
        if (gameState.possession === 'player2') {
          const defensivePlayer = gameState.player1
          setMessage(`${defensivePlayer.username} Turn - Select defensive position`)
        }
        // AI's defense turn - no message (happens automatically)
      } else if (gameState.mode === 'local') {
        const defensivePlayer = gameState.possession === 'player1' ? gameState.player2 : gameState.player1
        setMessage(`${defensivePlayer.username} Turn - Select defensive position`)
      }
    }
  }, [gameState?.status, gameState?.currentTurn, gameState?.moveCount, gameState?.possession, gameState?.offenseSelection, gameState?.mode, lastShotResult, navigate])

  function handlePositionClick(positionId: number) {
    if (!gameState || gameState.status !== 'playing') return
    
    // Prevent clicks during shot animation
    if (shotAnimation?.show) return
    
    // Check if this will be a block after defense picks
    if (gameState.currentTurn === 'defense' && gameState.offenseSelection === positionId) {
      setShowBlockIndicator(true)
      setTimeout(() => setShowBlockIndicator(false), 2000)
    }
    
    selectPosition(positionId)
  }

  // Listen for shot events to trigger animation and sounds
  useEffect(() => {
    if (lastShotResult && gameState && !shotAnimation?.show && !animationInProgressRef.current) {
      // Check if we've already animated this shot (prevents re-animation after state updates)
      const shotKey = `${lastShotResult.shotBy}-${lastShotResult.shotPosition}`
      const lastAnimatedKey = lastAnimatedShotRef.current 
        ? `${lastAnimatedShotRef.current.shotBy}-${lastAnimatedShotRef.current.shotPosition}`
        : null
      
      if (shotKey === lastAnimatedKey) {
        // Already animated this shot, don't animate again
        return
      }
      
      // Mark that animation is in progress
      animationInProgressRef.current = true
      
      // Mark this shot as animated
      lastAnimatedShotRef.current = {
        shotBy: lastShotResult.shotBy,
        shotPosition: lastShotResult.shotPosition,
        timestamp: Date.now()
      }
      
      // A shot just happened, use the stored shot position (not current position, which may have reset)
      const position = getPosition(lastShotResult.shotPosition)
      
      // Start animation immediately
      const startX = position.x
      const startY = position.y
      const basketX = 35
      const basketY = 72

      // Play whistle at start if this is a 3PT attempt
      try {
        const isThree = getPosition(lastShotResult.shotPosition).isThreePoint
        if (isThree) {
          audioManager.playWhistle(0.28)
        }
      } catch {}
      
      // Calculate end position (basket for made, rim for missed)
      let endX = basketX
      let endY = basketY
      if (!lastShotResult.made) {
        // Missed shot: hit rim (slightly offset)
        const dx = startX - basketX
        const dy = startY - basketY
        const angle = Math.atan2(dy, dx)
        endX = basketX + Math.cos(angle + Math.PI / 2) * 1.2
        endY = basketY + Math.sin(angle + Math.PI / 2) * 1.2
      }
      
      setShotAnimation({ from: { x: startX, y: startY }, show: true })
      setBallPosition({ x: startX, y: startY })
      setShowShotResult(false) // Hide banner during animation
      
      // Calculate distance to basket to determine animation duration
      const distanceToBasket = Math.sqrt(Math.pow(startX - basketX, 2) + Math.pow(startY - basketY, 2))
      
      // Check if shooting from position 11 (paint) - very close, needs quick animation
      const isPaintShot = lastShotResult.shotPosition === 11
      // Check if shooting from position 3 (top of key) - needs 5 seconds
      const isTopOfKeyShot = lastShotResult.shotPosition === 3
      
      // Base duration, longer for further shots
      // Positions 2, 3, 4 are further (y=52 or y=38 vs basket y=72)
      // Position 3 is furthest (y=38), so needs longest animation
      let baseDuration = 3000 // Base 3 seconds for made shots
      if (isTopOfKeyShot) {
        // Position 3 (top of key) - 5 seconds
        baseDuration = 5000 // 5 seconds for top of key shots
      } else if (isPaintShot) {
        // Position 11 (paint) is very close - quick shot
        baseDuration = 1500 // 1.5 seconds for paint shots
      } else if (distanceToBasket > 28) {
        // Far shots (positions 2, 4) - add extra time
        // Position 2: ~28.3, Position 4: ~28.3
        baseDuration = 4500 // 4.5 seconds for far shots
      } else if (distanceToBasket > 20) {
        // Medium distance shots
        baseDuration = 3500 // 3.5 seconds
      }
      
      const animationDuration = lastShotResult.made ? baseDuration : baseDuration + 500 // Add 0.5s for missed shots
      const startTime = Date.now()
      const frames = 60 // 60 frames per second
      const frameDuration = animationDuration / frames
      
      let frame = 0
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / animationDuration, 1)
        
        if (progress < 1) {
          // Calculate arc path (parabolic)
          const arcHeight = Math.abs(startY - endY) * 0.3 // Arc height
          const currentX = startX + (endX - startX) * progress
          const currentY = startY + (endY - startY) * progress - (arcHeight * Math.sin(progress * Math.PI))
          
          setBallPosition({ x: currentX, y: currentY })
          frame++
          requestAnimationFrame(animate)
        } else {
          // Animation complete
          setBallPosition(null)
          setShotAnimation(null)
          setShowShotResult(true)
          animationInProgressRef.current = false
          // Play result SFX (swish or clank)
          try {
            if (lastShotResult.made) {
              audioManager.playSwish(0.55)
            } else {
              audioManager.playClank(0.65)
            }
          } catch {}
          // Don't clear lastAnimatedShotRef here - keep it until lastShotResult is cleared
        }
      }
      
      requestAnimationFrame(animate)
    } else {
      // Clear shot result display when no shot
      setShowShotResult(false)
      setBallPosition(null)
      // Clear the animation tracking when lastShotResult is cleared
      if (!lastShotResult) {
        lastAnimatedShotRef.current = null
        animationInProgressRef.current = false
      }
    }
  }, [lastShotResult, gameState])

  function handleQuit() {
    resetGame()
    navigate('/home')
  }

  function handleRematch() {
    // For online mode, could track rematch count here
    // For now, just restart with same settings
    if (!gameState) return
    
    if (confirm('Rematch with same opponent?')) {
      restartCurrentGame()
      // TODO: In online mode, send rematch request
    }
  }

  function handleRestartGame() {
    if (!gameState) return
    setShowRestartConfirm(true)
  }

  function confirmRestart() {
    setShowPauseMenu(false)
    setShowRestartConfirm(false)
    restartCurrentGame()
  }

  function cancelRestart() {
    setShowRestartConfirm(false)
  }


  if (!gameState) return null

  const isPlayer1Turn = gameState.possession === 'player1'
  const offensivePlayer = isPlayer1Turn ? gameState.player1 : gameState.player2
  const defensivePlayer = isPlayer1Turn ? gameState.player2 : gameState.player1

  return (
    <div className="screen game-screen">
      <div className="game-container">
        <header className="game-header">
          <button onClick={handleQuit} className="btn-quit">
            ← Quit
          </button>
          {gameState.mode !== 'online' && (
            <button onClick={() => setShowPauseMenu(true)} className="btn-pause">
              ⚙️ Menu
            </button>
          )}
        </header>

        <div className="game-layout">
          <div className="left-section">
            <div className="scoreboard">
              <div className={`player-score ${gameState.possession === 'player1' ? 'active' : ''}`}>
                <div className="player-info">
                  <div className="player-name">{gameState.player1.username}</div>
                  <div className="archetype">{gameState.player1.archetype}</div>
                </div>
                <div className="score">{gameState.player1.score}</div>
              </div>
              
              <div className="score-divider">-</div>
              
              <div className={`player-score ${gameState.possession === 'player2' ? 'active' : ''}`}>
                <div className="player-info">
                  <div className="player-name">{gameState.player2.username}</div>
                  <div className="archetype">{gameState.player2.archetype}</div>
                </div>
                <div className="score">{gameState.player2.score}</div>
              </div>
              
              <div className="stats-section">
                <div className="player-stat-column">
                  <div className="stat-label">P1 Stats</div>
                  <div className="stat-row">
                    <span className="stat-item">
                      FG: {gameState.player1.shotsAttempted > 0 
                        ? `${Math.round((gameState.player1.shotsMade / gameState.player1.shotsAttempted) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-item">
                      3PT: {gameState.player1.threesAttempted > 0
                        ? `${Math.round((gameState.player1.threesMade / gameState.player1.threesAttempted) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
                <div className="player-stat-column">
                  <div className="stat-label">P2 Stats</div>
                  <div className="stat-row">
                    <span className="stat-item">
                      FG: {gameState.player2.shotsAttempted > 0 
                        ? `${Math.round((gameState.player2.shotsMade / gameState.player2.shotsAttempted) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-item">
                      3PT: {gameState.player2.threesAttempted > 0
                        ? `${Math.round((gameState.player2.threesMade / gameState.player2.threesAttempted) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
                <Court
              positions={COURT_POSITIONS}
              offensePosition={offensivePlayer.currentPosition}
              defensePosition={defensivePlayer.currentPosition}
              onPositionClick={handlePositionClick}
              highlightedPositions={
                gameState.currentTurn === 'offense'
                  ? getPosition(offensivePlayer.currentPosition).adjacentPositions
                  : getPosition(defensivePlayer.currentPosition).adjacentPositions
              }
              shotAnimation={shotAnimation}
              ballPosition={ballPosition}
              player1Score={gameState.player1.score}
              player2Score={gameState.player2.score}
              shotResult={showShotBanner ? lastShotResult : null}
              player1CharacterId={gameState.player1.characterId}
              player2CharacterId={gameState.player2.characterId}
              isPlayer1Offense={isPlayer1Turn}
              player1Archetype={gameState.player1.archetype}
              player2Archetype={gameState.player2.archetype}
              showBlockIndicator={showBlockIndicator}
              player1Cosmetics={currentUser?.equippedCosmetics}
              player2Cosmetics={undefined}
            />
          </div>

          <div className="side-panel">
            <div className="game-status">
              <div className="status-message">{message}</div>
            </div>

            {/* Show controls for local mode always, for AI only on player's turn */}
            {/* Hide defense controls only when shot animation is playing */}
            {/* In AI mode, only show controls when it's the player's turn to act (not AI's) */}
            {/* Player acts when: (possession === 'player1' && currentTurn === 'offense') OR (possession === 'player2' && currentTurn === 'defense') */}
            {gameState.mode === 'local' || (gameState.mode === 'ai' && ((isPlayer1Turn && gameState.currentTurn === 'offense') || (!isPlayer1Turn && gameState.currentTurn === 'defense'))) ? (
              (() => {
                // Hide defense controls only when shot animation is playing (lastShotResult is set)
                const shouldHideDefense = lastShotResult !== null && gameState.currentTurn === 'defense'
                
                return shouldHideDefense ? null : (
              <div className="action-controls">
                <div className="action-label">
                  {gameState.currentTurn === 'offense' 
                    ? `${offensivePlayer.username} - Choose Your Move:`
                    : `${defensivePlayer.username} - Choose Defense:`}
                </div>
                <div className="action-buttons-vertical">
                  {gameState.currentTurn === 'offense' ? (
                    <>
                      {getPosition(offensivePlayer.currentPosition).adjacentPositions.map(posId => (
                        <button
                          key={posId}
                          className="btn btn-secondary action-btn"
                          onClick={() => handlePositionClick(posId)}
                        >
                          Position {posId}
                        </button>
                      ))}
                      <button
                        className="btn btn-primary action-btn"
                        onClick={() => handlePositionClick(-1)}
                      >
                        🏀 Shoot Now
                      </button>
                    </>
                  ) : (
                    <>
                      {getPosition(defensivePlayer.currentPosition).adjacentPositions.map(posId => (
                        <button
                          key={posId}
                          className="btn btn-secondary action-btn"
                          onClick={() => handlePositionClick(posId)}
                        >
                          Position {posId}
                        </button>
                      ))}
                      <button
                        className="btn btn-primary action-btn"
                        onClick={() => handlePositionClick(defensivePlayer.currentPosition)}
                      >
                        🛡️ Contest Shot
                      </button>
                    </>
                  )}
                </div>
              </div>
                )
              })()
            ) : null}
            {/* Block Popup - appears below action controls, always visible */}
            {showBlockPopup && (
              <div className="block-popup">
                <div className="block-popup-content">
                  <h2>-1 Dribble</h2>
                </div>
              </div>
            )}
          </div>
        </div>

        {showPauseMenu && (
          <div className="game-over-overlay">
            <div className="game-over-card card pause-menu">
              <h2>⚙️ GAME MENU</h2>
              <div className="pause-buttons">
                <button onClick={() => setShowPauseMenu(false)} className="btn btn-primary">
                  Resume Game
                </button>
                <button onClick={handleRestartGame} className="btn btn-secondary">
                  Restart Game
                </button>
                    <button 
                      onClick={() => setSoundMuted(!soundMuted)} 
                      className="btn btn-secondary"
                    >
                      {soundMuted ? '🔇 Unmute' : '🔊 Mute'} Sound
                    </button>
                <button onClick={handleQuit} className="btn btn-secondary">
                  Quit to Home
                </button>
              </div>
            </div>
          </div>
        )}

        {showRestartConfirm && (
          <div className="game-over-overlay">
            <div className="game-over-card card">
              <h2>⚠️ Restart Game?</h2>
              <p style={{ margin: '16px 0', color: '#f4e4c1', fontSize: '14px' }}>
                Current progress will be lost.
              </p>
              <div className="pause-buttons">
                <button onClick={confirmRestart} className="btn btn-primary">
                  Yes, Restart
                </button>
                <button onClick={cancelRestart} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState.status === 'finished' && (
          <div className="game-over-overlay">
            <div className="game-over-card card">
              <h2>🏆 Game Over!</h2>
              <div className="winner">{gameState.winner} wins!</div>
              <div className="final-score">
                <div>
                  {gameState.player1.username}: {gameState.player1.score}
                </div>
                <div>
                  {gameState.player2.username}: {gameState.player2.score}
                </div>
              </div>
              <div className="game-over-buttons">
                <button onClick={handleRematch} className="btn btn-primary">
                  {gameState.mode === 'online' ? 'Rematch' : 'New Game'}
                </button>
                <button onClick={handleQuit} className="btn btn-secondary">
                  {gameState.mode === 'online' ? 'Find New Opponent' : 'Home'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameScreen

