import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings, COURT_THEME_DATA } from '../contexts/SettingsContext'
import { CHARACTERS } from '../types/Character'
import { COSMETIC_ITEMS, EquippedCosmetics, CosmeticCategory, getCosmeticById } from '../types/Cosmetics'
import { getUnlockInstruction, getCosmeticPrice, getAllUnlockableCosmeticIds, getCourtThemePrice } from '../game/Unlocks'
import { CourtThemeId } from '../types/CourtTheme'
import { PixelCharacter } from '../components/PixelCharacter'
import './SettingsScreen.css'

function SettingsScreen() {
  const navigate = useNavigate()
  const { currentUser, updateUserCharacter, updateUserCosmetics, updateUserUnlockedCosmetics, updateUserCoins, updateUsername, signOut, deleteAccount } = useAuth()
  const { courtTheme, setCourtTheme, unlockedThemes, unlockCourtTheme, soundMuted, setSoundMuted, volume, setVolume } = useSettings()
  
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState(false)
  
  const [selectedCharacter, setSelectedCharacter] = useState<string>(currentUser?.selectedCharacter || 'rocket')
  const [equippedCosmetics, setEquippedCosmetics] = useState<EquippedCosmetics>(currentUser?.equippedCosmetics || {})
  const [selectedShopItemId, setSelectedShopItemId] = useState<string | null>(null)
  const [shopPreviewOutfit, setShopPreviewOutfit] = useState<Partial<EquippedCosmetics>>({})
  const [previewOutfit, setPreviewOutfit] = useState<Partial<EquippedCosmetics>>({})
  const [selectedShopCategory, setSelectedShopCategory] = useState<string | null>(null)
  const [coinPurchaseModal, setCoinPurchaseModal] = useState<{ open: boolean; amount: number }>({ open: false, amount: 0 })
  const [confirmBuy, setConfirmBuy] = useState<{ name: string; emoji: string; price: number; onConfirm: () => void } | null>(null)
  const [activeTab, setActiveTab] = useState<'character' | 'cosmetics' | 'court' | 'stats' | 'shop' | 'faq' | 'system'>('character')
  
  const userUnlockedCosmetics = currentUser?.unlockedCosmetics || []
  
  useEffect(() => {
    if (currentUser) {
      setSelectedCharacter(currentUser.selectedCharacter || 'rocket')
      setEquippedCosmetics(currentUser.equippedCosmetics || {})
    }
  }, [currentUser])

  function handleCharacterSelect(characterId: string) {
    setSelectedCharacter(characterId)
    updateUserCharacter(characterId)
  }

  function toggleCosmeticPreview(itemId: string) {
    const item = getCosmeticById(itemId)
    if (!item) return
    setPreviewOutfit(prev => {
      const next = { ...prev }
      if (prev[item.category] === itemId) {
        delete next[item.category]
      } else {
        next[item.category] = itemId
      }
      return next
    })
  }

  function applyPreviewOutfit() {
    const merged = { ...equippedCosmetics, ...previewOutfit }
    setEquippedCosmetics(merged)
    updateUserCosmetics(merged)
    setPreviewOutfit({})
  }

  function toggleShopPreview(itemId: string) {
    const item = getCosmeticById(itemId)
    if (!item) return
    setShopPreviewOutfit(prev => {
      const next = { ...prev }
      if (prev[item.category] === itemId) {
        delete next[item.category]
      } else {
        next[item.category] = itemId
      }
      return next
    })
    setSelectedShopItemId(itemId)
  }

  function clearShopPreview() {
    setShopPreviewOutfit({})
    setSelectedShopItemId(null)
  }

  const currentCharacter = CHARACTERS.find(c => c.id === selectedCharacter) || CHARACTERS[0]

  // Cosmetics tab: only items the user has unlocked (default-unlocked or purchased)
  const groupedCosmetics = {
    balls: COSMETIC_ITEMS.filter(item => item.category === 'balls' && (!item.locked || userUnlockedCosmetics.includes(item.id))),
    headwear: COSMETIC_ITEMS.filter(item => item.category === 'headwear' && (!item.locked || userUnlockedCosmetics.includes(item.id))),
    uniform: COSMETIC_ITEMS.filter(item => item.category === 'jersey_style' && (!item.locked || userUnlockedCosmetics.includes(item.id))),
    armwear: COSMETIC_ITEMS.filter(item => item.category === 'arm_items' && (!item.locked || userUnlockedCosmetics.includes(item.id))),
    socks: COSMETIC_ITEMS.filter(item => item.category === 'socks' && (!item.locked || userUnlockedCosmetics.includes(item.id))),
    footwear: COSMETIC_ITEMS.filter(item => item.category === 'footwear' && (!item.locked || userUnlockedCosmetics.includes(item.id))),
    jewelry: COSMETIC_ITEMS.filter(item => item.category === 'jewelry' && (!item.locked || userUnlockedCosmetics.includes(item.id))),
    eyewear: COSMETIC_ITEMS.filter(item => item.category === 'eyewear' && (!item.locked || userUnlockedCosmetics.includes(item.id)))
  }

  // Shop: all purchasable (lockable) items, grouped by category; court themes listed separately
  const purchasableIds = getAllUnlockableCosmeticIds()
  type CourtShopEntry = { id: string; name: string; emoji: string }
  type ShopItem = import('../types/Cosmetics').CosmeticItem | CourtShopEntry
  const shopItemsByCategory = (() => {
    const categoryKeys = ['balls', 'headwear', 'uniform', 'armwear', 'socks', 'footwear', 'jewelry', 'eyewear', 'court'] as const
    const map: Record<string, ShopItem[]> = {}
    categoryKeys.forEach(k => { map[k] = [] })
    purchasableIds.forEach(id => {
      const item = getCosmeticById(id)
      if (!item || getCosmeticPrice(id) <= 0) return
      const displayCat = item.category === 'jersey_style' ? 'uniform' : item.category === 'arm_items' ? 'armwear' : item.category
      if (map[displayCat]) map[displayCat].push(item)
    })
    const courtEntries: CourtShopEntry[] = Object.entries(COURT_THEME_DATA)
      .filter(([id]) => getCourtThemePrice(id) > 0)
      .map(([id, data]) => ({ id, name: data.name, emoji: data.emoji }))
    map.court = courtEntries
    return map
  })()

  const SHOP_CATEGORY_EMOJI: Record<string, string> = {
    balls: '🏀',
    headwear: '🎽',
    uniform: '👕',
    armwear: '💪',
    socks: '🧦',
    footwear: '👟',
    jewelry: '📿',
    eyewear: '🕶️',
    court: '🏟️'
  }

  function getShopCategoryLabel(cat: string): string {
    return cat === 'jewelry' ? 'Jewelry' : cat === 'eyewear' ? 'Eyewear' : cat === 'court' ? 'Court' : cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
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
            <span className="coins-display" title="Coins (win Practice: Easy 1, Medium 3, Hard 5)">
              🪙 {currentUser?.coins ?? 0}
            </span>
            <span className="username">{currentUser?.displayName || 'Guest'}</span>
            <button
              type="button"
              onClick={() => setCoinPurchaseModal({ open: true, amount: 100 })}
              className="btn-unlock"
            >
              🪙 Buy Coins
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
            onClick={() => setActiveTab('faq')}
            className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          >
            FAQ
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
          <div className="settings-section cosmetics-section">
            <div className="cosmetics-content">
              <div className="cosmetics-main">
                <div className="cosmetics-preview">
                  <h2>Live Preview</h2>
                  <div className="character-preview card">
                    <PixelCharacter 
                      character={currentCharacter} 
                      size={120}
                      equippedCosmetics={{ ...equippedCosmetics, ...previewOutfit }}
                      hasBasketball={true}
                    />
                  </div>
                  {(Object.keys(previewOutfit).length > 0) && (
                    <div className="preview-actions">
                      <button type="button" className="btn-preview-action" onClick={applyPreviewOutfit}>
                        Wear this outfit
                      </button>
                      <button type="button" className="btn-preview-action btn-clear-preview" onClick={() => setPreviewOutfit({})}>
                        Clear preview
                      </button>
                    </div>
                  )}
                </div>

                {Object.entries(groupedCosmetics).map(([category, items]) => (
                  items.length > 0 && (
                    <div key={category} className="cosmetic-category">
                      <h3>
                        {category === 'jewelry' ? 'JEWELRY' : 
                         category === 'eyewear' ? 'EYEWEAR' : 
                         category.replace('_', ' ').toUpperCase()}
                      </h3>
                      <div className="cosmetic-grid">
                        {items.map(item => {
                          const isEquipped = equippedCosmetics[item.category as CosmeticCategory] === item.id
                          const isInPreview = previewOutfit[item.category as CosmeticCategory] === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleCosmeticPreview(item.id)}
                              className={`card cosmetic-card ${isEquipped ? 'equipped' : ''} ${isInPreview ? 'in-preview' : ''}`}
                            >
                              <div className="cosmetic-emoji">{item.emoji}</div>
                              <div className="cosmetic-name">{item.name}</div>
                              {isEquipped && <div className="equipped-badge">✓</div>}
                              {isInPreview && !isEquipped && <div className="preview-badge">Try</div>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'court' && (
          <div className="settings-section">
            <h2>Court Theme</h2>
            <div className="theme-grid">
              {Object.entries(COURT_THEME_DATA)
                .filter(([id]) => unlockedThemes.includes(id as CourtThemeId))
                .map(([id, data]) => (
                  <button
                    key={id}
                    onClick={() => setCourtTheme(id as CourtThemeId)}
                    className={`card theme-card ${courtTheme === id ? 'selected' : ''}`}
                  >
                    <div className="theme-emoji">{data.emoji}</div>
                    <div className="theme-name">{data.name}</div>
                    {courtTheme === id && <div className="selected-badge">✓</div>}
                  </button>
                ))}
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
          <div className="settings-section shop-section">
            <h2>Shop</h2>
            <p className="shop-description">Purchase cosmetics with coins. Win Practice games to earn more!</p>

            <div className="cosmetics-content">
              <div className="shop-main">
                <div className="cosmetics-preview shop-preview">
                  <h2>Live Preview</h2>
                  <div className="character-preview card">
                    <PixelCharacter 
                      character={currentCharacter} 
                      size={120}
                      equippedCosmetics={{ ...equippedCosmetics, ...shopPreviewOutfit }}
                      hasBasketball={true}
                    />
                  </div>
                  {(Object.keys(shopPreviewOutfit).length > 0 || selectedShopItemId) && (
                    <button
                      type="button"
                      className="btn-close-unlock"
                      onClick={clearShopPreview}
                      aria-label="Clear preview"
                    >
                      ✕ Clear preview
                    </button>
                  )}
                </div>

                <div className="shop-category-tabs">
                  <span className="shop-tabs-label">Browse:</span>
                  {Object.entries(shopItemsByCategory)
                    .filter(([, items]) => items.length > 0)
                    .map(([category]) => {
                      const isActive = selectedShopCategory === category
                      return (
                        <button
                          key={category}
                          type="button"
                          className={`shop-category-tab ${isActive ? 'active' : ''}`}
                          onClick={() => setSelectedShopCategory(isActive ? null : category)}
                          title={getShopCategoryLabel(category)}
                        >
                          <span className="shop-tab-emoji">{SHOP_CATEGORY_EMOJI[category] ?? '📦'}</span>
                          <span className="shop-tab-label">{getShopCategoryLabel(category)}</span>
                        </button>
                      )
                    })}
                </div>
                {selectedShopCategory && shopItemsByCategory[selectedShopCategory]?.length > 0 && (
                  <div className="shop-category-dropdown card">
                    <div className="cosmetic-grid shop-grid">
                      {selectedShopCategory === 'court'
                        ? shopItemsByCategory.court.map(entry => {
                            const price = getCourtThemePrice(entry.id)
                            const owned = unlockedThemes.includes(entry.id as CourtThemeId)
                            const coins = currentUser?.coins ?? 0
                            const canBuy = !owned && price > 0 && coins >= price
                            const selected = selectedShopItemId === entry.id
                            return (
                              <div
                                key={entry.id}
                                className={`card cosmetic-card shop-card ${selected ? 'selected-locked' : ''} ${owned ? 'owned' : ''}`}
                              >
                                <button
                                  type="button"
                                  className="cosmetic-preview-btn"
                                  onClick={() => setSelectedShopItemId(entry.id)}
                                >
                                  <div className="cosmetic-emoji">{entry.emoji}</div>
                                  <div className="cosmetic-name">{entry.name}</div>
                                </button>
                                <div className="shop-card-meta">
                                  <span className="shop-price">🪙 {price}</span>
                                  {owned ? (
                                    <span className="shop-owned">Owned</span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-buy"
                                      disabled={!canBuy}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (!canBuy) return
                                        setConfirmBuy({
                                          name: entry.name,
                                          emoji: entry.emoji,
                                          price,
                                          onConfirm: () => {
                                            updateUserCoins(-price)
                                            unlockCourtTheme(entry.id as CourtThemeId)
                                            setSelectedShopItemId(null)
                                          }
                                        })
                                      }}
                                    >
                                      Buy
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        : shopItemsByCategory[selectedShopCategory].map(item => {
                            const cosmeticItem = getCosmeticById(item.id)
                            const price = cosmeticItem ? getCosmeticPrice(item.id) : 0
                            const owned = userUnlockedCosmetics.includes(item.id)
                            const coins = currentUser?.coins ?? 0
                            const canBuy = !owned && price > 0 && coins >= price
                            const selected = selectedShopItemId === item.id
                            const inPreview = cosmeticItem && shopPreviewOutfit[cosmeticItem.category] === item.id
                            return (
                              <div
                                key={item.id}
                                className={`card cosmetic-card shop-card ${selected ? 'selected-locked' : ''} ${owned ? 'owned' : ''} ${inPreview ? 'in-preview' : ''}`}
                              >
                                <button
                                  type="button"
                                  className="cosmetic-preview-btn"
                                  onClick={() => cosmeticItem && toggleShopPreview(item.id)}
                                >
                                  <div className="cosmetic-emoji">{item.emoji}</div>
                                  <div className="cosmetic-name">{item.name}</div>
                                </button>
                                <div className="shop-card-meta">
                                  <span className="shop-price">🪙 {price}</span>
                                  {owned ? (
                                    <span className="shop-owned">Owned</span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-buy"
                                      disabled={!canBuy}
                                      onClick={() => {
                                        if (!canBuy) return
                                        setConfirmBuy({
                                          name: item.name,
                                          emoji: item.emoji,
                                          price,
                                          onConfirm: () => {
                                            updateUserCoins(-price)
                                            updateUserUnlockedCosmetics([item.id])
                                            if (cosmeticItem) {
                                              setShopPreviewOutfit(prev => {
                                                const next = { ...prev }
                                                delete next[cosmeticItem.category]
                                                return next
                                              })
                                            }
                                            setSelectedShopItemId(null)
                                          }
                                        })
                                      }}
                                    >
                                      Buy
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                    </div>
                  </div>
                )}
              </div>

              {selectedShopItemId && (
                <aside className="unlock-instructions-panel card">
                  {(() => {
                    const item = getCosmeticById(selectedShopItemId)
                    const courtData = COURT_THEME_DATA[selectedShopItemId as CourtThemeId]
                    if (courtData) {
                      const price = getCourtThemePrice(selectedShopItemId)
                      const coins = currentUser?.coins ?? 0
                      const owned = unlockedThemes.includes(selectedShopItemId as CourtThemeId)
                      const canBuy = !owned && price > 0 && coins >= price
                      return (
                        <>
                          <div className="unlock-panel-header">
                            <h4>Court details</h4>
                            <button
                              type="button"
                              className="btn-close-unlock"
                              onClick={() => setSelectedShopItemId(null)}
                              aria-label="Close"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="unlock-panel-item">
                            <span className="unlock-panel-emoji">{courtData.emoji}</span>
                            <span className="unlock-panel-name">{courtData.name}</span>
                          </div>
                          <p className="unlock-panel-instruction">Purchase to unlock this court.</p>
                          <div className="unlock-panel-purchase">
                            <span className="unlock-panel-price">🪙 {price} coins</span>
                            {owned ? (
                              <span className="shop-owned">You own this</span>
                            ) : (
                              <button
                                type="button"
                                className="btn-buy"
                                disabled={!canBuy}
                                onClick={() => {
                                  if (!canBuy) return
                                  setConfirmBuy({
                                    name: courtData.name,
                                    emoji: courtData.emoji,
                                    price,
                                    onConfirm: () => {
                                      updateUserCoins(-price)
                                      unlockCourtTheme(selectedShopItemId as CourtThemeId)
                                      setSelectedShopItemId(null)
                                    }
                                  })
                                }}
                              >
                                Buy
                              </button>
                            )}
                          </div>
                        </>
                      )
                    }
                    const price = getCosmeticPrice(selectedShopItemId)
                    const coins = currentUser?.coins ?? 0
                    const owned = userUnlockedCosmetics.includes(selectedShopItemId)
                    const canBuy = !owned && price > 0 && coins >= price
                    return (
                      <>
                        <div className="unlock-panel-header">
                          <h4>Item details</h4>
                          <button
                            type="button"
                            className="btn-close-unlock"
                            onClick={() => setSelectedShopItemId(null)}
                            aria-label="Close"
                          >
                            ✕
                          </button>
                        </div>
                        {item && (
                          <>
                            <div className="unlock-panel-item">
                              <span className="unlock-panel-emoji">{item.emoji}</span>
                              <span className="unlock-panel-name">{item.name}</span>
                            </div>
                            <p className="unlock-panel-instruction">
                              {getUnlockInstruction(selectedShopItemId)}
                            </p>
                            <div className="unlock-panel-purchase">
                              <span className="unlock-panel-price">🪙 {price} coins</span>
                              {owned ? (
                                <span className="shop-owned">You own this</span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-buy"
                                  disabled={!canBuy}
                                  onClick={() => {
                                    if (!canBuy) return
                                    setConfirmBuy({
                                      name: item.name,
                                      emoji: item.emoji,
                                      price,
                                      onConfirm: () => {
                                        updateUserCoins(-price)
                                        updateUserUnlockedCosmetics([selectedShopItemId])
                                        if (item) {
                                          setShopPreviewOutfit(prev => {
                                            const next = { ...prev }
                                            delete next[item.category]
                                            return next
                                          })
                                        }
                                        setSelectedShopItemId(null)
                                      }
                                    })
                                  }}
                                >
                                  Buy
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )
                  })()}
                </aside>
              )}
            </div>

            <div className="buy-coins-section card">
              <h3>Buy Coins</h3>
              <p className="buy-coins-description">Get more coins to unlock cosmetics. Secure payment (Stripe) coming soon.</p>
              <div className="coin-packages">
                <button
                  type="button"
                  className="card coin-package-btn"
                  onClick={() => setCoinPurchaseModal({ open: true, amount: 10 })}
                >
                  <span className="coin-package-emoji">🪙</span>
                  <span className="coin-package-amount">10</span>
                  <span className="coin-package-label">coins</span>
                </button>
                <button
                  type="button"
                  className="card coin-package-btn"
                  onClick={() => setCoinPurchaseModal({ open: true, amount: 100 })}
                >
                  <span className="coin-package-emoji">🪙</span>
                  <span className="coin-package-amount">100</span>
                  <span className="coin-package-label">coins</span>
                </button>
                <button
                  type="button"
                  className="card coin-package-btn"
                  onClick={() => setCoinPurchaseModal({ open: true, amount: 1000 })}
                >
                  <span className="coin-package-emoji">🪙</span>
                  <span className="coin-package-amount">1000</span>
                  <span className="coin-package-label">coins</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {coinPurchaseModal.open && (
          <div className="modal-overlay" onClick={() => setCoinPurchaseModal({ open: false, amount: 0 })}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Buy {coinPurchaseModal.amount} coins</h3>
                <button
                  type="button"
                  className="btn-close-unlock"
                  onClick={() => setCoinPurchaseModal({ open: false, amount: 0 })}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p className="modal-body">
                Secure payment with Stripe will be available soon. You selected the <strong>{coinPurchaseModal.amount} coins</strong> package.
              </p>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCoinPurchaseModal({ open: false, amount: 0 })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmBuy && (
          <div className="modal-overlay" onClick={() => setConfirmBuy(null)}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm purchase</h3>
                <button
                  type="button"
                  className="btn-close-unlock"
                  onClick={() => setConfirmBuy(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p className="modal-body">
                Buy {confirmBuy.emoji} <strong>{confirmBuy.name}</strong> for 🪙 {confirmBuy.price} coins?
              </p>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    confirmBuy.onConfirm()
                    setConfirmBuy(null)
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setConfirmBuy(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="settings-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              <div className="faq-item card">
                <h3 className="faq-question">How do I play?</h3>
                <div className="faq-answer faq-how-to-play">
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
                  <h4>Archetypes</h4>
                  <ul>
                    <li>Mid Range: Balanced, strong in mid-range.</li>
                    <li>Shooter: Best from 3-point range.</li>
                    <li>Defender: Strong in the paint, reduces opponent's shot percentage.</li>
                  </ul>
                </div>
              </div>
              <div className="faq-item card">
                <h3 className="faq-question">How do I earn coins?</h3>
                <p className="faq-answer">Win Practice games to earn coins: Easy gives 1 coin, Medium gives 3, and Hard gives 5 per win. Use coins in the Shop to buy cosmetics and court themes.</p>
              </div>
              <div className="faq-item card">
                <h3 className="faq-question">How do I change my character or outfit?</h3>
                <p className="faq-answer">Go to the Character tab to pick your player, and the Cosmetics tab to equip items you own. Use the Shop to buy new items with coins.</p>
              </div>
              <div className="faq-item card">
                <h3 className="faq-question">What are the game modes?</h3>
                <p className="faq-answer">Local Multiplayer lets two people play on the same device. Practice mode pits you against AI (Easy, Medium, or Hard). Online mode is for playing against others worldwide.</p>
              </div>
              <div className="faq-item card">
                <h3 className="faq-question">How do I win a game?</h3>
                <p className="faq-answer">Score 11 or more points and lead by at least 2. If the score reaches 30, the next basket wins (sudden death).</p>
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
              <p className="setting-description">Letters and numbers only, 1–12 characters.</p>
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
                    maxLength={12}
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
                  
                  try {
                    if (currentUser && !currentUser.isGuest) {
                      const password = window.prompt('Enter your password to confirm account deletion')
                      if (password == null) return
                      await deleteAccount(password)
                      alert('Account deleted. You can sign up again anytime.')
                      navigate('/')
                    } else {
                      localStorage.removeItem('guestUser')
                      localStorage.removeItem('localUsernames')
                      await signOut()
                      alert('Guest account deleted. Redirecting to login...')
                      navigate('/')
                    }
                  } catch (err: any) {
                    console.error('Error deleting account:', err)
                    alert(err?.message || 'Failed to delete account. Please try again.')
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
