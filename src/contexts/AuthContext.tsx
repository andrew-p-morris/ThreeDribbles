import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import { deleteUserFirestoreData } from '../firebase/online'
import { User, ModeStats } from '../types/User'
import { EquippedCosmetics } from '../types/Cosmetics'

// Check if Firebase is available
const isFirebaseAvailable = auth !== null && db !== null

const USERNAME_MAX_LENGTH = 12
const USERNAME_BAD_WORDS = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'cunt', 'nigger', 'nigga', 'retard', 'fag', 'gay', 'homo', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'sex', 'porn', 'xxx']

/** Username display: all letters uppercase (e.g. "drew" → "DREW"). */
function capitalizeDisplayName(name: string): string {
  if (!name || !name.trim()) return name
  return name.trim().toUpperCase()
}

/** Returns an error message if invalid, or null if valid. Expects trimmed input. */
function validateUsername(username: string): string | null {
  if (username.length === 0 || username.length > USERNAME_MAX_LENGTH) {
    return 'Username must be 1–12 characters.'
  }
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return 'Username can only contain letters and numbers.'
  }
  const lower = username.toLowerCase()
  for (const word of USERNAME_BAD_WORDS) {
    if (lower.includes(word)) {
      return 'Username contains inappropriate content.'
    }
  }
  return null
}

