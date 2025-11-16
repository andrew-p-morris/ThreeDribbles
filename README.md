# 🏀 3 Dribbles - Basketball Strategy Game

A turn-based basketball strategy game where players compete to score 11 points by strategically dribbling through positions on the court while defenders try to contest shots.

## Game Rules

1. **Objective**: First player to 11 points wins
2. **Turns**: Each possession, the offense gets 3 dribbles before taking a shot
3. **Movement**: Players can only move to adjacent positions on the court
4. **Scoring**: 
   - 3-point shots (beyond the arc) = 2 points
   - 2-point shots (inside the arc) = 1 point
5. **Shot Success**: Based on defender distance
   - 2+ squares away (open): 75% chance
   - 1 square away (slightly open): 50% chance
   - 0 squares (contested): 0% chance

## Archetypes

- **Mid Range** 🎯: 75% mid-range, 50% paint, 50% 3PT (base zones)
- **Shooter** 🌟: 75% 3PT, 50% mid-range, 25% paint (base zones)
- **Defender** 🛡️: 75% paint, 50% mid-range, 25% 3PT (base zones) and applies an extra -5% to opponent shot chance when defending

Notes:
- Percentages are base zone values before contest/open/behind modifiers.
- 3PT made shots count as 2 points; 2PT made shots count as 1 point.

## Game Modes

- **Local Multiplayer**: Pass-and-play on the same device
- **vs Computer**: Three difficulty levels (Easy, Medium, Hard)
- **Online**: (Coming soon) Play against opponents online

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase (optional, for authentication and online play):
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication, Firestore, and Realtime Database
   - Copy your Firebase config to `src/firebase/config.ts`

3. Run the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Playing Without Firebase

The game will work locally without Firebase configuration for:
- Local multiplayer mode
- vs Computer mode

To use authentication and online features, you'll need to set up Firebase.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Custom CSS
- **Backend**: Firebase (Authentication, Firestore, Realtime Database)
- **Routing**: React Router

## Project Structure

```
src/
├── components/      # Reusable UI components (Court, etc.)
├── contexts/        # React contexts (Auth, Game)
├── firebase/        # Firebase configuration
├── game/            # Core game logic
│   ├── AI.ts           # AI opponent logic
│   ├── CourtPositions.ts  # Court layout and positions
│   ├── GameEngine.ts    # Game state management
│   └── ShotCalculator.ts  # Shot probability calculations
├── screens/         # Main app screens
├── types/           # TypeScript type definitions
└── main.tsx         # App entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Future Features

- [ ] Online multiplayer with matchmaking
- [ ] Global leaderboards
- [ ] Tournament mode
- [ ] More archetypes
- [ ] Custom court themes
- [ ] Shot animations and sound effects
- [ ] Mobile app (iOS/Android) via Capacitor

## License

MIT

## Credits

Created with ❤️ by Drew



