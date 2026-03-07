import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
  type CollectionReference,
  type Firestore
} from 'firebase/firestore'
import { db } from './firebase'
import type { GameState } from '../types/Game'
import type { ModeStats } from '../types/User'

const MATCHMAKING_COLLECTION = 'matchmakingQueue'
const GAMES_COLLECTION = 'games'

function getDb(): Firestore {
  if (!db) throw new Error('Firebase db not initialized')
  return db
}

// --- Matchmaking ---

export type QueueEntry = { uid: string; displayName: string; createdAt: number }

export async function addToMatchmakingQueue(uid: string, displayName: string): Promise<void> {
  const database = getDb()
  await setDoc(doc(database, MATCHMAKING_COLLECTION, uid), {
    uid,
    displayName,
    createdAt: serverTimestamp()
  })
}

export async function removeFromMatchmakingQueue(uid: string): Promise<void> {
  const database = getDb()
  await deleteDoc(doc(database, MATCHMAKING_COLLECTION, uid))
}

export function listenMatchmakingQueue(callback: (entries: QueueEntry[]) => void): Unsubscribe {
  const database = getDb()
  const q = query(
    collection(database, MATCHMAKING_COLLECTION),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    const entries: QueueEntry[] = snap.docs
      .map((d) => {
        const data = d.data()
        const createdAt = data.createdAt?.toMillis?.()
        return { uid: data.uid, displayName: data.displayName || '', createdAt }
      })
      .filter((e): e is QueueEntry & { createdAt: number } => typeof e.createdAt === 'number')
    callback(entries)
  })
}

// --- Games ---

export type GameDoc = {
  gameState: GameState
  lastShotResult?: {
    made: boolean
    points: number
    probability: number
    baseProbability: number
    distance: number
    shotBy: 'player1' | 'player2'
    shotPosition: number
  } | null
  createdAt: number
  updatedAt: number
  /** Set when player2 joins waiting screen; countdown starts for both. */
  player2ReadyAt?: number
  gameStartsAt?: number
}

export async function createGameDoc(gameId: string, gameState: GameState): Promise<void> {
  const database = getDb()
  const now = Date.now()
  await setDoc(doc(database, GAMES_COLLECTION, gameId), {
    gameState,
    lastShotResult: null,
    createdAt: now,
    updatedAt: now
  })
}

/** Call after createGameDoc; notifies the other player so they can join. Optional fromUid/fromDisplayName for friend challenges (shows "X challenged you"). */
export async function setPendingGameForUser(
  opponentUid: string,
  gameId: string,
  fromUid?: string,
  fromDisplayName?: string
): Promise<void> {
  const database = getDb()
  const payload: Record<string, unknown> = { gameId }
  if (fromUid != null) payload.fromUid = fromUid
  if (fromDisplayName != null) payload.fromDisplayName = fromDisplayName
  await setDoc(doc(database, 'users', opponentUid, 'pendingGame', 'current'), payload)
}

/** Remove pending game after the opponent has joined or declined. */
export async function clearPendingGameForUser(uid: string): Promise<void> {
  const database = getDb()
  await deleteDoc(doc(database, 'users', uid, 'pendingGame', 'current'))
}

export type PendingGamePayload = { gameId: string; fromUid?: string; fromDisplayName?: string }

/** Listen for a game invite (Quick Match or friend challenge). Callback receives payload or null when doc is removed. */
export function listenPendingGame(
  uid: string,
  onPending: (data: PendingGamePayload | null) => void
): Unsubscribe {
  const database = getDb()
  const ref = doc(database, 'users', uid, 'pendingGame', 'current')
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onPending(null)
      return
    }
    const data = snap.data()
    if (data?.gameId) {
      onPending({
        gameId: data.gameId,
        fromUid: data.fromUid,
        fromDisplayName: data.fromDisplayName
      })
    } else {
      onPending(null)
    }
  })
}

export async function updateGameDoc(
  gameId: string,
  gameState: GameState,
  lastShotResult?: GameDoc['lastShotResult']
): Promise<void> {
  const database = getDb()
  const ref = doc(database, GAMES_COLLECTION, gameId)
  await setDoc(
    ref,
    {
      gameState,
      lastShotResult: lastShotResult ?? null,
      updatedAt: Date.now()
    },
    { merge: true }
  )
}

