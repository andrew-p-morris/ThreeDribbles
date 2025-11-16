import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LoginScreen.css'

function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp, signIn, signInAsGuest } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, username)
      } else {
        await signIn(email, password)
      }
      navigate('/home')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    setLoading(true)
    try {
      await signInAsGuest()
      console.log('Guest sign in complete, waiting before navigation')
      // Wait a bit to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 200))
      console.log('Navigating to home')
      navigate('/home')
    } catch (err: any) {
      console.error('Guest login error:', err)
      setError(err.message || 'Guest login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen login-screen">
      <div className="login-container">
        <h1 className="game-title">🏀 THREE DRIBBLES</h1>
        <p className="game-subtitle">RETRO BASKETBALL</p>

        <div className="card login-card">
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="divider">OR</div>

          <button onClick={handleGuestLogin} className="btn btn-secondary" disabled={loading}>
            Continue as Guest
          </button>

          <p className="toggle-text">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span className="toggle-link" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">🎮</span>
            <span>Local & Online Multiplayer</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span>AI Opponents</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🏆</span>
            <span>Track Your Stats</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen

