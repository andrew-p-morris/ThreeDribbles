import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getDatabase, Database } from 'firebase/database'
import { firebaseConfig } from './config'

// Check if Firebase is configured
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10)

if (!isFirebaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Firebase] No valid API key. Copy .env.example to .env.local, set VITE_FIREBASE_API_KEY from Firebase Console → Project settings → Your apps, then restart the dev server.'
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let rtdb: Database | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    enableIndexedDbPersistence(db).catch((err: { code?: string }) => {
      if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Persistence failed: multiple tabs open.')
      } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Persistence not supported in this browser.')
      } else {
        console.warn('[Firebase] Persistence error:', err)
      }
    })
    if (firebaseConfig.databaseURL) {
      rtdb = getDatabase(app)
    }
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
}

export { auth, db, rtdb }
export default app
