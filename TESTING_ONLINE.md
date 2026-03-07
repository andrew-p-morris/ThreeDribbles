# Testing Online Mode

Use these steps to verify that online features work end-to-end. You need **two different user accounts** and **two devices or two browser profiles** (e.g. Chrome + Safari, or two Chrome profiles).

## Prerequisites

1. **Firebase**: Auth and Firestore are enabled; your app uses the project in `src/firebase/config.ts`.
2. **Firestore indexes**: On first run, Firestore may show errors with a link to create indexes. Create them when prompted:
   - **Matchmaking**: `matchmakingQueue` collection, field `createdAt` (ascending).
   - **Leaderboard**: `users` collection, `stats.online.totalGames` (>= 1, descending).
3. **Firestore rules**: Ensure your rules allow:
   - Read/write `matchmakingQueue`, `games`.
   - Read/write `users/{uid}`, `users/{uid}/friendRequests`, `users/{uid}/friends`, `users/{uid}/pendingGame`.
   - (Exact rules depend on your security model; at minimum the authenticated user can read/write their own data and the collections used by the app.)

## 1. Run the app

- From the project root: `npm run dev`.
- Open the app in **two** places (e.g. `http://localhost:3001` in two browsers or one browser + one phone on the same Wi‑Fi using your machine’s LAN IP, e.g. `http://192.168.1.x:3001`).

## 2. Two accounts

- **Device / tab 1**: Sign up or sign in as **User A** (e.g. username `PlayerA`).
- **Device / tab 2**: Sign up or sign in as **User B** (e.g. username `PlayerB`).

## 3. Quick Match

- **User A**: Home → Online → Play → **Quick Match**. You should see “Finding opponent...”.
- **User B**: Home → Online → Play → **Quick Match**. You should see “Finding opponent...”.
- Within a few seconds both should be taken to the **game screen** (one as player 1, one as player 2).
- **Play a full game**: take turns (offense: dribble or shoot; defense: pick a spot or contest). Confirm:
  - Only the player whose turn it is can tap the court / use controls.
  - The other sees messages like “Opponent is choosing…”.
  - After each move, the other client updates (score, possession, turn).
  - When the game ends, both see the winner and final score.
- **Leaderboard**: One or both go back to Home → Online → **Leaderboard**. You should see both users with updated online stats (wins/losses, win %, etc.) after at least one completed game.

## 4. Leaderboard

- **Before any online games**: Leaderboard tab may show “No online players yet. Play a Quick Match to appear here!”.
- **After at least one completed online game**: Both players should appear with online W–L, Win %, FG %, 3PT %. Try changing “Sort by” (Wins, Win %, FG %, 3PT %) and confirm the list re-sorts.

## 5. Friends (Add Friend, Requests, Your Friends)

- **User B** (or A): Note the **exact** username of the other (e.g. `PlayerA`). Username is case-sensitive.
- **User A**: Online → **Friends** → type `PlayerB` → **Add Friend**. You should see “Friend request sent to PlayerB!”.
- **User B**: Online → **Friends**. Under **Friend Requests** you should see `PlayerA` with Accept / Decline.
- **User B**: Click **Accept**. `PlayerA` should move to **Your Friends** and disappear from requests.
- **User A**: Refresh or re-open Friends. **Your Friends** should list `PlayerB`.
- **Add Friend validations** (optional):
  - Search for a username that doesn’t exist → “Player not found.”
  - Search for your own username → “You can’t add yourself.”
  - Send a request again to the same user → “Friend request already sent.” (or “Already friends.” if you already accepted.)
- **Unfriend**: From **Your Friends**, click **Unfriend** for the other user. They should disappear from the list on both sides after a refresh.

## 6. Challenge (stub)

- From **Your Friends**, click **Challenge** for a friend. You should see an alert that the challenge feature is coming soon; no backend call yet.

## 7. Quit and re-join

- From the game screen, **Quit** returns to Home. Quick Match again with both users and confirm you can play another full game and that leaderboard/friends still behave as above.

## Troubleshooting

- **“Failed to join queue” / “Failed to create game”**: Check the browser console and Firestore rules; ensure `matchmakingQueue` and `games` are writable by authenticated users.
- **Leaderboard empty or “Failed to load leaderboard”**: Create the Firestore index for `users` with `stats.online.totalGames` (>= 1, orderBy desc). Ensure at least one online game has been **finished** so `stats.online` exists.
- **Friend request / accept / decline not updating**: Check `users/{uid}/friendRequests` and `users/{uid}/friends` in the Firestore console; ensure rules allow read/write for the authenticated user.
- **Game screen stuck on “Loading game...”**: Confirm the game doc was created under `games` and that the client can read it. Check for errors in the console when `startOnlineGameFromFirestore` runs.
- **Moves not syncing**: Confirm both clients are subscribed to the same `games/{gameId}` doc and that `updateGameDoc` is being called (check network tab or Firestore console for writes).

Once these pass, Quick Match, leaderboard, friends (add/accept/decline/unfriend), and full online game flow are working.
