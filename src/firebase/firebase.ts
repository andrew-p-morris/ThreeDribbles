import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getDatabase, Database } from 'firebase/database'
import { firebaseConfig } from './config'

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let rtdb: Database | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    rtdb = getDatabase(app)
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
}

export { auth, db, rtdb }
export default app

