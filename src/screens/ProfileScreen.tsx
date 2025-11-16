import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './ProfileScreen.css'

function ProfileScreen() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()

  if (!currentUser || currentUser.isGuest) {
    navigate('/home')
    return null
  }

  const winRate = currentUser.stats.totalGames > 0
    ? Math.round((currentUser.stats.wins / currentUser.stats.totalGames) * 100)
    : 0

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="screen profile-screen">
      <div className="profile-container">
        <header className="profile-header">
          <button onClick={() => navigate('/home')} className="btn-back">
            ← Back
          </button>
          <h1>Profile</h1>
          <div className="header-right">
            <span className="username">{currentUser.displayName}</span>
            <button onClick={handleSignOut} className="btn-secondary-small">
              Sign Out
            </button>
          </div>
        </header>

        <div className="profile-card card">
          <div className="profile-avatar">
            <div className="avatar-circle">👤</div>
          </div>
          <h2 className="profile-name">{currentUser.displayName}</h2>
          <p className="profile-email">{currentUser.email}</p>
        </div>

        <div className="stats-section">
          <h3>Statistics</h3>
          <div className="stats-cards">
            <div className="stat-card card">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{currentUser.stats.wins}</div>
              <div className="stat-label">Wins</div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">😔</div>
              <div className="stat-value">{currentUser.stats.losses}</div>
              <div className="stat-label">Losses</div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">🎮</div>
              <div className="stat-value">{currentUser.stats.totalGames}</div>
              <div className="stat-label">Total Games</div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{winRate}%</div>
              <div className="stat-label">Win Rate</div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{currentUser.stats.totalPoints}</div>
              <div className="stat-label">Total Points</div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">❤️</div>
              <div className="stat-value">
                {currentUser.stats.favoriteArchetype || 'None'}
              </div>
              <div className="stat-label">Favorite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileScreen

