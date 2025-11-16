import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings, COURT_THEME_DATA } from '../contexts/SettingsContext'
import { CHARACTERS } from '../types/Character'
import { COSMETIC_ITEMS, EquippedCosmetics, CosmeticCategory, getCosmeticById } from '../types/Cosmetics'
import { CourtThemeId } from '../types/CourtTheme'
import { PixelCharacter } from '../components/PixelCharacter'
import './SettingsScreen.css'

function SettingsScreen() {
  const navigate = useNavigate()
  const { currentUser, updateUserCharacter, updateUserCosmetics, updateUsername, checkUsernameAvailable, signOut } = useAuth()
  const { courtTheme, setCourtTheme, unlockedThemes, unlockAllThemes, soundMuted, setSoundMuted, volume, setVolume } = useSettings()
  
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState(false)
  
  const [selectedCharacter, setSelectedCharacter] = useState<string>(currentUser?.selectedCharacter || 'rocket')
  const [equippedCosmetics, setEquippedCosmetics] = useState<EquippedCosmetics>(currentUser?.equippedCosmetics || {})
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'character' | 'cosmetics' | 'court' | 'stats' | 'shop' | 'system'>('character')
  
  useEffect(() => {
    if (currentUser) {
      setSelectedCharacter(currentUser.selectedCharacter || 'rocket')
      setEquippedCosmetics(currentUser.equippedCosmetics || {})
    }
  }, [currentUser])

  function handleUnlockAll() {
    // Unlock all cosmetics
    const allCosmeticIds = COSMETIC_ITEMS.map(item => item.id)
    setUnlockedCosmetics(allCosmeticIds)
    
    // Unlock all court themes
    unlockAllThemes()
  }

  function handleCharacterSelect(characterId: string) {
    setSelectedCharacter(characterId)
    updateUserCharacter(characterId)
  }

  function handleCosmeticToggle(itemId: string) {
    const item = getCosmeticById(itemId)
    if (!item) return

    const newEquipped = { ...equippedCosmetics }
    
    // If already equipped, unequip
    if (newEquipped[item.category] === itemId) {
      delete newEquipped[item.category]
    } else {
      // Equip new item
      newEquipped[item.category] = itemId
    }
    
    setEquippedCosmetics(newEquipped)
    updateUserCosmetics(newEquipped)
  }

  const currentCharacter = CHARACTERS.find(c => c.id === selectedCharacter) || CHARACTERS[0]
  
  const groupedCosmetics = {
    balls: COSMETIC_ITEMS.filter(item => item.category === 'balls'),
    headwear: COSMETIC_ITEMS.filter(item => item.category === 'headwear'),
    uniform: COSMETIC_ITEMS.filter(item => item.category === 'jersey_style'),
    armwear: COSMETIC_ITEMS.filter(item => item.category === 'arm_items'),
    socks: COSMETIC_ITEMS.filter(item => item.category === 'socks'),
    footwear: COSMETIC_ITEMS.filter(item => item.category === 'footwear'),
    jewelry: COSMETIC_ITEMS.filter(item => item.category === 'jewelry'),
    eyewear: COSMETIC_ITEMS.filter(item => item.category === 'eyewear')
  }

  function getModeLabel(modeKey: string): string {
    switch (modeKey) {
      case 'local': return 'Local Multiplayer'
      case 'practice_easy': return 'Practice (Easy)'
      case 'practice_medium': return 'Practice (Medium)'
      case 'practice_hard': return 'Practice (Hard)'
      case 'online': return 'Online'
      default: return modeKey
    }
  }

  function calculatePercentage(made: number, attempted: number): string {
    if (attempted === 0) return '0%'
    return `${Math.round((made / attempted) * 100)}%`
  }

  return (
    <div className="screen settings-screen">
      <div className="settings-container">
        <header className="settings-header">
          <button onClick={() => navigate('/home')} className="btn-back">
            ← Back
          </button>
          <h1>⚙️ SETTINGS</h1>
          <div className="header-right">
            <span className="username">{currentUser?.displayName || 'Guest'}</span>
            <button onClick={handleUnlockAll} className="btn-unlock">
              🔓 Unlock All
            </button>
          </div>
        </header>

        <div className="settings-tabs">
          <button 
            onClick={() => setActiveTab('character')}
            className={`tab-btn ${activeTab === 'character' ? 'active' : ''}`}
          >
            Character
          </button>
          <button 
            onClick={() => setActiveTab('cosmetics')}
            className={`tab-btn ${activeTab === 'cosmetics' ? 'active' : ''}`}
          >
            Cosmetics
          </button>
          <button 
            onClick={() => setActiveTab('court')}
            className={`tab-btn ${activeTab === 'court' ? 'active' : ''}`}
          >
            Court
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          >
            Stats
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
          >
            Shop
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          >
            System
          </button>
        </div>

        {activeTab === 'character' && (
          <div className="settings-section">
            <div className="character-preview-section">
              <h2>Your Character</h2>
              <div className="character-preview card">
                <PixelCharacter 
                  character={currentCharacter} 
                  size={120}
                  equippedCosmetics={equippedCosmetics}
                  hasBasketball={true}
                />
                <div className="character-name">{currentCharacter.name}</div>
              </div>
            </div>
            
            <h2>Select Character</h2>
            <div className="character-grid">
              {CHARACTERS.map(character => (
                <button
                  key={character.id}
                  onClick={() => handleCharacterSelect(character.id)}
                  className={`card character-card ${selectedCharacter === character.id ? 'selected' : ''}`}
                >
                  <PixelCharacter character={character} size={60} />
                  <div className="character-card-name">{character.name}</div>
                  {selectedCharacter === character.id && <div className="selected-badge">✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cosmetics' && (
          <div className="settings-section">
            <div className="cosmetics-preview">
              <h2>Live Preview</h2>
              <div className="character-preview card">
                <PixelCharacter 
                  character={currentCharacter} 
                  size={120}
                  equippedCosmetics={equippedCosmetics}
                  hasBasketball={true}
                />
              </div>
            </div>

            {Object.entries(groupedCosmetics).map(([category, items]) => (
              <div key={category} className="cosmetic-category">
                <h3>
                  {category === 'jewelry' ? 'JEWELRY' : 
                   category === 'eyewear' ? 'EYEWEAR' : 
                   category.replace('_', ' ').toUpperCase()}
                </h3>
                <div className="cosmetic-grid">
                  {items.map(item => {
                    const isLocked = item.locked && !unlockedCosmetics.includes(item.id)
                    const isEquipped = equippedCosmetics[item.category as CosmeticCategory] === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => !isLocked && handleCosmeticToggle(item.id)}
                        className={`card cosmetic-card ${isEquipped ? 'equipped' : ''} ${isLocked ? 'locked' : ''}`}
                        disabled={isLocked}
                      >
                        <div className="cosmetic-emoji">{item.emoji}</div>
                        <div className="cosmetic-name">{item.name}</div>
                        {isEquipped && <div className="equipped-badge">✓</div>}
                        {isLocked && <div className="lock-icon">🔒</div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'court' && (
          <div className="settings-section">
            <h2>Court Theme</h2>
            <div className="theme-grid">
              {Object.entries(COURT_THEME_DATA).map(([id, data]) => {
                const themeData = data as any
                const isLocked = themeData.locked && !unlockedThemes.includes(id as any)
                return (
                  <button
                    key={id}
                    onClick={() => !isLocked && setCourtTheme(id as any)}
                    className={`card theme-card ${courtTheme === id ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                    disabled={isLocked}
                  >
                    <div className="theme-emoji">{data.emoji}</div>
                    <div className="theme-name">{data.name}</div>
                    {courtTheme === id && <div className="selected-badge">✓</div>}
                    {isLocked && <div className="lock-icon">🔒</div>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="settings-section">
            <h2>Your Statistics</h2>
            <div className="stats-overview card">
              <div className="stat-item">
                <div className="stat-label">Total Games</div>
                <div className="stat-value">{currentUser?.stats.totalGames || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Wins</div>
                <div className="stat-value">{currentUser?.stats.wins || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Losses</div>
                <div className="stat-value">{currentUser?.stats.losses || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Win Rate</div>
                <div className="stat-value">
                  {currentUser?.stats.totalGames 
                    ? Math.round((currentUser.stats.wins / currentUser.stats.totalGames) * 100)
                    : 0}%
                </div>
              </div>
            </div>

            <h3>Stats by Mode</h3>
            {['local', 'practice_easy', 'practice_medium', 'practice_hard', 'online'].map(modeKey => {
              const modeStats = currentUser?.stats[modeKey as keyof typeof currentUser.stats] as any
              if (!modeStats || typeof modeStats === 'string' || typeof modeStats === 'number' || !modeStats.totalGames || modeStats.totalGames === 0) {
                return null
              }

              return (
                <div key={modeKey} className="mode-stats card">
                  <h4>{getModeLabel(modeKey)}</h4>
                  <div className="mode-stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Games</div>
                      <div className="stat-value">{modeStats.totalGames}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">W-L</div>
                      <div className="stat-value">{modeStats.wins}-{modeStats.losses}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Win %</div>
                      <div className="stat-value">
                        {Math.round((modeStats.wins / modeStats.totalGames) * 100)}%
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">FG%</div>
                      <div className="stat-value">
                        {calculatePercentage(modeStats.shotsMade, modeStats.shotsAttempted)}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">3PT%</div>
                      <div className="stat-value">
                        {calculatePercentage(modeStats.threesMade, modeStats.threesAttempted)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="settings-section">
            <h2>Shop</h2>
            <p className="shop-description">Purchase new cosmetics and items to customize your character!</p>
            
            <div className="shop-categories">
              <div className="shop-category card">
                <h3>Coming Soon</h3>
                <p>New cosmetics and items will be available here soon!</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="settings-section">
            <h2>System Settings</h2>
            
            <div className="system-setting card">
              <h3>Audio</h3>
              <div className="setting-control">
                <label>
                  <input
                    type="checkbox"
                    checked={soundMuted}
                    onChange={(e) => setSoundMuted(e.target.checked)}
                  />
                  <span>Mute Sound</span>
                </label>
              </div>
              <div className="setting-control">
                <label htmlFor="volume-slider">Volume: {(Math.round(volume * 100))}%</label>
                <input
                  id="volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="volume-slider"
                />
              </div>
            </div>

            <div className="system-setting card">
              <h3>Username</h3>
              <p className="setting-description">Change your display name (max 10 characters)</p>
              <div className="username-change">
                <div className="current-username">
                  Current: <strong>{currentUser?.displayName || 'Guest'}</strong>
                </div>
                <div className="username-input-group">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value)
                      setUsernameError('')
                      setUsernameSuccess(false)
                    }}
                    placeholder="Enter new username"
                    maxLength={10}
                    className="username-input"
                  />
                  <button
                    onClick={async () => {
                      if (!newUsername.trim()) {
                        setUsernameError('Username cannot be empty')
                        return
                      }
                      
                      const result = await updateUsername(newUsername.trim())
                      if (result.success) {
                        setUsernameSuccess(true)
                        setUsernameError('')
                        setNewUsername('')
                        setTimeout(() => setUsernameSuccess(false), 3000)
                      } else {
                        setUsernameError(result.error || 'Failed to update username')
                        setUsernameSuccess(false)
                      }
                    }}
                    className="btn btn-primary"
                    disabled={!newUsername.trim() || newUsername.trim() === currentUser?.displayName}
                  >
                    Change
                  </button>
                </div>
                {usernameError && (
                  <div className="username-error">{usernameError}</div>
                )}
                {usernameSuccess && (
                  <div className="username-success">Username updated successfully!</div>
                )}
              </div>
            </div>

            <div className="system-setting card danger-zone">
              <h3>Danger Zone</h3>
              <p className="setting-description">Permanently delete your account and all data</p>
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your stats, cosmetics, and progress.')) {
                    return
                  }
                  
                  if (!confirm('This is your last chance. Are you absolutely sure?')) {
                    return
                  }
                  
                  // Delete account logic
                  try {
                    // If Firebase is available, delete from Firestore
                    if (currentUser && !currentUser.isGuest) {
                      // TODO: Implement Firebase account deletion
                      // For now, sign out and clear data
                      await signOut()
                      alert('Account signed out. Full deletion will be implemented with Firebase integration.')
                      navigate('/')
                    } else {
                      // For guest users, clear localStorage and sign out
                      localStorage.removeItem('guestUser')
                      localStorage.removeItem('localUsernames')
                      await signOut()
                      alert('Guest account deleted. Redirecting to login...')
                      navigate('/')
                    }
                  } catch (error) {
                    console.error('Error deleting account:', error)
                    alert('Failed to delete account. Please try again.')
                  }
                }}
                className="btn btn-danger"
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsScreen
