import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import { useSettings } from '../contexts/SettingsContext'
import { Archetype } from '../types/Game'
import { CHARACTERS } from '../types/Character'
import { PixelCharacter } from '../components/PixelCharacter'
import { listenPendingGame } from '../firebase/online'
import type { PendingGamePayload } from '../firebase/online'
import { audioManager } from '../audio/AudioManager'
import './HomeScreen.css'

// Star ratings (out of 5) for archetype cards: 3PT, Mid, Paint
const ARCHETYPE_STARS: Record<Archetype, { three: number; mid: number; paint: number }> = {
  midrange: { three: 3, mid: 4, paint: 3 },
  shooter: { three: 4, mid: 3, paint: 1 },
  defender: { three: 1, mid: 3, paint: 4 }
}

function StarRating({ value, highlight = false }: { value: number; highlight?: boolean }) {
  const filled = '★'.repeat(value)
  const empty = '☆'.repeat(5 - value)
  return (
    <span className={highlight ? 'archetype-strength star-rating' : 'star-rating'}>
      <span className="star-filled">{filled}</span>
      <span className="star-empty">{empty}</span>
    </span>
  )
}

function ArchetypeStarsLine({ archetype }: { archetype: Archetype }) {
  const s = ARCHETYPE_STARS[archetype]
  const max = Math.max(s.three, s.mid, s.paint)
  const seg = (label: string, value: number) => (
    <>
      {label}{' '}
      <StarRating value={value} highlight={value === max} />
    </>
  )
  return (
    <p>
      {seg('3PT', s.three)} {seg('Mid', s.mid)} {seg('Paint', s.paint)}
    </p>
  )
}