/** Call when player2 lands on waiting screen; sets 5s countdown for both players. Uses server timestamp so both clients see the same countdown regardless of device clock skew. */
export async function setWaitingReady(gameId: string): Promise<void> {
  const database = getDb()
  const now = Date.now()
  await setDoc(
    doc(database, GAMES_COLLECTION, gameId),
    { player2ReadyAt: serverTimestamp(), updatedAt: now },
    { merge: true }
  )
}

export function subscribeToGame(gameId: string, onUpdate: (data: GameDoc) => void): Unsubscribe {
  const database = getDb()
  return onSnapshot(doc(database, GAMES_COLLECTION, gameId), (snap) => {
    if (!snap.exists()) return
    const data = snap.data() as GameDoc
    onUpdate(data)
  })
}

export async function getGameDoc(gameId: string): Promise<GameDoc | null> {
  const database = getDb()
  const snap = await getDoc(doc(database, GAMES_COLLECTION, gameId))
  if (!snap.exists()) return null
  return snap.data() as GameDoc
}

// --- Friends ---

export type FriendRequestDoc = { fromUid: string; fromDisplayName: string; createdAt: number }
export type FriendDoc = { uid: string; displayName: string; addedAt?: number }

export async function sendFriendRequest(
  toUid: string,
  fromUid: string,
  fromDisplayName: string
): Promise<void> {
  const database = getDb()
  const ref = doc(database, 'users', toUid, 'friendRequests', fromUid)
  await setDoc(ref, {
    fromUid,
    fromDisplayName,
    createdAt: serverTimestamp()
  })
}

export async function getFriendRequests(uid: string): Promise<{ fromUid: string; fromDisplayName: string }[]> {
  const database = getDb()
  const snap = await getDocs(collection(database, 'users', uid, 'friendRequests'))
  return snap.docs.map((d) => {
    const data = d.data()
    return { fromUid: data.fromUid, fromDisplayName: data.fromDisplayName || '' }
  })
}

export async function acceptFriendRequest(
  myUid: string,
  myDisplayName: string,
  fromUid: string,
  fromDisplayName: string
): Promise<void> {
  const database = getDb()
  const batch = writeBatch(database)
  batch.set(doc(database, 'users', myUid, 'friends', fromUid), {
    uid: fromUid,
    displayName: fromDisplayName,
    addedAt: serverTimestamp()
  })
  batch.set(doc(database, 'users', fromUid, 'friends', myUid), {
    uid: myUid,
    displayName: myDisplayName,
    addedAt: serverTimestamp()
  })
  batch.delete(doc(database, 'users', myUid, 'friendRequests', fromUid))
  await batch.commit()
}

export async function declineFriendRequest(myUid: string, fromUid: string): Promise<void> {
  const database = getDb()
  await deleteDoc(doc(database, 'users', myUid, 'friendRequests', fromUid))
}

export async function getFriends(uid: string): Promise<FriendDoc[]> {
  const database = getDb()
  const snap = await getDocs(collection(database, 'users', uid, 'friends'))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      uid: data.uid,
      displayName: data.displayName || '',
      addedAt: data.addedAt?.toMillis?.()
    }
  })
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const database = getDb()
  const batch = writeBatch(database)
  batch.delete(doc(database, 'users', myUid, 'friends', friendUid))
  batch.delete(doc(database, 'users', friendUid, 'friends', myUid))
  await batch.commit()
}

export async function lookupUserByDisplayName(displayName: string): Promise<{ uid: string; displayName: string } | null> {
  const database = getDb()
  const q = displayName.trim()
  if (!q) return null
  const qLower = q.toLowerCase()
  // Prefer case-insensitive lookup via displayNameLower (set on signup/username update)
  const byLower = query(
    collection(database, 'users'),
    where('displayNameLower', '==', qLower),
    limit(1)
  )
  const snapLower = await getDocs(byLower)
  if (!snapLower.empty) {
    const d = snapLower.docs[0]
    const data = d.data()
    return { uid: d.id, displayName: data.displayName || '' }
  }
  // Fallback: exact match for existing users without displayNameLower
  const byExact = query(
    collection(database, 'users'),
    where('displayName', '==', q),
    limit(1)
  )
  const snapExact = await getDocs(byExact)
  if (snapExact.empty) return null
  const d = snapExact.docs[0]
  const data = d.data()
  return { uid: d.id, displayName: data.displayName || '' }
}

