import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import { User, ModeStats } from '../types/User'
import { EquippedCosmetics } from '../types/Cosmetics'

// Check if Firebase is available
const isFirebaseAvailable = auth !== null && db !== null

type AuthContextType = {
  currentUser: User | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  updateUserCharacter: (characterId: string) => void
  updateUserCosmetics: (cosmetics: EquippedCosmetics) => void
  updateUserStats: (modeKey: string, won: boolean, points: number, shotsMade: number, shotsAttempted: number, threesMade: number, threesAttempted: number) => void
  updateUsername: (newUsername: string) => Promise<{ success: boolean, error?: string }>
  checkUsernameAvailable: (username: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function createUserDocument(firebaseUser: FirebaseUser, isGuest: boolean, username?: string) {
    if (!isFirebaseAvailable || !db) {
      // Create local user without Firebase
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: username || (isGuest ? `Guest${Math.floor(Math.random() * 9999)}` : 'Player'),
        isGuest,
        stats: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          totalPoints: 0,
          favoriteArchetype: null
        },
        createdAt: Date.now()
      }
      return userData
    }

    const userRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: username || (isGuest ? `Guest${Math.floor(Math.random() * 9999)}` : 'Player'),
        isGuest,
        stats: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          totalPoints: 0,
          favoriteArchetype: null
        },
        createdAt: Date.now()
      }
      
      await setDoc(userRef, userData)
      return userData
    } else {
      return userDoc.data() as User
    }
  }

  async function signUp(email: string, password: string, username: string) {
    if (!isFirebaseAvailable || !auth) {
      throw new Error('Firebase is not configured. Please set up Firebase to use authentication.')
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await createUserDocument(userCredential.user, false, username)
  }

  async function signIn(email: string, password: string) {
    if (!isFirebaseAvailable || !auth) {
      throw new Error('Firebase is not configured. Please set up Firebase to use authentication.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signInAsGuest() {
    console.log('Signing in as guest, Firebase available:', isFirebaseAvailable)
    if (!isFirebaseAvailable || !auth) {
      // Create a local guest user without Firebase
      const localUser: User = {
        uid: `guest_${Date.now()}`,
        email: null,
        displayName: `Guest${Math.floor(Math.random() * 9999)}`,
        isGuest: true,
        stats: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          totalPoints: 0,
          favoriteArchetype: null
        },
        createdAt: Date.now()
      }
      console.log('Created local guest user:', localUser)
      setCurrentUser(localUser)
      // Store in localStorage so it persists
      localStorage.setItem('guestUser', JSON.stringify(localUser))
      return
    }
    const userCredential = await signInAnonymously(auth)
    await createUserDocument(userCredential.user, true)
  }

  async function signOut() {
    if (!isFirebaseAvailable || !auth) {
      setCurrentUser(null)
      localStorage.removeItem('guestUser')
      return
    }
    await firebaseSignOut(auth)
  }

  function updateUserCharacter(characterId: string) {
    if (!currentUser) return

    const updatedUser = { ...currentUser, selectedCharacter: characterId }
    setCurrentUser(updatedUser)

    // Save to storage
    if (!isFirebaseAvailable || !db) {
      localStorage.setItem('guestUser', JSON.stringify(updatedUser))
    } else {
      const userRef = doc(db, 'users', currentUser.uid)
      updateDoc(userRef, { selectedCharacter: characterId }).catch(console.error)
    }
  }

  function updateUserCosmetics(cosmetics: EquippedCosmetics) {
    if (!currentUser) return

    const updatedUser = { ...currentUser, equippedCosmetics: cosmetics }
    setCurrentUser(updatedUser)

    // Save to storage
    if (!isFirebaseAvailable || !db) {
      localStorage.setItem('guestUser', JSON.stringify(updatedUser))
    } else {
      const userRef = doc(db, 'users', currentUser.uid)
      updateDoc(userRef, { equippedCosmetics: cosmetics }).catch(console.error)
    }
  }

  function updateUserStats(
    modeKey: string, 
    won: boolean, 
    points: number, 
    shotsMade: number, 
    shotsAttempted: number, 
    threesMade: number, 
    threesAttempted: number
  ) {
    if (!currentUser) return

    // Update overall stats
    const newStats = { ...currentUser.stats }
    newStats.totalGames++
    newStats.totalPoints += points
    if (won) {
      newStats.wins++
    } else {
      newStats.losses++
    }

    // Update mode-specific stats
    const existingModeStats = (newStats as any)[modeKey]
    const defaultStats: ModeStats = {
      wins: 0,
      losses: 0,
      totalGames: 0,
      totalPoints: 0,
      shotsMade: 0,
      shotsAttempted: 0,
      threesMade: 0,
      threesAttempted: 0
    }
    
    const currentModeStats: ModeStats = (existingModeStats && typeof existingModeStats === 'object') 
      ? existingModeStats 
      : defaultStats

    const newModeStats: ModeStats = {
      wins: currentModeStats.wins + (won ? 1 : 0),
      losses: currentModeStats.losses + (won ? 0 : 1),
      totalGames: currentModeStats.totalGames + 1,
      totalPoints: currentModeStats.totalPoints + points,
      shotsMade: currentModeStats.shotsMade + shotsMade,
      shotsAttempted: currentModeStats.shotsAttempted + shotsAttempted,
      threesMade: currentModeStats.threesMade + threesMade,
      threesAttempted: currentModeStats.threesAttempted + threesAttempted
    }

    (newStats as any)[modeKey] = newModeStats

    const updatedUser = { ...currentUser, stats: newStats }
    setCurrentUser(updatedUser)

    // Save to storage
    if (!isFirebaseAvailable || !db) {
      localStorage.setItem('guestUser', JSON.stringify(updatedUser))
    } else {
      try {
        const userRef = doc(db, 'users', currentUser.uid)
        updateDoc(userRef, { stats: newStats }).catch(console.error)
      } catch (error) {
        console.error('Error updating stats:', error)
      }
    }
  }

  async function checkUsernameAvailable(username: string): Promise<boolean> {
    if (!isFirebaseAvailable || !db) {
      // For local mode, check localStorage
      const localUsers = localStorage.getItem('localUsernames')
      const usernames = localUsers ? JSON.parse(localUsers) : []
      return !usernames.includes(username.toLowerCase())
    }

    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('displayName', '==', username))
      const querySnapshot = await getDocs(q)
      
      // If any results found, username is taken
      // But exclude current user's own username
      if (querySnapshot.empty) return true
      
      // Check if it's the current user's username
      if (currentUser && querySnapshot.docs.some(doc => doc.id === currentUser.uid)) {
        return true // Their own username is available to them
      }
      
      return false
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  }

  async function updateUsername(newUsername: string): Promise<{ success: boolean, error?: string }> {
    if (!currentUser) {
      return { success: false, error: 'No user logged in' }
    }

    // Validate length
    if (newUsername.length === 0 || newUsername.length > 10) {
      return { success: false, error: 'Username must be 1-10 characters' }
    }

    // Check for inappropriate words (basic profanity filter)
    const inappropriateWords = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'cunt', 'nigger', 'nigga', 'retard', 'fag', 'gay', 'homo', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'sex', 'porn', 'xxx']
    const lowerUsername = newUsername.toLowerCase()
    for (const word of inappropriateWords) {
      if (lowerUsername.includes(word)) {
        return { success: false, error: 'Username contains inappropriate content' }
      }
    }

    // Check if username is available
    const isAvailable = await checkUsernameAvailable(newUsername)
    if (!isAvailable) {
      return { success: false, error: 'Username already taken' }
    }

    // Update username
    const updatedUser = { ...currentUser, displayName: newUsername }
    setCurrentUser(updatedUser)

    // Save to storage
    if (!isFirebaseAvailable || !db) {
      localStorage.setItem('guestUser', JSON.stringify(updatedUser))
      // Track username in local list
      const localUsernames = localStorage.getItem('localUsernames')
      const usernames = localUsernames ? JSON.parse(localUsernames) : []
      if (!usernames.includes(newUsername.toLowerCase())) {
        usernames.push(newUsername.toLowerCase())
        localStorage.setItem('localUsernames', JSON.stringify(usernames))
      }
      return { success: true }
    } else {
      try {
        const userRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userRef, { displayName: newUsername })
        return { success: true }
      } catch (error) {
        console.error('Error updating username:', error)
        return { success: false, error: 'Failed to update username' }
      }
    }
  }

  useEffect(() => {
    if (!isFirebaseAvailable || !auth || !db) {
      // No Firebase, check localStorage for guest user
      const storedGuest = localStorage.getItem('guestUser')
      if (storedGuest) {
        console.log('Restoring guest user from localStorage')
        setCurrentUser(JSON.parse(storedGuest))
      }
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User)
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInAsGuest,
    signOut,
    updateUserCharacter,
    updateUserCosmetics,
    updateUserStats,
    updateUsername,
    checkUsernameAvailable
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