function HomeScreen() {
  const { currentUser, signOut } = useAuth()
  const { startGame } = useGame()
  const { musicUrl1, musicMuted, musicVolume } = useSettings()
  const navigate = useNavigate()
  
  useEffect(() => {
    audioManager.setMusicMuted(!!musicMuted)
  }, [musicMuted])
  useEffect(() => {
    audioManager.setMusicVolume(musicVolume)
  }, [musicVolume])
  
  // Music: play track 1 on home, stop when leaving
  useEffect(() => {
    const url = (musicUrl1 || '').trim()
    if (url) audioManager.playMusic(url)
    return () => audioManager.stopMusic()
  }, [musicUrl1])

  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => navigate('/'), 100)
    }
  }, [currentUser, navigate])

  const [showModeSelect, setShowModeSelect] = useState(true) // Default to showing mode select
  const [showArchetypeSelect, setShowArchetypeSelect] = useState(false)
  const [showPlayer2ArchetypeSelect, setShowPlayer2ArchetypeSelect] = useState(false)
  const [showAIArchetypeSelect, setShowAIArchetypeSelect] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'local' | 'ai' | 'online' | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [player1Archetype, setPlayer1Archetype] = useState<Archetype | null>(null)
  const [_aiArchetype, setAiArchetype] = useState<Archetype | null>(null)
  const [flippedCard, setFlippedCard] = useState<string | null>(null) // Track which card is flipped
  const [pendingChallenge, setPendingChallenge] = useState<{ gameId: string; fromDisplayName: string } | null>(null)

  // Listen for friend challenges (show notification under Online card)
  useEffect(() => {
    if (!currentUser?.uid || currentUser?.isGuest) return
    return listenPendingGame(currentUser.uid, (data: PendingGamePayload | null) => {
      if (!data?.fromUid) {
        setPendingChallenge(null)
        return
      }
      setPendingChallenge({
        gameId: data.gameId,
        fromDisplayName: data.fromDisplayName || 'Someone'
      })
    })
  }, [currentUser?.uid, currentUser?.isGuest])

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

  async function handleSignOut() {
    if (!window.confirm('Are you sure?')) return
    await signOut()
    navigate('/')
  }

  return (
    <div className="screen home-screen">
      <div className="home-container">
        <header className="home-header">
          <div className="home-title-row">
            <div className="home-header-character">
              <PixelCharacter
                character={CHARACTERS.find(c => c.id === (currentUser?.selectedCharacter || 'rocket')) ?? CHARACTERS[0]}
                size={72}
                equippedCosmetics={currentUser?.equippedCosmetics ?? {}}
                hasBasketball={true}
              />
              <span className="username">{currentUser?.displayName}</span>
            </div>
            <h1 className="game-title">THREE DRIBBLES</h1>
          </div>
          <div className="header-controls">
            <div className="home-settings-stack">
                <button onClick={() => navigate('/settings')} className="btn-icon btn-header-text">
                  Settings
                </button>
                <button
                  onClick={currentUser?.isGuest ? () => navigate(-1) : handleSignOut}
                  className="btn-icon btn-header-text"
                >
                  {currentUser?.isGuest ? 'Back' : 'Sign Out'}
                </button>
            </div>
          </div>
        </header>

        {!showModeSelect && !showArchetypeSelect && !showPlayer2ArchetypeSelect && !showAIArchetypeSelect && (
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
                <p>Train against CPU</p>
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
                {pendingChallenge && <span className="challenge-badge">!</span>}
              </button>
            </div>
          </div>
        )}

        {showArchetypeSelect && (
          <div className="archetype-select">
            <div className="archetype-select-header">
              <button
                type="button"
                className="archetype-back-btn"
                onClick={() => { setShowArchetypeSelect(false); setShowModeSelect(true) }}
                aria-label="Back to mode select"
              >
                ←
              </button>
              <h2>{selectedMode === 'local' ? 'Player 1 - Choose Your Archetype' : 'Choose Your Archetype'}</h2>
            </div>
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
                    <ArchetypeStarsLine archetype="midrange" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Mid Range</h3>
                    <div className="archetype-description">
                      <p><strong>Balanced playstyle</strong> with strength in mid-range shots.</p>
                      <ul>
                        <li>🎯 <strong><StarRating value={4} /></strong> from mid-range</li>
                        <li>⚖️ <strong><StarRating value={3} /></strong> from 3-point and paint</li>
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
                    <ArchetypeStarsLine archetype="shooter" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Shooter</h3>
                    <div className="archetype-description">
                      <p><strong>Elite from long range</strong>, deadly from 3-point line.</p>
                      <ul>
                        <li>🌟 <strong><StarRating value={4} /></strong> from 3-point range</li>
                        <li>📊 <strong><StarRating value={3} /></strong> from mid-range</li>
                        <li>⚠️ <strong><StarRating value={1} /></strong> from paint (weak inside)</li>
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
                    <ArchetypeStarsLine archetype="defender" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Defender</h3>
                    <div className="archetype-description">
                      <p><strong>Dominant in the paint</strong> and reduces opponent's shots.</p>
                      <ul>
                        <li>🛡️ <strong><StarRating value={4} /></strong> from paint</li>
                        <li>📊 <strong><StarRating value={3} /></strong> from mid-range</li>
                        <li>⚠️ <strong><StarRating value={1} /></strong> from 3-point (weak outside)</li>
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
            <div className="archetype-select-header">
              <button
                type="button"
                className="archetype-back-btn"
                onClick={() => { setShowPlayer2ArchetypeSelect(false); setShowArchetypeSelect(true) }}
                aria-label="Back to Player 1 archetype"
              >
                ←
              </button>
              <h2>Player 2 - Choose Your Archetype</h2>
            </div>
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
                    <ArchetypeStarsLine archetype="midrange" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Mid Range</h3>
                    <div className="archetype-description">
                      <p><strong>Balanced playstyle</strong> with strength in mid-range shots.</p>
                      <ul>
                        <li>🎯 <strong><StarRating value={4} /></strong> from mid-range</li>
                        <li>⚖️ <strong><StarRating value={3} /></strong> from 3-point and paint</li>
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
                    <ArchetypeStarsLine archetype="shooter" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Shooter</h3>
                    <div className="archetype-description">
                      <p><strong>Elite from long range</strong>, deadly from 3-point line.</p>
                      <ul>
                        <li>🌟 <strong><StarRating value={4} /></strong> from 3-point range</li>
                        <li>📊 <strong><StarRating value={3} /></strong> from mid-range</li>
                        <li>⚠️ <strong><StarRating value={1} /></strong> from paint (weak inside)</li>
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
                    <ArchetypeStarsLine archetype="defender" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Defender</h3>
                    <div className="archetype-description">
                      <p><strong>Dominant in the paint</strong> and reduces opponent's shots.</p>
                      <ul>
                        <li>🛡️ <strong><StarRating value={4} /></strong> from paint</li>
                        <li>📊 <strong><StarRating value={3} /></strong> from mid-range</li>
                        <li>⚠️ <strong><StarRating value={1} /></strong> from 3-point (weak outside)</li>
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
            <div className="archetype-select-header">
              <button
                type="button"
                className="archetype-back-btn"
                onClick={() => { setShowAIArchetypeSelect(false); setShowModeSelect(true) }}
                aria-label="Back to mode select"
              >
                ←
              </button>
              <h2>Choose CPU Archetype</h2>
            </div>
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
                    <ArchetypeStarsLine archetype="midrange" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Mid Range</h3>
                    <div className="archetype-description">
                      <p><strong>Balanced playstyle</strong> with strength in mid-range shots.</p>
                      <ul>
                        <li>🎯 <strong><StarRating value={4} /></strong> from mid-range</li>
                        <li>⚖️ <strong><StarRating value={3} /></strong> from 3-point and paint</li>
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
                    <ArchetypeStarsLine archetype="shooter" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Shooter</h3>
                    <div className="archetype-description">
                      <p><strong>Elite from long range</strong>, deadly from 3-point line.</p>
                      <ul>
                        <li>🌟 <strong><StarRating value={4} /></strong> from 3-point range</li>
                        <li>📊 <strong><StarRating value={3} /></strong> from mid-range</li>
                        <li>⚠️ <strong><StarRating value={1} /></strong> from paint (weak inside)</li>
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
                    <ArchetypeStarsLine archetype="defender" />
                  </div>
                  <div className="archetype-card-back card archetype-card">
                    <h3>Defender</h3>
                    <div className="archetype-description">
                      <p><strong>Dominant in the paint</strong> and reduces opponent's shots.</p>
                      <ul>
                        <li>🛡️ <strong><StarRating value={4} /></strong> from paint</li>
                        <li>📊 <strong><StarRating value={3} /></strong> from mid-range</li>
                        <li>⚠️ <strong><StarRating value={1} /></strong> from 3-point (weak outside)</li>
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