/** Check if we can send a friend request (not already friends, no pending request). */
export async function canSendFriendRequest(
  myUid: string,
  targetUid: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const database = getDb()
  const [friendSnap, requestSnap] = await Promise.all([
    getDoc(doc(database, 'users', myUid, 'friends', targetUid)),
    getDoc(doc(database, 'users', targetUid, 'friendRequests', myUid))
  ])
  if (friendSnap.exists()) return { ok: false, error: 'Already friends.' }
  if (requestSnap.exists()) return { ok: false, error: 'Friend request already sent.' }
  return { ok: true }
}

const BATCH_SIZE = 500

/** Delete all documents in a collection in batches (Firestore limit 500 per batch). */
async function deleteCollection(ref: CollectionReference): Promise<void> {
  const database = getDb()
  let snap = await getDocs(ref)
  while (!snap.empty) {
    const batch = writeBatch(database)
    const docs = snap.docs.slice(0, BATCH_SIZE)
    for (const d of docs) {
      batch.delete(d.ref)
    }
    await batch.commit()
    snap = await getDocs(ref)
  }
}

/** Permanently delete all Firestore data for a user (for account deletion). Run before Auth deleteUser(). */
export async function deleteUserFirestoreData(uid: string): Promise<void> {
  const database = getDb()
  await removeFromMatchmakingQueue(uid)
  await clearPendingGameForUser(uid)

  const friends = await getFriends(uid)
  for (const f of friends) {
    await deleteDoc(doc(database, 'users', f.uid, 'friends', uid))
  }

  await deleteCollection(collection(database, 'users', uid, 'friendRequests'))
  await deleteCollection(collection(database, 'users', uid, 'friends'))

  const gamesSnap = await getDocs(collection(database, GAMES_COLLECTION))
  const gameIdsToDelete: string[] = []
  gamesSnap.docs.forEach((d) => {
    const data = d.data() as GameDoc
    const gs = data.gameState
    if (gs?.player1?.uid === uid || gs?.player2?.uid === uid) {
      gameIdsToDelete.push(d.id)
    }
  })
  for (let i = 0; i < gameIdsToDelete.length; i += BATCH_SIZE) {
    const batch = writeBatch(database)
    const chunk = gameIdsToDelete.slice(i, i + BATCH_SIZE)
    for (const gameId of chunk) {
      batch.delete(doc(database, GAMES_COLLECTION, gameId))
    }
    await batch.commit()
  }

  await deleteDoc(doc(database, 'users', uid))
}

// --- Leaderboard ---

export type LeaderboardRow = {
  uid: string
  username: string
  wins: number
  losses: number
  winRate: number
  fgPercent: number
  threePtPercent: number
  totalGames: number
}

export async function getLeaderboard(limitCount: number = 100): Promise<LeaderboardRow[]> {
  const database = getDb()
  const q = query(
    collection(database, 'users'),
    where('stats.online.totalGames', '>=', 1),
    orderBy('stats.online.totalGames', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  const rows: LeaderboardRow[] = snap.docs.map((d) => {
    const data = d.data()
    const online: ModeStats | undefined = data.stats?.online
    if (!online) {
      return {
        uid: d.id,
        username: data.displayName || '?',
        wins: 0,
        losses: 0,
        winRate: 0,
        fgPercent: 0,
        threePtPercent: 0,
        totalGames: 0
      }
    }
    const totalGames = online.wins + online.losses
    const winRate = totalGames > 0 ? Math.round((online.wins / totalGames) * 100) : 0
    const fgPercent =
      online.shotsAttempted > 0
        ? Math.round((online.shotsMade / online.shotsAttempted) * 100)
        : 0
    const threePtPercent =
      online.threesAttempted > 0
        ? Math.round((online.threesMade / online.threesAttempted) * 100)
        : 0
    return {
      uid: d.id,
      username: data.displayName || '?',
      wins: online.wins,
      losses: online.losses,
      winRate,
      fgPercent,
      threePtPercent,
      totalGames
    }
  })
  return rows
}
