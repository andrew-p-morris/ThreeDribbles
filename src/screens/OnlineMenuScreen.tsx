import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './OnlineMenuScreen.css'

// Mock data for testing
const MOCK_LEADERBOARD = [
  { rank: 1, username: 'HoopMaster', wins: 45, losses: 12, winRate: 79, fgPercent: 62, threePtPercent: 48 },
  { rank: 2, username: 'SkyWalker23', wins: 38, losses: 15, winRate: 72, fgPercent: 58, threePtPercent: 52 },
  { rank: 3, username: 'CourtKing', wins: 35, losses: 18, winRate: 66, fgPercent: 55, threePtPercent: 45 },
  { rank: 4, username: 'Baller99', wins: 30, losses: 20, winRate: 60, fgPercent: 60, threePtPercent: 50 },
  { rank: 5, username: 'TheAce', wins: 28, losses: 22, winRate: 56, fgPercent: 53, threePtPercent: 42 }
]

const INITIAL_FRIENDS = [
  { username: 'BestBuddy', status: 'online', wins: 12, losses: 8 },
  { username: 'Rival101', status: 'offline', wins: 20, losses: 15 }
]

const INITIAL_REQUESTS = [
  { username: 'NewHooper' },
  { username: 'ThreePointPro' }
]

type SortBy = 'rank' | 'wins' | 'winRate' | 'fgPercent' | 'threePtPercent'

type Friend = { username: string; status: 'online' | 'offline'; wins: number; losses: number }

type FriendRequest = { username: string }

function OnlineMenuScreen() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard' | 'friends'>('play')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('rank')

  // Local UI state for mock friends and requests
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS)
  const [requests, setRequests] = useState<FriendRequest[]>(INITIAL_REQUESTS)

  function handleQuickMatch() {
    // TODO: Implement matchmaking
    alert('Matchmaking coming soon! This will find you a random opponent.')
  }

  function handleChallengeFriend(friendName: string) {
    alert(`Challenge sent to ${friendName}!`)
  }

  function handleAddFriend() {
    if (searchQuery) {
      // TODO: send friend request to backend
      alert(`Friend request sent to ${searchQuery}!`)
      setSearchQuery('')
    }
  }

  function handleAcceptRequest(username: string) {
    // TODO: backend accept
    setFriends(prev => [{ username, status: 'offline', wins: 0, losses: 0 }, ...prev])
    setRequests(prev => prev.filter(r => r.username !== username))
  }

  function handleDeclineRequest(username: string) {
    // TODO: backend decline
    setRequests(prev => prev.filter(r => r.username !== username))
  }

  function handleUnfriend(username: string) {
    // TODO: backend unfriend
    setFriends(prev => prev.filter(f => f.username !== username))
  }

  function getSortedLeaderboard() {
    const sorted = [...MOCK_LEADERBOARD]
    
    switch (sortBy) {
      case 'rank':
        return sorted.sort((a, b) => a.rank - b.rank)
      case 'wins':
        return sorted.sort((a, b) => b.wins - a.wins)
      case 'winRate':
        return sorted.sort((a, b) => b.winRate - a.winRate)
      case 'fgPercent':
        return sorted.sort((a, b) => b.fgPercent - a.fgPercent)
      case 'threePtPercent':
        return sorted.sort((a, b) => b.threePtPercent - a.threePtPercent)
      default:
        return sorted
    }
  }

  return (
    <div className="screen online-menu-screen">
      <div className="online-container">
            <header className="online-header">
              <button onClick={() => navigate('/home')} className="btn-back">
                ← Back
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

        {activeTab === 'play' && (
          <div className="play-section">
            <button onClick={handleQuickMatch} className="card online-card">
              <div className="card-icon">⚡</div>
              <h3>Quick Match</h3>
              <p>Find a random opponent</p>
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
                  <option value="rank">Rank</option>
                  <option value="wins">Wins</option>
                  <option value="winRate">Win %</option>
                  <option value="fgPercent">FG %</option>
                  <option value="threePtPercent">3PT %</option>
                </select>
              </div>
            </div>
            <div className="leaderboard-table card">
              <div className="table-header">
                <span className="col-rank">#</span>
                <span className="col-name">Player</span>
                <span className="col-stat">W-L</span>
                <span className="col-stat">Win%</span>
                <span className="col-stat">FG%</span>
                <span className="col-stat">3PT%</span>
              </div>
              {getSortedLeaderboard().map((player, index) => (
                <div key={player.username} className="table-row">
                  <span className="col-rank">{index + 1}</span>
                  <span className="col-name">{player.username}</span>
                  <span className="col-stat">{player.wins}-{player.losses}</span>
                  <span className="col-stat">{player.winRate}%</span>
                  <span className="col-stat">{player.fgPercent}%</span>
                  <span className="col-stat">{player.threePtPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="friends-section">
            <div className="search-bar card">
              <input
                type="text"
                placeholder="Search for players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button onClick={handleAddFriend} className="btn btn-primary">
                Add Friend
              </button>
            </div>

            <div className="requests-section card">
              <h3>Friend Requests</h3>
              {requests.length === 0 ? (
                <p className="muted">No pending requests</p>
              ) : (
                <div className="requests-list">
                  {requests.map(r => (
                    <div key={r.username} className="request-row">
                      <span className="request-name">{r.username}</span>
                      <div className="request-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleAcceptRequest(r.username)}>Accept</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeclineRequest(r.username)}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3>Your Friends</h3>
            <div className="friends-list">
              {friends.map(friend => (
                <div key={friend.username} className="card friend-card">
                  <div className="friend-info">
                    <div className="friend-name">
                      {friend.username}
                      <span className={`status-dot ${friend.status}`}></span>
                    </div>
                    <div className="friend-stats">
                      {friend.wins}-{friend.losses} ({Math.round(friend.wins / (friend.wins + friend.losses || 1) * 100)}% wins)
                    </div>
                  </div>
                  <div className="friend-actions">
                    <button 
                      onClick={() => handleChallengeFriend(friend.username)}
                      className="btn btn-secondary btn-sm"
                      disabled={friend.status === 'offline'}
                    >
                      Challenge
                    </button>
                    <button 
                      onClick={() => handleUnfriend(friend.username)}
                      className="btn btn-danger btn-sm"
                    >
                      Unfriend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OnlineMenuScreen

