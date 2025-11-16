import { Position } from '../types/Game'

// Court positions based on the basketball court image
// Positions 1-5 are 3-point range (2 points when made)
// Positions 6-11 are 2-point range (1 point when made)
export const COURT_POSITIONS: Position[] = [
  {
    id: 1,
    x: 10,
    y: 73,
    isThreePoint: true,
    name: 'Left Corner 3',
    adjacentPositions: [2, 6]
  },
  {
    id: 2,
    x: 15,
    y: 52,
    isThreePoint: true,
    name: 'Left Wing 3',
    adjacentPositions: [1, 3, 6, 7, 8]
  },
  {
    id: 3,
    x: 35,
    y: 38,
    isThreePoint: true,
    name: 'Top of Key 3',
    adjacentPositions: [2, 4]
  },
  {
    id: 4,
    x: 55,
    y: 52,
    isThreePoint: true,
    name: 'Right Wing 3',
    adjacentPositions: [3, 5, 8, 9, 10]
  },
  {
    id: 5,
    x: 60,
    y: 73,
    isThreePoint: true,
    name: 'Right Corner 3',
    adjacentPositions: [4, 10]
  },
  {
    id: 6,
    x: 18,
    y: 73,
    isThreePoint: false,
    name: 'Left Block',
    adjacentPositions: [1, 7, 11]
  },
  {
    id: 7,
    x: 23,
    y: 55,
    isThreePoint: false,
    name: 'Left Elbow',
    adjacentPositions: [1, 2, 6, 8, 9, 11]
  },
  {
    id: 8,
    x: 35,
    y: 48,
    isThreePoint: false,
    name: 'Free Throw Line',
    adjacentPositions: [2, 4, 7, 9, 11]
  },
  {
    id: 9,
    x: 47,
    y: 55,
    isThreePoint: false,
    name: 'Right Elbow',
    adjacentPositions: [4, 5, 7, 8, 10, 11]
  },
  {
    id: 10,
    x: 52,
    y: 73,
    isThreePoint: false,
    name: 'Right Block',
    adjacentPositions: [5, 9, 11]
  },
  {
    id: 11,
    x: 35,
    y: 68,
    isThreePoint: false,
    name: 'Paint',
    adjacentPositions: [6, 7, 9, 10]
  }
]

export function getPosition(id: number): Position {
  const position = COURT_POSITIONS.find(p => p.id === id)
  if (!position) throw new Error(`Position ${id} not found`)
  return position
}

export function getDistance(pos1: number, pos2: number): number {
  const p1 = getPosition(pos1)
  const p2 = getPosition(pos2)
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

export function isAdjacent(from: number, to: number): boolean {
  const position = getPosition(from)
  return position.adjacentPositions.includes(to)
}

export function isLeftSide(positionId: number): boolean {
  // Positions 1, 2, 6, 7 are on the left side
  return [1, 2, 6, 7].includes(positionId)
}

