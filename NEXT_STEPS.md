# Next steps – Three Dribbles

Use this as your single checklist. I'll keep it updated as we go.

---

## Immediate (do first)

- [ ] **Firebase env** – Copy `.env.example` → `.env.local` and fill in values from [Firebase Console](https://console.firebase.google.com) (Project **ThreeDribbles**). If you hit auth errors, see `FIREBASE_AUTH_FIX.md`.
- [ ] **Firestore indexes** – After first run, create any indexes Firestore suggests (e.g. `matchmakingQueue` by `createdAt`, `users` by `stats.online.totalGames`). See `TESTING_ONLINE.md` § Prerequisites.
- [ ] **Firestore rules** – Allow read/write for `matchmakingQueue`, `games`, and `users/{uid}` (and subcollections: `friendRequests`, `friends`, `pendingGame`) for authenticated users.
- [ ] **Test online with two accounts** – Two browsers or devices, follow `TESTING_ONLINE.md`: Quick Match, Leaderboard, Friends (add/accept/decline/unfriend), **Challenge** (Accept/Decline), full game flow. Confirm moves sync and stats update.

---

## Short-term (next features)

- [ ] **Online rematch** – In `GameScreen.tsx` there's a TODO: "In online mode, send rematch request." Implement: after game end, offer Rematch; on accept, create a new game and send pending invite to the other player (reuse `setPendingGameForUser` / `listenPendingGame`).
- [ ] **Delete account** – Wire Settings "Delete account" to Firebase (delete user doc, clear Auth account). README notes "backend integration pending."
- [ ] **Update TESTING_ONLINE.md** – Challenge from friend is already wired (create game → `setPendingGameForUser` → Accept/Decline). Change section 6 from "stub" to real flow and remove the "coming soon" alert note if it's still in the doc.

---

## Later (when you're ready)

- [ ] **Username uniqueness** – README says "uniqueness checks when backend enabled." Confirm Firestore rules and `updateUsername` / `checkUsernameAvailable` enforce uniqueness (e.g. `displayNameLower`).
- [ ] **Shop / Stripe** – Settings has "Buy coins" placeholder ("Stripe coming soon"). When you add payments, wire Stripe and update `COSTS.md` with fee notes.
- [ ] **Deploy** – Build (`npm run build`) and host (e.g. Firebase Hosting, Vercel). Add your production URL to Firebase Auth authorized domains and track hosting in `COSTS.md`.

---

## Reference

- **Auth / API key issues** → `FIREBASE_AUTH_FIX.md`
- **How to test online** → `TESTING_ONLINE.md`
- **Costs and limits** → `COSTS.md`
