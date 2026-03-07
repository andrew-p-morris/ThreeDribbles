import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LoginScreen.css'

function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { signUp, signIn, signInAsGuest, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        await signUp(email, password, username.trim())
      } else {
        await signIn(email.trim(), password)
      }
      navigate('/home')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setForgotMessage(null)
    const value = forgotEmail.trim()
    if (!value) return
    setLoading(true)
    try {
      await resetPassword(value)
      setForgotMessage({ type: 'success', text: 'Check your email for a link to reset your password.' })
      setForgotEmail('')
    } catch (err: any) {
      setForgotMessage({ type: 'error', text: err.message || 'Failed to send reset email.' })
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
          <h2>{isSignUp ? 'Create Account' : showForgotPassword ? 'Reset Password' : 'Sign In'}</h2>

          {error && <div className="error-message">{error}</div>}

          {showForgotPassword ? (
            <form onSubmit={handleForgotSubmit}>
              {forgotMessage && (
                <div className={forgotMessage.type === 'success' ? 'success-message' : 'error-message'}>
                  {forgotMessage.text}
                </div>
              )}
              <div className="form-group">
                <label>Username or email</label>
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Username or email"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p className="toggle-text">
                <span
                  className="toggle-link"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotMessage(null)
                    setForgotEmail('')
                  }}
                >
                  Back to sign in
                </span>
              </p>
            </form>
          ) : (
          <form onSubmit={handleSubmit}>
            {isSignUp ? (
              <>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    maxLength={12}
                    required
                  />
                  <p className="input-hint">Letters and numbers only, 1–12 characters.</p>
                </div>
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
                <div className="form-group">
                  <label>Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Username or email</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Username or email"
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
                {!showForgotPassword ? (
                  <p className="forgot-row">
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  </p>
                ) : null}
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          )}

          {!showForgotPassword && (
          <>
          <div className="divider">OR</div>

          <button onClick={handleGuestLogin} className="btn btn-secondary" disabled={loading}>
            Continue as Guest
          </button>

          <p className="toggle-text">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span
              className="toggle-link"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setConfirmPassword('')
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
          </>
          )}
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

