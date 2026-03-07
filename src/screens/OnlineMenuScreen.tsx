import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  addToMatchmakingQueue,
  removeFromMatchmakingQueue,
  listenMatchmakingQueue,
  listenPendingGame,
  clearPendingGameForUser,
  createGameDoc,
  setPendingGameForUser,
  getLeaderboard,
  type LeaderboardRow,
  type PendingGamePayload,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  removeFriend,
  lookupUserByDisplayName,
  canSendFriendRequest,
  type FriendDoc
} from '../firebase/online'
import { initializeGame } from '../game/GameEngine'
import { CHARACTERS } from '../types/Character'
import './OnlineMenuScreen.css'

type SortBy = 'rank' | 'wins' | 'winRate' | 'fgPercent' | 'threePtPercent'

function OnlineMenuScreen() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard' | 'friends'>('play')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('wins')

  // Quick Match
  const [quickMatchSearching, setQuickMatchSearching] = useState(false)
  const [quickMatchError, setQuickMatchError] = useState<string | null>(null)
  const queueUnsubRef = useRef<(() => void) | null>(null)
  const pendingUnsubRef = useRef<(() => void) | null>(null)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  // Friends
  const [friends, setFriends] = useState<FriendDoc[]>([])
  const [requests, setRequests] = useState<{ fromUid: string; fromDisplayName: string }[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsError, setFriendsError] = useState<string | null>(null)
  const [addFriendMessage, setAddFriendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [challengingFriendUid, setChallengingFriendUid] = useState<string | null>(null)
  const [pendingChallenge, setPendingChallenge] = useState<{
    gameId: string
    fromUid: string
    fromDisplayName: string
  } | null>(null)

  // Load leaderboard when tab is leaderboard
  useEffect(() => {
    if (activeTab !== 'leaderboard' || !currentUser) return
    setLeaderboardLoading(true)
    setLeaderboardError(null)
    getLeaderboard()
      .then((rows) => {
        setLeaderboard(rows)
      })
      .catch((e) => {
        setLeaderboardError(e?.message || 'Failed to load leaderboard')
        setLeaderboard([])
      })
      .finally(() => setLeaderboardLoading(false))
  }, [activeTab, currentUser])

  // Load friends and requests when tab is friends
  useEffect(() => {
    if (activeTab !== 'friends' || !currentUser) return
    setFriendsLoading(true)
    setFriendsError(null)
    Promise.all([getFriends(currentUser.uid), getFriendRequests(currentUser.uid)])
      .then(([friendList, requestList]) => {
        setFriends(friendList)
        setRequests(requestList)
      })
      .catch((e) => {
        setFriendsError(e?.message || 'Failed to load friends')
        setFriends([])
        setRequests([])
      })
      .finally(() => setFriendsLoading(false))
  }, [activeTab, currentUser])

  // Listen for pending games whenever on Online screen (Challenge from friend or Quick Match invite)
  useEffect(() => {
    if (!currentUser) return
    pendingUnsubRef.current = listenPendingGame(currentUser.uid, (data: PendingGamePayload | null) => {
      if (!data) {
        setPendingChallenge(null)
        return
      }
      if (data.fromUid) {
        setPendingChallenge({
          gameId: data.gameId,
          fromUid: data.fromUid,
          fromDisplayName: data.fromDisplayName || 'Someone'
        })
        return
      }
      setPendingChallenge(null)
      clearPendingGameForUser(currentUser.uid).catch(() => {})
      if (queueUnsubRef.current) {
        queueUnsubRef.current()
        queueUnsubRef.current = null
      }
      setQuickMatchSearching(false)
      navigate('/game', { state: { gameId: data.gameId, myRole: 'player2', waiting: true } })
    })
    return () => {
      if (pendingUnsubRef.current) {
        pendingUnsubRef.current()
        pendingUnsubRef.current = null
      }
    }
  }, [currentUser?.uid, navigate])

  // Quick Match: leave queue and clean listeners on unmount or when navigating
  useEffect(() => {
    return () => {
      if (queueUnsubRef.current) {
        queueUnsubRef.current()
        queueUnsubRef.current = null
      }
      if (pendingUnsubRef.current) {
        pendingUnsubRef.current()
        pendingUnsubRef.current = null
      }
      if (currentUser && quickMatchSearching) {
        removeFromMatchmakingQueue(currentUser.uid).catch(() => {})
      }
    }
  }, [currentUser?.uid])

  // When arriving from "Find New Opponent", start Quick Match search
  useEffect(() => {
    const state = location.state as { startQuickMatch?: boolean } | null
    if (!state?.startQuickMatch || !currentUser || quickMatchSearching) return
    navigate('/online', { replace: true })
    setActiveTab('play')
    handleQuickMatch()
  }, [location.state, currentUser, quickMatchSearching, navigate])

  function handleQuickMatch() {
    if (!currentUser || quickMatchSearching) return
    setQuickMatchError(null)
    setQuickMatchSearching(true)

    const uid = currentUser.uid
    const displayName = currentUser.displayName

    addToMatchmakingQueue(uid, displayName).then(() => {
      // Pending game is handled by the always-on listenPendingGame effect above
      // Listen to queue; when we have 2 and we're the older one, we create the game
      queueUnsubRef.current = listenMatchmakingQueue((entries) => {
        const withTimestamp = entries.filter((e) => e.createdAt != null)
        if (withTimestamp.length < 2) return

        const [first, second] = withTimestamp
        const amFirst = first.uid === uid
        const amSecond = second.uid === uid
        if (!amFirst && !amSecond) return

        if (amFirst) {
          // We are the creator
          if (queueUnsubRef.current) {
            queueUnsubRef.current()
            queueUnsubRef.current = null
          }
          setQuickMatchSearching(false)

          const gameId = `${first.uid}_${second.uid}_${Date.now()}`
          const player1Char = currentUser.selectedCharacter || 'rocket'
          const player2Char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id
          const player1 = {
            uid: first.uid,
            username: first.displayName,
            archetype: 'midrange' as const,
            score: 0,
            currentPosition: 3,
            characterId: player1Char,
            shotsMade: 0,
            shotsAttempted: 0,
            threesMade: 0,
            threesAttempted: 0,
            equippedCosmetics: currentUser.equippedCosmetics ?? {}
          }
          const player2 = {
            uid: second.uid,
            username: second.displayName,
            archetype: 'midrange' as const,
            score: 0,
            currentPosition: 8,
            characterId: player2Char,
            shotsMade: 0,
            shotsAttempted: 0,
            threesMade: 0,
            threesAttempted: 0
          }
          const initialState = initializeGame(player1, player2, 'online')
          createGameDoc(gameId, { ...initialState, gameSource: 'quickmatch' })
            .then(() => setPendingGameForUser(second.uid, gameId))
            .then(() => removeFromMatchmakingQueue(uid))
            .then(() => removeFromMatchmakingQueue(second.uid))
            .then(() => navigate('/game', { state: { gameId, myRole: 'player1', waiting: true } }))
            .catch((e) => {
              setQuickMatchError(e?.message || 'Failed to create game')
            })
        }
      })
    }).catch((e) => {
      setQuickMatchSearching(false)
      setQuickMatchError(e?.message || 'Failed to join queue')
    })
  }

  function handleAddFriend() {
    if (!currentUser) return
    const q = searchQuery.trim()
    setAddFriendMessage(null)
    if (!q) {
      setAddFriendMessage({ type: 'error', text: 'Enter a username to add.' })
      return
    }
    lookupUserByDisplayName(q)
      .then((user) => {
        if (!user) {
          setAddFriendMessage({ type: 'error', text: 'Player not found.' })
          return
        }
        if (user.uid === currentUser.uid) {
          setAddFriendMessage({ type: 'error', text: "You can't add yourself." })
          return
        }
        return canSendFriendRequest(currentUser.uid, user.uid).then((can) => {
          if (!can.ok) {
            setAddFriendMessage({ type: 'error', text: can.error })
            return
          }
          return sendFriendRequest(user.uid, currentUser.uid, currentUser.displayName).then(() => {
            setAddFriendMessage({ type: 'success', text: `Friend request sent to ${user.displayName}!` })
            setSearchQuery('')
            getFriendRequests(currentUser.uid).then(setRequests)
          })
        })
      })
      .catch((e) => setAddFriendMessage({ type: 'error', text: e?.message || 'Failed to send request.' }))
  }

  function handleAcceptRequest(fromUid: string, fromDisplayName: string) {
    if (!currentUser) return
    acceptFriendRequest(currentUser.uid, currentUser.displayName, fromUid, fromDisplayName)
      .then(() => {
        setRequests((prev) => prev.filter((r) => r.fromUid !== fromUid))
        setFriends((prev) => [...prev, { uid: fromUid, displayName: fromDisplayName }])
      })
      .catch((e) => setFriendsError(e?.message || 'Failed to accept'))
  }

  function handleDeclineRequest(fromUid: string) {
    if (!currentUser) return
    declineFriendRequest(currentUser.uid, fromUid)
      .then(() => setRequests((prev) => prev.filter((r) => r.fromUid !== fromUid)))
      .catch((e) => setFriendsError(e?.message || 'Failed to decline'))
  }

  function handleUnfriend(friendUid: string) {
    if (!currentUser) return
    removeFriend(currentUser.uid, friendUid)
      .then(() => setFriends((prev) => prev.filter((f) => f.uid !== friendUid)))
      .catch((e) => setFriendsError(e?.message || 'Failed to remove friend'))
  }

  function handleChallengeFriend(friendUid: string, friendDisplayName: string) {
    if (!currentUser || challengingFriendUid) return
    setChallengeError(null)
    setChallengingFriendUid(friendUid)
    const gameId = `${currentUser.uid}_${friendUid}_${Date.now()}`
    const player1Char = currentUser.selectedCharacter || 'rocket'
    const player2Char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id
    const player1 = {
      uid: currentUser.uid,
      username: currentUser.displayName,
      archetype: 'midrange' as const,
      score: 0,
      currentPosition: 3,
      characterId: player1Char,
      shotsMade: 0,
      shotsAttempted: 0,
      threesMade: 0,
      threesAttempted: 0,
      equippedCosmetics: currentUser.equippedCosmetics ?? {}
    }
    const player2 = {
      uid: friendUid,
      username: friendDisplayName,
      archetype: 'midrange' as const,
      score: 0,
      currentPosition: 8,
      characterId: player2Char,
      shotsMade: 0,
      shotsAttempted: 0,
      threesMade: 0,
      threesAttempted: 0
    }
    const initialState = initializeGame(player1, player2, 'online')
    createGameDoc(gameId, { ...initialState, gameSource: 'challenge' })
      .then(() => setPendingGameForUser(friendUid, gameId, currentUser.uid, currentUser.displayName))
      .then(() => navigate('/game', { state: { gameId, myRole: 'player1', waiting: true } }))
      .catch((e) => setChallengeError(e?.message || 'Failed to send challenge'))
      .finally(() => setChallengingFriendUid(null))
  }

  function handleAcceptChallenge(gameId: string) {
    if (!currentUser || !pendingChallenge) return
    clearPendingGameForUser(currentUser.uid)
      .then(() => {
        setPendingChallenge(null)
        navigate('/game', { state: { gameId, myRole: 'player2', waiting: true } })
      })
      .catch(() => setPendingChallenge(null))
  }

  function handleDeclineChallenge() {
    if (!currentUser || !pendingChallenge) return
    clearPendingGameForUser(currentUser.uid)
      .then(() => setPendingChallenge(null))
      .catch(() => setPendingChallenge(null))
  }

  function getSortedLeaderboard(): LeaderboardRow[] {
    const sorted = [...leaderboard]
    switch (sortBy) {
      case 'rank':
      case 'wins':
        return sorted.sort((a, b) => b.wins - a.wins)
      case 'winRate':
        return sorted.sort((a, b) => b.winRate - a.winRate)
      case 'fgPercent':
        return sorted.sort((a, b) => b.fgPercent - a.fgPercent)
      case 'threePtPercent':
        return sorted.sort((a, b) => b.threePtPercent - a.threePtPercent)
      default:
        return sorted.sort((a, b) => b.wins - a.wins)
    }
  }

  return (
    <div className="screen online-menu-screen">
      <div className="online-container">
        <header className="online-header">
          <button onClick={() => navigate('/home')} className="btn-back" aria-label="Back to home">
            ←
          </button>
          <h1>🌐 ONLINE MODE</h1>
          <span className="username">{currentUser?.displayName || 'Guest'}</span>
        </header>

        <div className="online-tabs">
          <button
            onClick={() => setActiveTab('play')}
            className={`tab-btn ${activeTab === 'play' ? 'active' : ''}`}
          >
            Play
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
          >
            Friends
          </button>
        </div>

        {pendingChallenge && (
          <div className="card pending-challenges-card">
            <h3>Pending challenges</h3>
            <div className="pending-challenge-row">
              <span className="pending-challenge-from">{pendingChallenge.fromDisplayName} challenged you</span>
              <div className="pending-challenge-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAcceptChallenge(pendingChallenge.gameId)}
                >
                  Accept
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleDeclineChallenge}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'play' && (
          <div className="play-section">
            {quickMatchError && <p className="online-error">{quickMatchError}</p>}
            <button
              onClick={handleQuickMatch}
              className="card online-card"
              disabled={quickMatchSearching}
            >
              <div className="card-icon">⚡</div>
              <h3>Quick Match</h3>
              <p>{quickMatchSearching ? 'Finding opponent...' : 'Find a random opponent'}</p>
            </button>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <div className="leaderboard-header">
              <h2>Top Players</h2>
              <div className="sort-controls">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="sort-select">
                  <option value="rank">Rank (by wins)</option>
                  <option value="wins">Wins</option>
                  <option value="winRate">Win %</option>
                  <option value="fgPercent">FG %</option>
                  <option value="threePtPercent">3PT %</option>
                </select>
              </div>
            </div>
            {leaderboardLoading && <p className="muted">Loading...</p>}
            {leaderboardError && <p className="online-error">{leaderboardError}</p>}
            {!leaderboardLoading && !leaderboardError && (
              <div className="leaderboard-table card">
                <div className="table-header">
                  <span className="col-rank">#</span>
                  <span className="col-name">Player</span>
                  <span className="col-stat">W-L</span>
                  <span className="col-stat">Win%</span>
                  <span className="col-stat">FG%</span>
                  <span className="col-stat">3PT%</span>
                </div>
                {getSortedLeaderboard().length === 0 ? (
                  <p className="muted" style={{ padding: '1rem' }}>No online players yet. Play a Quick Match to appear here!</p>
                ) : (
                  getSortedLeaderboard().map((player, index) => (
                    <div key={player.uid} className="table-row">
                      <span className="col-rank">{index + 1}</span>
                      <span className="col-name">{player.username}</span>
                      <span className="col-stat">{player.wins}-{player.losses}</span>
                      <span className="col-stat">{player.winRate}%</span>
                      <span className="col-stat">{player.fgPercent}%</span>
                      <span className="col-stat">{player.threePtPercent}%</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="friends-section">
            <div className="search-bar card">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddFriend()
                }}
                style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
              >
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Add Friend
                </button>
              </form>
            </div>
            {addFriendMessage && (
              <p className={addFriendMessage.type === 'error' ? 'online-error' : 'online-success'}>
                {addFriendMessage.text}
              </p>
            )}
            {challengeError && <p className="online-error">{challengeError}</p>}
            {friendsError && <p className="online-error">{friendsError}</p>}
            {friendsLoading && <p className="muted">Loading...</p>}
            {!friendsLoading && (
              <>
                <div className="requests-section card">
                  <h3>Friend Requests</h3>
                  {requests.length === 0 ? (
                    <p className="muted">No pending requests</p>
                  ) : (
                    <div className="requests-list">
                      {requests.map((r) => (
                        <div key={r.fromUid} className="request-row">
                          <span className="request-name">{r.fromDisplayName}</span>
                          <div className="request-actions">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAcceptRequest(r.fromUid, r.fromDisplayName)}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeclineRequest(r.fromUid)}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <h3>Your Friends</h3>
                <div className="friends-list">
                  {friends.length === 0 ? (
                    <p className="muted">No friends yet. Search for a username and send a request!</p>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.uid} className="card friend-card">
                        <div className="friend-info">
                          <div className="friend-name">{friend.displayName}</div>
                          <div className="friend-stats">Online stats after you play together</div>
                        </div>
                        <div className="friend-actions">
                          <button
                            onClick={() => handleChallengeFriend(friend.uid, friend.displayName)}
                            className="btn btn-secondary btn-sm"
                            disabled={challengingFriendUid === friend.uid}
                          >
                            {challengingFriendUid === friend.uid ? 'Sending...' : 'Challenge'}
                          </button>
                          <button
                            onClick={() => handleUnfriend(friend.uid)}
                            className="btn btn-danger btn-sm"
                          >
                            Unfriend
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OnlineMenuScreen
