import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import { Archetype } from '../types/Game'
import './HomeScreen.css'

function HomeScreen() {
  const { currentUser, signOut } = useAuth()
  const { startGame } = useGame()
  const navigate = useNavigate()
  
  // Debug: log currentUser on mount and redirect if missing
  useEffect(() => {
    console.log('HomeScreen mounted, currentUser:', currentUser)
    if (!currentUser) {
      console.error('No user found in HomeScreen, redirecting to login')
      setTimeout(() => {
        navigate('/')
      }, 100)
    }
  }, [currentUser, navigate])

  const [showModeSelect, setShowModeSelect] = useState(true) // Default to showing mode select
  const [showArchetypeSelect, setShowArchetypeSelect] = useState(false)
  const [showPlayer2ArchetypeSelect, setShowPlayer2ArchetypeSelect] = useState(false)
  const [showAIArchetypeSelect, setShowAIArchetypeSelect] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'local' | 'ai' | 'online' | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [player1Archetype, setPlayer1Archetype] = useState<Archetype | null>(null)
  const [aiArchetype, setAiArchetype] = useState<Archetype | null>(null)
  const [flippedCard, setFlippedCard] = useState<string | null>(null) // Track which card is flipped

  // Check if user has seen "how to play" before
  useEffect(() => {
    if (!currentUser) return
    
    const hasSeenTutorial = localStorage.getItem(`hasSeenTutorial_${currentUser.uid}`)
    if (!hasSeenTutorial) {
      // First time user - show how to play
      setShowHowToPlay(true)
      setShowModeSelect(false)
      localStorage.setItem(`hasSeenTutorial_${currentUser.uid}`, 'true')
    }
  }, [currentUser])

  function handlePlayClick() {
    setShowModeSelect(true)
  }

  function handleModeSelect(mode: 'local' | 'ai' | 'online') {
    console.log('Mode selected:', mode)
    
    // Online mode goes to separate screen
    if (mode === 'online') {
      navigate('/online')
      return
    }
    
    setSelectedMode(mode)
    setShowModeSelect(false)
    setShowArchetypeSelect(true)
    console.log('State after mode select:', { mode, showArchetype: true })
  }

  async function handleArchetypeSelect(archetype: Archetype, isPlayer2: boolean = false) {
    if (!selectedMode || !currentUser) {
      console.error('Missing mode or user')
      if (!selectedMode) alert('Error: Game mode was not selected properly')
      if (!currentUser) alert('Error: No user logged in')
      return
    }

    // For local multiplayer, Player 1 chooses archetype, then P2 chooses
    if (selectedMode === 'local' && !isPlayer2) {
      setPlayer1Archetype(archetype)
      setShowArchetypeSelect(false)
      setShowPlayer2ArchetypeSelect(true)
      return
    }

    // For local P2 archetype selection, start game immediately
    if (selectedMode === 'local' && isPlayer2) {
      
      // Start game immediately
      try {
        const player2Arch = archetype
        const player1Arch = player1Archetype!
        
        console.log('Starting local game with:', { 
          selectedMode, 
          player1Arch,
          player2Arch
        })
        
        startGame(selectedMode, player1Arch, undefined, player2Arch)
        
        await new Promise(resolve => setTimeout(resolve, 50))
        navigate('/game', { replace: true })
      } catch (error) {
        console.error('Error starting game:', error)
      }
      return
    }

    // For AI mode, show AI archetype selection
    if (selectedMode === 'ai') {
      setPlayer1Archetype(archetype)
      setShowArchetypeSelect(false)
      setShowAIArchetypeSelect(true)
      return
    }
  }

  async function handleAIArchetypeSelect(archetype: Archetype) {
    if (!selectedMode || !currentUser || !player1Archetype) return

    setAiArchetype(archetype)

    try {
      console.log('Starting AI game with:', { 
        selectedMode, 
        player1Archetype,
        aiArchetype: archetype,
        difficulty: selectedDifficulty
      })
      
      startGame(selectedMode, player1Archetype, selectedDifficulty, archetype)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      navigate('/game', { replace: true })
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  function handleProfileClick() {
    navigate('/profile')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="screen home-screen">
      <div className="home-container">
        <header className="home-header">
          <h1 className="game-title">🏀 THREE DRIBBLES</h1>
          <div className="header-controls">
            {(showModeSelect || showArchetypeSelect || showPlayer2ArchetypeSelect || showAIArchetypeSelect) && (
              <button 
                onClick={() => {
                  if (showModeSelect) {
                    setShowModeSelect(false)
                  } else if (showArchetypeSelect) {
                    setShowArchetypeSelect(false)
                    setShowModeSelect(true)
                  } else if (showPlayer2ArchetypeSelect) {
                    setShowPlayer2ArchetypeSelect(false)
                    setShowArchetypeSelect(true)
                  } else if (showAIArchetypeSelect) {
                    setShowAIArchetypeSelect(false)
                    setShowModeSelect(true)
                  }
                }} 
                className="btn-icon back-arrow-header"
                title="Back"
              >
                ←
              </button>
            )}
            <div className="user-info">
              <span className="username">{currentUser?.displayName}</span>
              <button onClick={() => navigate('/settings')} className="btn-icon">
                ⚙️
              </button>
              {!currentUser?.isGuest && (
                <button onClick={handleProfileClick} className="btn-icon">
                  👤
                </button>
              )}
              <button 
                onClick={() => setShowHowToPlay(true)} 
                className="btn-icon"
                title="How to Play"
              >
                ℹ️
              </button>
              <button onClick={handleSignOut} className="btn-icon">
                🚪
              </button>
            </div>
          </div>
        </header>

        {showHowToPlay && (
          <div className="how-to-play-overlay">
            <div className="how-to-play card">
              <div className="how-to-play-header">
                <h2>How to Play</h2>
                <button 
                  onClick={() => setShowHowToPlay(false)} 
                  className="btn-close"
                >
                  ✕
                </button>
              </div>
              <div className="game-info">
                <h4>Basics</h4>
                <ul>
                  <li>Choose archetype & character</li>
                  <li>Offense: Dribble to adjacent positions or Shoot Now</li>
                  <li>Defense: Guard adjacent positions or Contest Shot</li>
                  <li>Same spot = Defense wins! Offense loses a dribble</li>
                </ul>
                
                <h4>Scoring</h4>
                <ul>
                  <li>3PT = 2 points, 2PT = 1 point</li>
                  <li>Shot % based on distance & archetype</li>
                  <li>Make it = Keep ball, Miss = Opponent's ball</li>
                </ul>
                
                <h4>Winning</h4>
                <ul>
                  <li>First to 11+ points wins (must win by 2)</li>
                  <li>If score reaches 30, sudden death: next made shot wins!</li>
                </ul>
                
                <h4>Archetypes:</h4>
                <ul>
                  <li>🎯 **Mid Range**: Balanced, strong in mid-range.</li>
                  <li>🌟 **Shooter**: Best from 3-point range.</li>
                  <li>🛡️ **Defender**: Strong in the paint, reduces opponent's shot percentage.</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  setShowHowToPlay(false)
                  if (!showModeSelect) {
                    setShowModeSelect(true)
                  }
                }} 
                className="btn btn-primary"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {!showModeSelect && !showArchetypeSelect && !showPlayer2ArchetypeSelect && !showAIArchetypeSelect && !showHowToPlay && (
          <div className="main-menu">
            <button onClick={handlePlayClick} className="btn btn-primary btn-large">
              Play Game
            </button>

            {!currentUser?.isGuest && (
              <div className="stats-preview card">
                <h3>Your Stats</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <div className="stat-value">{currentUser?.stats.wins || 0}</div>
                    <div className="stat-label">Wins</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{currentUser?.stats.losses || 0}</div>
                    <div className="stat-label">Losses</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{currentUser?.stats.totalGames || 0}</div>
                    <div className="stat-label">Games</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showModeSelect && (
          <div className="mode-select">
            <h2>Select Game Mode</h2>
            <div className="mode-options">
              <button onClick={() => handleModeSelect('local')} className="card mode-card">
                <div className="mode-icon">👥</div>
                <h3>Local Multiplayer</h3>
                <p>Pass and play on same device</p>
              </button>

              <div onClick={() => handleModeSelect('ai')} className="card mode-card">
                <div className="mode-icon">🎯</div>
                <h3>Practice Mode</h3>
                <p>Train against AI</p>
                <div className="difficulty-selector" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    aria-label="Select difficulty level"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <button onClick={() => handleModeSelect('online')} className="card mode-card">
                <div className="mode-icon">🌐</div>
                <h3>Online</h3>
                <p>Find opponents worldwide</p>
              </button>
            </div>
          </div>
        )}

        {showArchetypeSelect && (
          <div className="archetype-select">
            <h2>{selectedMode === 'local' ? 'Player 1 - Choose Your Archetype' : 'Choose Your Archetype'}</h2>
            <div className="archetype-options">
              <div 
                className={`archetype-card-wrapper ${flippedCard === 'midrange' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'midrange' ? null : 'midrange')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🎯</div>
                    <h3>Mid Range</h3>
                    <p>Paint <span className="archetype-strength">Mid</span> 3PT 50% <span className="archetype-strength">75%</span> 50%</p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Mid Range</h3>
                    <div className="archetype-description">
                      <p><strong>Balanced playstyle</strong> with strength in mid-range shots.</p>
                      <ul>
                        <li>🎯 <strong>75%</strong> from mid-range</li>
                        <li>⚖️ <strong>50%</strong> from 3-point and paint</li>
                        <li>💪 Versatile and consistent</li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchetypeSelect('midrange')
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className={`archetype-card-wrapper ${flippedCard === 'shooter' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'shooter' ? null : 'shooter')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🌟</div>
                    <h3>Shooter</h3>
                    <p>Paint Mid <span className="archetype-strength">3PT</span> 25% 50% <span className="archetype-strength">75%</span></p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Shooter</h3>
                    <div className="archetype-description">
                      <p><strong>Elite from long range</strong>, deadly from 3-point line.</p>
                      <ul>
                        <li>🌟 <strong>75%</strong> from 3-point range</li>
                        <li>📊 <strong>50%</strong> from mid-range</li>
                        <li>⚠️ <strong>25%</strong> from paint (weak inside)</li>
                        <li>🏀 3-pointers worth <strong>2 points</strong></li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchetypeSelect('shooter')
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className={`archetype-card-wrapper ${flippedCard === 'defender' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'defender' ? null : 'defender')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🛡️</div>
                    <h3>Defender</h3>
                    <p><span className="archetype-strength">Paint</span> Mid 3PT <span className="archetype-strength">75%</span> 50% 25%</p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Defender</h3>
                    <div className="archetype-description">
                      <p><strong>Dominant in the paint</strong> and reduces opponent's shots.</p>
                      <ul>
                        <li>🛡️ <strong>75%</strong> from paint</li>
                        <li>📊 <strong>50%</strong> from mid-range</li>
                        <li>⚠️ <strong>25%</strong> from 3-point (weak outside)</li>
                        <li>💪 <strong>-5%</strong> to opponent's shot percentage when defending</li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchetypeSelect('defender')
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPlayer2ArchetypeSelect && (
          <div className="archetype-select">
            <h2>Player 2 - Choose Your Archetype</h2>
            <div className="archetype-options">
              <div 
                className={`archetype-card-wrapper ${flippedCard === 'midrange-p2' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'midrange-p2' ? null : 'midrange-p2')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🎯</div>
                    <h3>Mid Range</h3>
                    <p>Paint <span className="archetype-strength">Mid</span> 3PT 50% <span className="archetype-strength">75%</span> 50%</p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Mid Range</h3>
                    <div className="archetype-description">
                      <p><strong>Balanced playstyle</strong> with strength in mid-range shots.</p>
                      <ul>
                        <li>🎯 <strong>75%</strong> from mid-range</li>
                        <li>⚖️ <strong>50%</strong> from 3-point and paint</li>
                        <li>💪 Versatile and consistent</li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchetypeSelect('midrange', true)
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className={`archetype-card-wrapper ${flippedCard === 'shooter-p2' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'shooter-p2' ? null : 'shooter-p2')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🌟</div>
                    <h3>Shooter</h3>
                    <p>Paint Mid <span className="archetype-strength">3PT</span> 25% 50% <span className="archetype-strength">75%</span></p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Shooter</h3>
                    <div className="archetype-description">
                      <p><strong>Elite from long range</strong>, deadly from 3-point line.</p>
                      <ul>
                        <li>🌟 <strong>75%</strong> from 3-point range</li>
                        <li>📊 <strong>50%</strong> from mid-range</li>
                        <li>⚠️ <strong>25%</strong> from paint (weak inside)</li>
                        <li>🏀 3-pointers worth <strong>2 points</strong></li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchetypeSelect('shooter', true)
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className={`archetype-card-wrapper ${flippedCard === 'defender-p2' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'defender-p2' ? null : 'defender-p2')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🛡️</div>
                    <h3>Defender</h3>
                    <p><span className="archetype-strength">Paint</span> Mid 3PT <span className="archetype-strength">75%</span> 50% 25%</p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Defender</h3>
                    <div className="archetype-description">
                      <p><strong>Dominant in the paint</strong> and reduces opponent's shots.</p>
                      <ul>
                        <li>🛡️ <strong>75%</strong> from paint</li>
                        <li>📊 <strong>50%</strong> from mid-range</li>
                        <li>⚠️ <strong>25%</strong> from 3-point (weak outside)</li>
                        <li>💪 <strong>-5%</strong> to opponent's shot percentage when defending</li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchetypeSelect('defender', true)
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAIArchetypeSelect && (
          <div className="archetype-select">
            <h2>Choose AI Archetype</h2>
            <div className="archetype-options">
              <div 
                className={`archetype-card-wrapper ${flippedCard === 'midrange-ai' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'midrange-ai' ? null : 'midrange-ai')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🎯</div>
                    <h3>Mid Range</h3>
                    <p>Paint <span className="archetype-strength">Mid</span> 3PT 50% <span className="archetype-strength">75%</span> 50%</p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Mid Range</h3>
                    <div className="archetype-description">
                      <p><strong>Balanced playstyle</strong> with strength in mid-range shots.</p>
                      <ul>
                        <li>🎯 <strong>75%</strong> from mid-range</li>
                        <li>⚖️ <strong>50%</strong> from 3-point and paint</li>
                        <li>💪 Versatile and consistent</li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAIArchetypeSelect('midrange')
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className={`archetype-card-wrapper ${flippedCard === 'shooter-ai' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'shooter-ai' ? null : 'shooter-ai')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🌟</div>
                    <h3>Shooter</h3>
                    <p>Paint Mid <span className="archetype-strength">3PT</span> 25% 50% <span className="archetype-strength">75%</span></p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Shooter</h3>
                    <div className="archetype-description">
                      <p><strong>Elite from long range</strong>, deadly from 3-point line.</p>
                      <ul>
                        <li>🌟 <strong>75%</strong> from 3-point range</li>
                        <li>📊 <strong>50%</strong> from mid-range</li>
                        <li>⚠️ <strong>25%</strong> from paint (weak inside)</li>
                        <li>🏀 3-pointers worth <strong>2 points</strong></li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAIArchetypeSelect('shooter')
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className={`archetype-card-wrapper ${flippedCard === 'defender-ai' ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFlippedCard(flippedCard === 'defender-ai' ? null : 'defender-ai')
                }}
              >
                <div className="archetype-card-inner">
                  <div className="archetype-card-front card archetype-card">
                    <div className="archetype-icon">🛡️</div>
                    <h3>Defender</h3>
                    <p><span className="archetype-strength">Paint</span> Mid 3PT <span className="archetype-strength">75%</span> 50% 25%</p>
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Defender</h3>
                    <div className="archetype-description">
                      <p><strong>Dominant in the paint</strong> and reduces opponent's shots.</p>
                      <ul>
                        <li>🛡️ <strong>75%</strong> from paint</li>
                        <li>📊 <strong>50%</strong> from mid-range</li>
                        <li>⚠️ <strong>25%</strong> from 3-point (weak outside)</li>
                        <li>💪 <strong>-5%</strong> to opponent's shot percentage when defending</li>
                      </ul>
                    </div>
                    <button 
                      className="flip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlippedCard(null)
                      }}
                    >
                      ← Back
                    </button>
                    <button 
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAIArchetypeSelect('defender')
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default HomeScreen

