import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GameProvider } from './contexts/GameContext'
import { SettingsProvider } from './contexts/SettingsContext'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import ProfileScreen from './screens/ProfileScreen'
import SettingsScreen from './screens/SettingsScreen'
import OnlineMenuScreen from './screens/OnlineMenuScreen'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <GameProvider>
            <Routes>
              <Route path="/" element={<LoginScreen />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/game" element={<GameScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/online" element={<OnlineMenuScreen />} />
            </Routes>
          </GameProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