type AuthContextType = {
  currentUser: User | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (usernameOrEmail: string, password: string) => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (emailOrUsername: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  updateUserCharacter: (characterId: string) => void
  updateUserCosmetics: (cosmetics: EquippedCosmetics) => void
  updateUserStats: (modeKey: string, won: boolean, points: number, shotsMade: number, shotsAttempted: number, threesMade: number, threesAttempted: number) => void
  updateUserUnlockedCosmetics: (newlyUnlockedIds: string[]) => void
  updateUserCoins: (delta: number) => void
  updateUserChallengeOpponents: (opponentUid: string) => void
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
  const currentUserRef = useRef<User | null>(null)
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  function persistLocalUser(user: User) {
    localStorage.setItem('guestUser', JSON.stringify(user))
  }

  function persistFirebaseUser(uid: string, patch: Partial<User>) {
    if (!db) return
    const userRef = doc(db, 'users', uid)
    updateDoc(userRef, patch).catch(console.error)
  }

  async function createUserDocument(firebaseUser: FirebaseUser, isGuest: boolean, username?: string) {
    if (!isFirebaseAvailable || !db) {
      // Create local user without Firebase
      const raw = username || (isGuest ? `Guest${Math.floor(Math.random() * 9999)}` : 'Player')
      const displayName = capitalizeDisplayName(raw)
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        isGuest,
        stats: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          totalPoints: 0,
          favoriteArchetype: null
        },
        coins: 5000,
        createdAt: Date.now()
      }
      return userData
    }

    const userRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      const raw = username || (isGuest ? `Guest${Math.floor(Math.random() * 9999)}` : 'Player')
      const displayName = capitalizeDisplayName(raw)
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        isGuest,
        stats: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          totalPoints: 0,
          favoriteArchetype: null
        },
        coins: 5000,
        createdAt: Date.now()
      }
      await setDoc(userRef, { ...userData, displayNameLower: displayName.toLowerCase() })
      return userData
    } else {
      const data = userDoc.data() as User
      return { ...data, displayName: capitalizeDisplayName(data.displayName || '') }
    }
  }

  async function signUp(email: string, password: string, username: string) {
    if (!isFirebaseAvailable || !auth) {
      throw new Error('Firebase is not configured. Please set up Firebase to use authentication.')
    }
    const trimmed = username.trim()
    const validationError = validateUsername(trimmed)
    if (validationError) {
      throw new Error(validationError)
    }
    const isAvailable = await checkUsernameAvailable(trimmed)
    if (!isAvailable) {
      throw new Error('Username already taken')
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const userData = await createUserDocument(userCredential.user, false, trimmed)
    setCurrentUser({ ...userData, coins: userData.coins ?? 5000, displayName: capitalizeDisplayName(userData.displayName) })
    setLoading(false)
  }

  async function signIn(usernameOrEmail: string, password: string) {
    if (!isFirebaseAvailable || !auth) {
      throw new Error('Firebase is not configured. Please set up Firebase to use authentication.')
    }
    let email = usernameOrEmail.trim()
    if (!email.includes('@') && db) {
      const usersRef = collection(db, 'users')
      const trimmed = usernameOrEmail.trim()
      const qLower = query(usersRef, where('displayNameLower', '==', trimmed.toLowerCase()), limit(1))
      let querySnapshot = await getDocs(qLower)
      if (querySnapshot.empty) {
        const qExact = query(usersRef, where('displayName', '==', trimmed), limit(1))
        querySnapshot = await getDocs(qExact)
      }
      if (querySnapshot.empty) {
        throw new Error('Invalid username or password')
      }
      const userData = querySnapshot.docs[0].data()
      const foundEmail = userData.email
      if (!foundEmail) {
        throw new Error('Invalid username or password')
      }
      email = foundEmail
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      if (db) {
        const userRef = doc(db, 'users', userCredential.user.uid)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          const data = userDoc.data() as User
          setCurrentUser({ ...data, coins: data.coins ?? 5000, displayName: capitalizeDisplayName(data.displayName || '') })
        } else {
          const userData = await createUserDocument(userCredential.user, false)
          setCurrentUser({ ...userData, coins: userData.coins ?? 5000, displayName: capitalizeDisplayName(userData.displayName) })
        }
      }
      setLoading(false)
    } catch (err: any) {
      const code = err?.code
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        throw new Error('Invalid username or password')
      }
      throw err
    }
  }

  async function signInAsGuest() {
    console.log('Signing in as guest, Firebase available:', isFirebaseAvailable)

    function createLocalGuestUser(): User {
      return {
        uid: `guest_${Date.now()}`,
        email: null,
        displayName: capitalizeDisplayName(`Guest${Math.floor(Math.random() * 9999)}`),
        isGuest: true,
        stats: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          totalPoints: 0,
          favoriteArchetype: null
        },
        coins: 5000,
        createdAt: Date.now()
      }
    }

    if (!isFirebaseAvailable || !auth) {
      const localUser = createLocalGuestUser()
      console.log('Created local guest user:', localUser)
      setCurrentUser(localUser)
      localStorage.setItem('guestUser', JSON.stringify(localUser))
      return
    }

    try {
      const userCredential = await signInAnonymously(auth)
      const userData = await createUserDocument(userCredential.user, true)
      setCurrentUser({ ...userData, coins: userData.coins ?? 5000, displayName: capitalizeDisplayName(userData.displayName) })
      setLoading(false)
    } catch (err) {
      // Anonymous auth disabled or failed (e.g. auth/admin-restricted-operation): use local-only guest
      console.warn('Anonymous sign-in failed, using local guest:', err)
      const localUser = createLocalGuestUser()
      setCurrentUser(localUser)
      localStorage.setItem('guestUser', JSON.stringify(localUser))
    }
  }

  async function signOut() {
    if (!isFirebaseAvailable || !auth) {
      setCurrentUser(null)
      localStorage.removeItem('guestUser')
      return
    }
    await firebaseSignOut(auth)
  }

  async function resetPassword(emailOrUsername: string) {
    if (!isFirebaseAvailable || !auth) {
      throw new Error('Firebase is not configured. Password reset is not available.')
    }
    let email = emailOrUsername.trim()
    if (!email.includes('@') && db) {
      const usersRef = collection(db, 'users')
      const qLower = query(usersRef, where('displayNameLower', '==', email.toLowerCase()), limit(1))
      let querySnapshot = await getDocs(qLower)
      if (querySnapshot.empty) {
        const qExact = query(usersRef, where('displayName', '==', email), limit(1))
        querySnapshot = await getDocs(qExact)
      }
      if (querySnapshot.empty) {
        throw new Error('No account found with that username or email.')
      }
      const userData = querySnapshot.docs[0].data()
      const foundEmail = userData.email
      if (!foundEmail) {
        throw new Error('No account found with that username or email.')
      }
      email = foundEmail
    }
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        throw new Error('No account found with that username or email.')
      }
      throw err
    }
  }

  async function deleteAccount(password: string) {
    if (!currentUser) {
      throw new Error('No user logged in.')
    }
    if (currentUser.isGuest) {
      localStorage.removeItem('guestUser')
      localStorage.removeItem('localUsernames')
      setCurrentUser(null)
      return
    }
    if (!isFirebaseAvailable || !auth || !db) {
      throw new Error('Account deletion is not available.')
    }
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      throw new Error('Not signed in. Please sign in again.')
    }
    const email = currentUser.email
    if (!email || !password.trim()) {
      throw new Error('Password is required to delete your account.')
    }
    try {
      await reauthenticateWithCredential(
        firebaseUser,
        EmailAuthProvider.credential(email, password.trim())
      )
    } catch (err: any) {
      const code = err?.code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        throw new Error('Wrong password.')
      }
      if (code === 'auth/requires-recent-login') {
        throw new Error('Please sign out and sign in again, then try deleting your account.')
      }
      throw err
    }
    try {
      await deleteUserFirestoreData(currentUser.uid)
    } catch (err) {
      console.error('Firestore cleanup during account deletion:', err)
      throw new Error('Could not delete all data. Please try again.')
    }
    await deleteUser(firebaseUser)
    setCurrentUser(null)
  }

  function updateUserCharacter(characterId: string) {
    setCurrentUser(prev => {
      if (!prev) return prev
      const next = { ...prev, selectedCharacter: characterId }
      if (!isFirebaseAvailable || !db) {
        persistLocalUser(next)
      } else {
        persistFirebaseUser(prev.uid, { selectedCharacter: characterId })
      }
      return next
    })
  }

  function updateUserCosmetics(cosmetics: EquippedCosmetics) {
    setCurrentUser(prev => {
      if (!prev) return prev
      const next = { ...prev, equippedCosmetics: cosmetics }
      if (!isFirebaseAvailable || !db) {
        persistLocalUser(next)
      } else {
        persistFirebaseUser(prev.uid, { equippedCosmetics: cosmetics })
      }
      return next
    })
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
    setCurrentUser(prev => {
      if (!prev) return prev

      // Update overall stats
      const newStats = { ...prev.stats }
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

      ;(newStats as any)[modeKey] = newModeStats

      const next = { ...prev, stats: newStats }

      if (!isFirebaseAvailable || !db) {
        persistLocalUser(next)
      } else {
        persistFirebaseUser(prev.uid, { stats: newStats })
      }

      return next
    })
  }

  function updateUserUnlockedCosmetics(newlyUnlockedIds: string[]) {
    if (newlyUnlockedIds.length === 0) return
    if (!isFirebaseAvailable || !db) {
      setCurrentUser(prev => {
        if (!prev) return prev
        const existing = prev.unlockedCosmetics || []
        const merged = [...new Set([...existing, ...newlyUnlockedIds])]
        const next = { ...prev, unlockedCosmetics: merged }
        persistLocalUser(next)
        return next
      })
      return
    }
    const uid = currentUserRef.current?.uid
    if (!uid) return
    const userRef = doc(db, 'users', uid)
    getDoc(userRef).then(snap => {
      const serverList: string[] = (snap.exists() && snap.data()?.unlockedCosmetics) ? [...snap.data().unlockedCosmetics] : []
      const merged = [...new Set([...serverList, ...newlyUnlockedIds])]
      return updateDoc(userRef, { unlockedCosmetics: merged }).then(() => merged)
    }).then(merged => {
      setCurrentUser(prev => prev && prev.uid === uid ? { ...prev, unlockedCosmetics: merged } : prev)
    }).catch(console.error)
  }

  function updateUserCoins(delta: number) {
    setCurrentUser(prev => {
      if (!prev) return prev
      const current = prev.coins ?? 0
      const newCoins = Math.max(0, current + delta)
      const next = { ...prev, coins: newCoins }

      if (!isFirebaseAvailable || !db) {
        persistLocalUser(next)
      } else {
        persistFirebaseUser(prev.uid, { coins: newCoins })
      }

      return next
    })
  }

  function updateUserChallengeOpponents(opponentUid: string) {
    setCurrentUser(prev => {
      if (!prev) return prev
      const list = prev.challengeOpponentUids ?? []
      if (list.includes(opponentUid)) return prev
      const next = [...list, opponentUid]
      const nextUser = { ...prev, challengeOpponentUids: next }
      if (!isFirebaseAvailable || !db) {
        persistLocalUser(nextUser)
      } else {
        persistFirebaseUser(prev.uid, { challengeOpponentUids: next })
      }
      return nextUser
    })
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
      const lower = username.trim().toLowerCase()
      const qLower = query(usersRef, where('displayNameLower', '==', lower), limit(1))
      let querySnapshot = await getDocs(qLower)
      if (querySnapshot.empty) {
        const qExact = query(usersRef, where('displayName', '==', username.trim()), limit(1))
        querySnapshot = await getDocs(qExact)
      }
      if (querySnapshot.empty) return true
      if (currentUser && querySnapshot.docs.some(d => d.id === currentUser.uid)) return true
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

    const trimmed = newUsername.trim()
    const validationError = validateUsername(trimmed)
    if (validationError) {
      return { success: false, error: validationError }
    }

    // Check if username is available
    const isAvailable = await checkUsernameAvailable(trimmed)
    if (!isAvailable) {
      return { success: false, error: 'Username already taken' }
    }

    // Update username
    if (!isFirebaseAvailable || !db) {
      const displayName = capitalizeDisplayName(trimmed)
      setCurrentUser(prev => {
        if (!prev) return prev
        const next = { ...prev, displayName }
        persistLocalUser(next)
        return next
      })
      const localUsernames = localStorage.getItem('localUsernames')
      const usernames = localUsernames ? JSON.parse(localUsernames) : []
      if (!usernames.includes(trimmed.toLowerCase())) {
        usernames.push(trimmed.toLowerCase())
        localStorage.setItem('localUsernames', JSON.stringify(usernames))
      }
      return { success: true }
    } else {
      const previousDisplayName = currentUser.displayName
      try {
        const displayName = capitalizeDisplayName(trimmed)
        setCurrentUser(prev => {
          if (!prev) return prev
          return { ...prev, displayName }
        })
        const userRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userRef, { displayName, displayNameLower: displayName.toLowerCase() })
        return { success: true }
      } catch (error) {
        console.error('Error updating username:', error)
        setCurrentUser(prev => prev ? { ...prev, displayName: previousDisplayName } : prev)
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
        const parsed = JSON.parse(storedGuest)
        setCurrentUser({ ...parsed, coins: parsed.coins ?? 5000, displayName: capitalizeDisplayName(parsed.displayName || '') })
      }
      setLoading(false)
      return
    }

    const database = db!
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(database, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          const data = userDoc.data() as User
          setCurrentUser({ ...data, coins: data.coins ?? 5000, displayName: capitalizeDisplayName(data.displayName || '') })
        } else {
          const isGuest = firebaseUser.isAnonymous
          const userData = await createUserDocument(firebaseUser, isGuest)
          setCurrentUser({ ...userData, coins: userData.coins ?? 5000, displayName: capitalizeDisplayName(userData.displayName) })
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
    resetPassword,
    deleteAccount,
    updateUserCharacter,
    updateUserCosmetics,
    updateUserStats,
    updateUserUnlockedCosmetics,
    updateUserCoins,
    updateUserChallengeOpponents,
    updateUsername,
    checkUsernameAvailable
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
