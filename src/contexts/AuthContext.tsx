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
import { doc, setDoc, getDoc, getDocFromCache, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
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
  if (username.length === 0) {
    return 'Please pick a username.'
  }
  if (username.length > USERNAME_MAX_LENGTH) {
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

  function defaultDisplayName(firebaseUser: FirebaseUser, isGuest: boolean, username?: string): string {
    if (username?.trim()) return username.trim()
    if (isGuest) return `Guest${Math.floor(Math.random() * 9999)}`
    const local = firebaseUser.email?.split('@')[0]?.trim()
    return local || 'User'
  }

  async function createUserDocument(firebaseUser: FirebaseUser, isGuest: boolean, username?: string) {
    if (!isFirebaseAvailable || !db) {
      // Create local user without Firebase
      const raw = defaultDisplayName(firebaseUser, isGuest, username)
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
        coins: isGuest ? 0 : 500,
        createdAt: Date.now()
      }
      return userData
    }

    const userRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      const raw = defaultDisplayName(firebaseUser, isGuest, username)
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
        coins: isGuest ? 0 : 500,
        createdAt: Date.now()
      }
      await setDoc(userRef, { ...userData, displayNameLower: displayName.toLowerCase() })
      return userData
    } else {
      const data = userDoc.data() as User
      const existingDisplay = (data.displayName || '').trim()
      const isDefaultName = !existingDisplay || existingDisplay === 'Player' || existingDisplay === 'PLAYER'
      if (username && isDefaultName) {
        const displayName = capitalizeDisplayName(username)
        await updateDoc(userRef, { displayName, displayNameLower: username.toLowerCase() })
        return { ...data, displayName }
      }
      return { ...data, displayName: capitalizeDisplayName(data.displayName || '') }
    }
  }

  async function signUp(email: string, password: string, username: string) {
    if (!isFirebaseAvailable || !auth) {
      throw new Error('Firebase is not configured. Add VITE_FIREBASE_API_KEY to .env.local and restart the dev server.')
    }
    const trimmed = username.trim()
    const validationError = validateUsername(trimmed)
    if (validationError) {
      throw new Error(validationError)
    }
    // #region agent log
    fetch('http://127.0.0.1:7612/ingest/81882968-0dde-49e0-a384-e7df3b91b315',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'517300'},body:JSON.stringify({sessionId:'517300',runId:'repro',hypothesisId:'H1',location:'AuthContext.tsx:signUp',message:'signUp before checkUsernameAvailable',data:{flow:'signUp'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const isAvailable = await checkUsernameAvailable(trimmed)
    if (!isAvailable) {
      throw new Error('That username is taken — pick a different one.')
    }
    const emailTrimmed = email.trim().toLowerCase()
    if (!emailTrimmed) {
      throw new Error('Please enter an email.')
    }
    let userCredential
    try {
      userCredential = await createUserWithEmailAndPassword(auth, emailTrimmed, password)
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error('That email is already in use. Sign in or use a different email.')
      }
      throw err
    }
    const userData = await createUserDocument(userCredential.user, false, trimmed)
    setCurrentUser({ ...userData, coins: userData.coins ?? 500, displayName: capitalizeDisplayName(userData.displayName) })
    setLoading(false)
  }

  async function signIn(usernameOrEmail: string, password: string) {
    if (!isFirebaseAvailable || !auth) {
      throw new Error('Firebase is not configured. Add VITE_FIREBASE_API_KEY to .env.local and restart the dev server.')
    }
    let email = usernameOrEmail.trim()
    if (email.includes('@')) {
      email = email.toLowerCase()
    }
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
          setCurrentUser({ ...data, coins: data.coins ?? 500, displayName: capitalizeDisplayName(data.displayName || '') })
        } else {
          const userData = await createUserDocument(userCredential.user, false)
          setCurrentUser({ ...userData, coins: userData.coins ?? 500, displayName: capitalizeDisplayName(userData.displayName) })
        }
      }
      setLoading(false)
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7612/ingest/81882968-0dde-49e0-a384-e7df3b91b315',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'517300'},body:JSON.stringify({sessionId:'517300',runId:'repro',hypothesisId:'H2_H3',location:'AuthContext.tsx:signIn_catch',message:'signIn error',data:{code:err?.code,message:err?.message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
        coins: 0,
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
      setCurrentUser({ ...userData, coins: userData.coins ?? 0, displayName: capitalizeDisplayName(userData.displayName) })
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
      throw new Error('Firebase is not configured. Add VITE_FIREBASE_API_KEY to .env.local and restart the dev server.')
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
    // Remove the user from Firebase Auth so the email can be reused for a new account.
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
    // #region agent log
    fetch('http://127.0.0.1:7612/ingest/81882968-0dde-49e0-a384-e7df3b91b315',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'517300'},body:JSON.stringify({sessionId:'517300',runId:'repro',hypothesisId:'H1',location:'AuthContext.tsx:checkUsernameAvailable',message:'checkUsernameAvailable entry',data:{hasAuth:!!auth?.currentUser,uid:auth?.currentUser?.uid??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    } catch (error: any) {
      console.error('Error checking username:', error)
      const isPermissionError = error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('insufficient')
      if (isPermissionError) {
        throw new Error('Unable to check username. Ensure Firestore rules allow username lookups for sign-up.')
      }
      return false
    }
  }

  async function updateUsername(newUsername: string): Promise<{ success: boolean, error?: string }> {
    if (!currentUser) {
      return { success: false, error: 'No user logged in' }
    }
    if ((currentUser.usernameChangesUsed ?? 0) >= 2) {
      return { success: false, error: 'You have used all 2 username changes for this account.' }
    }

    const trimmed = newUsername.trim()
    const validationError = validateUsername(trimmed)
    if (validationError) {
      return { success: false, error: validationError }
    }

    // Check if username is available
    const isAvailable = await checkUsernameAvailable(trimmed)
    if (!isAvailable) {
      return { success: false, error: 'That username is taken — pick a different one.' }
    }

    // Update username (only increment count when name actually changes)
    const displayName = capitalizeDisplayName(trimmed)
    const nameUnchanged = displayName === capitalizeDisplayName(currentUser.displayName || '')
    const newCount = nameUnchanged ? (currentUser.usernameChangesUsed ?? 0) : (currentUser.usernameChangesUsed ?? 0) + 1

    if (!isFirebaseAvailable || !db) {
      setCurrentUser(prev => {
        if (!prev) return prev
        const next = { ...prev, displayName, usernameChangesUsed: newCount }
        persistLocalUser(next)
        return next
      })
      if (!nameUnchanged) {
        const localUsernames = localStorage.getItem('localUsernames')
        const usernames = localUsernames ? JSON.parse(localUsernames) : []
        if (!usernames.includes(trimmed.toLowerCase())) {
          usernames.push(trimmed.toLowerCase())
          localStorage.setItem('localUsernames', JSON.stringify(usernames))
        }
      }
      return { success: true }
    } else {
      const previousDisplayName = currentUser.displayName
      const previousCount = currentUser.usernameChangesUsed ?? 0
      try {
        setCurrentUser(prev => {
          if (!prev) return prev
          return { ...prev, displayName, usernameChangesUsed: newCount }
        })
        const userRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userRef, {
          displayName,
          displayNameLower: displayName.toLowerCase(),
          usernameChangesUsed: newCount
        })
        return { success: true }
      } catch (error) {
        console.error('Error updating username:', error)
        setCurrentUser(prev => prev ? { ...prev, displayName: previousDisplayName, usernameChangesUsed: previousCount } : prev)
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
        setCurrentUser({ ...parsed, coins: parsed.coins ?? 0, displayName: capitalizeDisplayName(parsed.displayName || '') })
      }
      setLoading(false)
      return
    }

    const database = db!
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(database, 'users', firebaseUser.uid)
          let userDoc
          try {
            userDoc = await getDoc(userRef)
          } catch (getErr: any) {
            const isOffline = getErr?.code === 'unavailable' || getErr?.message?.includes('offline')
            if (isOffline) {
              try {
                userDoc = await getDocFromCache(userRef)
              } catch {
                setCurrentUser(null)
                return
              }
            } else {
              throw getErr
            }
          }
          if (userDoc.exists()) {
            const data = userDoc.data() as User
            setCurrentUser({ ...data, coins: data.coins ?? (data.isGuest ? 0 : 500), displayName: capitalizeDisplayName(data.displayName || '') })
          } else {
            // Do not create the doc here — only signUp and signInAsGuest create new user docs.
            // This avoids a race where the listener would write "Player" and overwrite the sign-up username.
            setCurrentUser(null)
          }
        } else {
          setCurrentUser(null)
        }
      } catch (err) {
        console.error('Auth state change error:', err)
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
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
