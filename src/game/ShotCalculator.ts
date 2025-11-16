import { Archetype, ShotResult } from '../types/Game'
import { getDistance, getPosition, isAdjacent } from './CourtPositions'

// Basket position (center of basket)
const BASKET_X = 35
const BASKET_Y = 72

// Get archetype base stats
function getArchetypeStats(archetype: Archetype): { three: number, mid: number, paint: number } {
  switch (archetype) {
    case 'shooter':
      return { three: 0.75, mid: 0.50, paint: 0.25 }
    case 'midrange':
      return { three: 0.50, mid: 0.75, paint: 0.50 }
    case 'defender':
      return { three: 0.25, mid: 0.50, paint: 0.75 }
    default:
      return { three: 0.50, mid: 0.50, paint: 0.50 }
  }
}

// Determine shot zone
function getShotZone(position: number): 'three' | 'mid' | 'paint' {
  if ([1, 2, 3, 4, 5].includes(position)) return 'three'  // 3-point positions
  if ([6, 7, 8, 9, 10].includes(position)) return 'mid'   // Mid-range
  return 'paint'  // Position 11
}

// Calculate distance from a position to the basket
function getDistanceToBasket(positionId: number): number {
  const position = getPosition(positionId)
  return Math.sqrt(Math.pow(position.x - BASKET_X, 2) + Math.pow(position.y - BASKET_Y, 2))
}

// Check if defender is "behind" the offense (one position away but further from basket)
function isDefenderBehind(offensePosition: number, defensePosition: number): boolean {
  // Must be adjacent positions
  if (!isAdjacent(offensePosition, defensePosition)) {
    return false
  }
  
  // Defense is "behind" if they are further from the basket than offense
  const offenseDist = getDistanceToBasket(offensePosition)
  const defenseDist = getDistanceToBasket(defensePosition)
  
  return defenseDist > offenseDist
}

// Calculate base probability (without contest modifiers)
function calculateBaseProbability(
  offensePosition: number,
  defensePosition: number,
  offenseArchetype: Archetype,
  defenseArchetype: Archetype
): number {
  const distance = getDistance(offensePosition, defensePosition)
  
  // Get archetype base percentage for this shot zone
  const stats = getArchetypeStats(offenseArchetype)
  const zone = getShotZone(offensePosition)
  let probability = stats[zone]
  
  // Apply distance modifiers (but not contest penalties)
  if (distance >= 25) {
    // 3+ circles away - wide open bonus
    probability += 0.15
  }
  // For distance < 25, no modifier (base stats)
  
  // Apply defensive archetype penalty if opponent is defender
  if (defenseArchetype === 'defender') {
    probability -= 0.05  // Defender archetype adds extra contest
  }
  
  // Clamp probability between 0 and 1
  return Math.max(0, Math.min(1, probability))
}

export function calculateShotProbability(
  offensePosition: number,
  defensePosition: number,
  offenseArchetype: Archetype,
  defenseArchetype: Archetype,
  defenderMoved: boolean = false
): { final: number; base: number } {
  const distance = getDistance(offensePosition, defensePosition)
  
  // Get base probability first
  let probability = calculateBaseProbability(offensePosition, defensePosition, offenseArchetype, defenseArchetype)
  const baseProbability = probability
  
  // Check if defender is behind the offense (one position away but further from basket)
  const defenderBehind = isDefenderBehind(offensePosition, defensePosition)
  
  // Apply contest modifiers based on defender distance and whether they contested
  if (distance < 15) {
    // Very close (same position or adjacent)
    if (!defenderMoved) {
      // Contest Shot - defender stayed in position
      if (defenderBehind) {
        // Defender is behind - half penalty
        probability -= 0.175  // Half of 0.35
      } else {
        probability -= 0.35
      }
    } else {
      // Defender closed out (moved to contest)
      if (defenderBehind) {
        // Defender is behind - half penalty
        probability -= 0.10  // Half of 0.20
      } else {
        probability -= 0.20
      }
    }
  } else if (distance >= 15 && distance < 25) {
    // 2 circles away - base stats (no modifier)
    probability += 0
  }
  // For distance >= 25, wide open bonus already applied in base
  
  // Clamp probability between 0 and 1
  return {
    final: Math.max(0, Math.min(1, probability)),
    base: baseProbability
  }
}

export function attemptShot(
  offensePosition: number,
  defensePosition: number,
  offenseArchetype: Archetype,
  defenseArchetype: Archetype,
  defenderMoved: boolean = false
): ShotResult {
  const { final, base } = calculateShotProbability(
    offensePosition,
    defensePosition,
    offenseArchetype,
    defenseArchetype,
    defenderMoved
  )
  
  const made = Math.random() < final
  const position = getPosition(offensePosition)
  const points = made ? (position.isThreePoint ? 2 : 1) : 0
  const distance = getDistance(offensePosition, defensePosition)
  
  return {
    made,
    points,
    probability: final,
    baseProbability: base,
    distance
  }
}

