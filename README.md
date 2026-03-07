# 🏀 THREE DRIBBLES

Turn-based, head-to-head basketball strategy. Dribble and defend across an 11-spot half-court. Make reads, bait counters, and score in three moves or less.

## Highlights
- Turn-based offense/defense with simultaneous reveal
- 11-position half-court (SVG grid), pixel-art characters and courts
- Dynamic shot animation with arc, distance-based timing, and result banner
- SFX: whistle (3PT attempts), swish (made), clank (miss) with master volume and mute
- Archetypes with distinct strengths: Mid Range, Shooter, Defender
- Modes: Local Multiplayer, Practice vs CPU (Easy/Medium/Hard), Online (menu, friends)
- Cosmetics and themes with character preview and unlock-all for testing

## Core Rules
- First to 11 points wins, must win by 2. If score reaches 30, next make wins (sudden death).
- 3PT shots = 2 points; 2PT shots = 1 point.
- Offense can dribble up to 3 times (adjacent positions). “Shoot Now” is available at any time.
- Defense picks a spot to cut off or can “Contest” by staying.
- Make it = keep the ball; Miss it = other player’s ball; positions reset: offense to 3, defense to 8.
- If defender lands on the same spot as offense, offense is “blocked” (dribble penalty).
  - Blocking from behind (adjacent but further from basket) applies half penalty.

## Archetypes
- Mid Range 🎯: Base 75% mid-range, 50% paint, 50% 3PT
- Shooter 🌟: Base 75% 3PT, 50% mid-range, 25% paint
- Defender 🛡️: Base 75% paint, 50% mid-range, 25% 3PT, plus an extra -5% to opponent’s shot chance when defending

Notes:
- These are base zone values. Final percentage applies contest/open/behind modifiers.
- The scoreboard displays FG% and 3PT% for each player and per game mode in Stats.

## CPU (Practice Mode)
Difficulty levels and archetype-aware behavior:
- Easy: 40% optimal / 60% random, avoids repeating identical openings.
- Medium: EV-based move selection with archetype bias (prefers mid/3PT/paint by archetype), variety via epsilon-greedy, mixed defensive strategies (contest, cut-off, mirror, bait).
- Hard: Depth-1 minimax EV (simulate best defense), strong archetype bias, softmax sampling for top choices, more denial of preferred zones on defense, no-repetition heuristics.

CPU flow polish:
- CPU can contest on any move (including the first).
- Status messages trimmed; UI hides while CPU auto-picks in CPU turns.

## Shot Logic & Animation
- The ball animates from shooter to basket with a parabolic arc.
- Duration is distance-based:
  - Paint: ~1.5s
  - Close: ~3.0s
  - Medium: ~3.5s
  - Far: ~4.5–5.0s (e.g., top of key)
- Missed shots hit the rim and ricochet.
- Result banner appears after animation completes (made/missed + contested %).
- SFX:
  - 3PT attempts: whistle plays at animation start
  - On completion: swish (made) or clank (miss)
- SFX respect Settings mute and master volume.

## UI & UX
- Single top scoreboard with names, archetype, scores, FG%/3PT%.
- Action controls repositioned to the right of the court, below the extended scoreboard.
- Block popup: “-1 Dribble” appears under action buttons when cut off.
- “Shoot Now” re-added: offense can force a shot after defense picks; defense UI hides during shot.
- Character/court pixel-art with refined stroke widths; Afro preserved for “Rocket”.

## Cosmetics & Themes
- Character is selected in Settings; gameplay only prompts for archetype.
- Categories: Balls, Headwear, Uniform, Armwear, Socks, Footwear, Jewelry (renamed from Chains), Eyewear (glasses/sunglasses).
- 5 items per category (except jewelry with 2). Black/white items unlocked; only orange ball to start.
- Tuxedos (black and white) cover arms/legs; red bowtie.
- Court themes: Stadium, Beach, Blacktop, High School (default), unlockable Snow and Jungle.
- “Unlock All” button for testing cosmetics and court themes.

## Online (In-Progress)
- Online menu with tabs: Play, Leaderboard, Friends.
- Leaderboard: games played, win%, FG%, 3PT%.
- Friends: search/add, accept/decline requests, unfriend, and challenge (UI wired; backend pending).
- Matchmaking and online game state via Firebase (planned).

## Settings
- System:
  - Mute toggle
  - Master volume slider (persists)
  - Username change (max 10 chars; uniqueness checks when backend enabled)
  - Delete account (backend integration pending)
- Stats tab: breakdown by mode (Local, Practice Easy/Medium/Hard, Online)
- Shop tab (placeholder for future content)

## Tech
- React + TypeScript + Vite
- State: React Context (Auth, Game, Settings)
- Graphics: SVG; pixel-art characters and courts
- Animation: requestAnimationFrame
- SFX: WebAudio procedural sounds (no large assets)
- Backend (planned/partial): Firebase Auth, Firestore, Realtime Database

## Development

Prerequisites:
- Node.js 16+
- npm

Install and run:
```bash
npm install
npm run dev
```
Open http://localhost:3000

Build:
```bash
npm run build
npm run preview
```

Optional Firebase setup (for auth/online):
1) Create a Firebase project  
2) Enable Auth, Firestore, Realtime Database  
3) Copy `.env.example` to `.env.local` and fill in the Firebase values from your project settings (or leave empty to run without Firebase).  
   `.env.local` is gitignored and must not be committed.

## Project Structure
```
src/
├── audio/            # WebAudio SFX manager
├── components/       # UI components (Court, PixelCharacter, etc.)
├── contexts/         # Auth, Game, Settings contexts
├── firebase/         # Firebase config (optional)
├── game/             # Core game logic (CPU, Engine, Positions, Shots)
├── screens/          # Screens (Home, Game, Settings, Online, etc.)
├── types/            # Type definitions
└── main.tsx          # Entry
```

## License
MIT

## Credits
Created with ❤️ by Drew