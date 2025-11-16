import { GameState, Archetype } from '../types/Game'
import { getPosition, getDistance } from './CourtPositions'
import { calculateShotProbability } from './ShotCalculator'

// ---- Utility helpers for stochastic choice and scoring ----
function argmaxRandom<T>(items: T[], scoreFn: (t: T) => number): T {
	let best: T | null = null
	let bestScore = -Infinity
	let ties: T[] = []
	for (const it of items) {
		const s = scoreFn(it)
		if (s > bestScore) {
			bestScore = s
			best = it
			ties = [it]
		} else if (s === bestScore) {
			ties.push(it)
		}
	}
	return ties[Math.floor(Math.random() * ties.length)]
}

function softmaxSample<T>(items: T[], scoreFn: (t: T) => number, temperature = 0.15): T {
	const scores = items.map(scoreFn)
	const max = Math.max(...scores)
	const exps = scores.map(s => Math.exp((s - max) / Math.max(temperature, 0.0001)))
	const sum = exps.reduce((a, b) => a + b, 0)
	let r = Math.random() * sum
	for (let i = 0; i < items.length; i++) {
		r -= exps[i]
		if (r <= 0) return items[i]
	}
	return items[items.length - 1]
}

function pointsForPosition(posId: number): number {
	const pos = getPosition(posId)
	return pos.isThreePoint ? 2 : 1
}

function evaluateShotEV(
	offensePos: number,
	defensePos: number,
	offenseArchetype: Archetype,
	defenseArchetype: Archetype,
	defenderMoved: boolean
): number {
	const { final } = calculateShotProbability(offensePos, defensePos, offenseArchetype, defenseArchetype, defenderMoved)
	return final * pointsForPosition(offensePos)
}

function simulateBestDefenseEV(
	offensePos: number,
	currentDefensePos: number,
	offenseArchetype: Archetype,
	defenseArchetype: Archetype
): number {
	const defPosition = getPosition(currentDefensePos)
	const defenseOptions = [...defPosition.adjacentPositions, currentDefensePos]
	let worst = Infinity
	for (const defMove of defenseOptions) {
		const defenderMoved = defMove !== currentDefensePos
		const ev = evaluateShotEV(offensePos, defMove, offenseArchetype, defenseArchetype, defenderMoved)
		if (ev < worst) worst = ev
	}
	return worst
}

// Track small anti-repetition memory per-session
const recentAIMoves: { offense: number[]; defense: number[] } = { offense: [], defense: [] }
function rememberMove(isOffense: boolean, move: number) {
	const arr = isOffense ? recentAIMoves.offense : recentAIMoves.defense
	arr.push(move)
	if (arr.length > 3) arr.shift()
}
function repetitionPenalty(isOffense: boolean, move: number): number {
	const arr = isOffense ? recentAIMoves.offense : recentAIMoves.defense
	return arr.includes(move) ? -0.05 : 0
}

// Archetype biases: encourage archetype-preferred zones
function archetypeZoneBias(archetype: Archetype, posId: number): number {
	const pos = getPosition(posId)
	switch (archetype) {
		case 'shooter':
			return pos.isThreePoint ? 0.10 : (posId === 11 ? -0.05 : 0)
		case 'midrange':
			if (posId === 11) return -0.02
			return pos.isThreePoint ? -0.02 : 0.08
		case 'defender':
			if (posId === 11) return 0.10
			return pos.isThreePoint ? -0.03 : 0.04
		default:
			return 0
	}
}

export function getAIMove(
	gameState: GameState,
	isOffense: boolean
): number {
	const difficulty = gameState.aiDifficulty || 'medium'
	
	switch (difficulty) {
		case 'easy':
			return getEasyMove(gameState, isOffense)
		case 'medium':
			return getMediumMove(gameState, isOffense)
		case 'hard':
			return getHardMove(gameState, isOffense)
		default:
			return getMediumMove(gameState, isOffense)
	}
}

// Easy AI - 40% optimal, 60% random
function getEasyMove(gameState: GameState, isOffense: boolean): number {
	// 40% of the time, play optimally
	if (Math.random() < 0.4) {
		return getMediumMove(gameState, isOffense)
	}
	
	// 60% of the time, play randomly
	const currentPos = isOffense 
		? gameState.player2.currentPosition 
		: gameState.player2.currentPosition
	
	const position = getPosition(currentPos)
	const validMoves = position.adjacentPositions
	
	const choice = validMoves[Math.floor(Math.random() * validMoves.length)]
	rememberMove(isOffense, choice)
	return choice
}

// Medium AI - Good strategy, some mistakes
function getMediumMove(gameState: GameState, isOffense: boolean): number {
	if (isOffense) {
		// Consider Shoot Now and dribbles; EV under best defense with archetype bias
		const offPos = gameState.player2.currentPosition
		const defPos = gameState.player1.currentPosition
		const pos = getPosition(offPos)
		const moves = [...pos.adjacentPositions]
		const candidates: number[] = [-1, ...moves]

		const scored = candidates.map(move => {
			const targetPos = move === -1 ? offPos : move
			let ev = simulateBestDefenseEV(
				targetPos,
				defPos,
				gameState.player2.archetype,
				gameState.player1.archetype
			)
			ev += archetypeZoneBias(gameState.player2.archetype, targetPos)
			ev += repetitionPenalty(true, targetPos)
			return { move, ev }
		})

		const epsilon = 0.25
		let chosen: number
		if (Math.random() < epsilon) {
			chosen = scored[Math.floor(Math.random() * scored.length)].move
		} else {
			chosen = argmaxRandom(scored, s => s.ev).move
		}
		rememberMove(true, chosen === -1 ? offPos : chosen)
		return chosen
	} else {
		// Mixed defensive strategy with capped contest-first
		const offPos = gameState.player1.currentPosition
		const defPos = gameState.player2.currentPosition
		const defP = getPosition(defPos)
		const options = [...defP.adjacentPositions, defPos]

		// Predict likely offense move
		const offAdj = getPosition(offPos).adjacentPositions
		let predicted = offPos
		let best = -Infinity
		for (const om of offAdj) {
			const ev = simulateBestDefenseEV(om, defPos, gameState.player1.archetype, gameState.player2.archetype)
			if (ev > best) {
				best = ev
				predicted = om
			}
		}

		const weights = new Map<number, number>()
		for (const m of options) weights.set(m, 0.0001)
		// Contest
		if (options.includes(defPos)) {
			weights.set(defPos, (weights.get(defPos) || 0) + 0.35)
		}
		// Cut-off predicted
		let cutoffBest: number | null = null
		let cutoffDist = Infinity
		for (const m of options) {
			const d = getDistance(predicted, m)
			if (d < cutoffDist) {
				cutoffDist = d
				cutoffBest = m
			}
		}
		if (cutoffBest !== null) {
			weights.set(cutoffBest, (weights.get(cutoffBest) || 0) + 0.35)
		}
		// Mirror
		for (const m of options) {
			const d = getDistance(offPos, m)
			const add = 0.25 * (1 / Math.max(d, 1))
			weights.set(m, (weights.get(m) || 0) + add)
		}
		// Bait (steer to lower EV zones)
		for (const m of options) {
			const bait = -0.5 * archetypeZoneBias(gameState.player1.archetype, m)
			weights.set(m, (weights.get(m) || 0) + Math.max(0, bait))
		}
		// Anti-repetition
		for (const m of options) {
			weights.set(m, (weights.get(m) || 0) + repetitionPenalty(false, m))
		}

		const moves = Array.from(weights.keys())
		const selected = softmaxSample(moves, m => weights.get(m) || 0, 0.3)
		rememberMove(false, selected)
		return selected
	}
}

// Hard AI - Optimal play with predictive logic
function getHardMove(gameState: GameState, isOffense: boolean): number {
	if (isOffense) {
		const offPos = gameState.player2.currentPosition
		const defPos = gameState.player1.currentPosition
		const pos = getPosition(offPos)
		const moves = [...pos.adjacentPositions]
		const candidates: number[] = [-1, ...moves]

		const scored = candidates.map(move => {
			const targetPos = move === -1 ? offPos : move
			let ev = simulateBestDefenseEV(
				targetPos,
				defPos,
				gameState.player2.archetype,
				gameState.player1.archetype
			)
			ev += 1.5 * archetypeZoneBias(gameState.player2.archetype, targetPos)
			ev += 1.2 * repetitionPenalty(true, targetPos)
			return { move, ev }
		})

		const chosen = softmaxSample(scored, s => s.ev, 0.12).move
		rememberMove(true, chosen === -1 ? offPos : chosen)
		return chosen
	} else {
		// Stronger defensive prediction and mixing
		const offPos = gameState.player1.currentPosition
		const defPos = gameState.player2.currentPosition
		const defP = getPosition(defPos)
		const options = [...defP.adjacentPositions, defPos]

		const offAdj = getPosition(offPos).adjacentPositions
		let predicted = offPos
		let best = -Infinity
		for (const om of offAdj) {
			const ev = simulateBestDefenseEV(om, defPos, gameState.player1.archetype, gameState.player2.archetype)
			if (ev > best) {
				best = ev
				predicted = om
			}
		}

		const weights = new Map<number, number>()
		for (const m of options) weights.set(m, 0.0001)
		// Contest baseline
		weights.set(defPos, (weights.get(defPos) || 0) + 0.30)
		// Cut-off predicted more strongly
		let cutoffBest: number | null = null
		let cutoffDist = Infinity
		for (const m of options) {
			const d = getDistance(predicted, m)
			if (d < cutoffDist) {
				cutoffDist = d
				cutoffBest = m
			}
		}
		if (cutoffBest !== null) weights.set(cutoffBest, (weights.get(cutoffBest) || 0) + 0.45)
		// Mirror pressure
		for (const m of options) {
			const d = getDistance(offPos, m)
			const add = 0.20 * (1 / Math.max(d, 1))
			weights.set(m, (weights.get(m) || 0) + add)
		}
		// Deny preferred zones of offense archetype
		for (const m of options) {
			const deny = 0.6 * (-archetypeZoneBias(gameState.player1.archetype, m))
			weights.set(m, (weights.get(m) || 0) + Math.max(0, deny))
		}
		// Anti-repetition
		for (const m of options) {
			weights.set(m, (weights.get(m) || 0) + 1.0 * repetitionPenalty(false, m))
		}

		const moves = Array.from(weights.keys())
		const selected = softmaxSample(moves, m => weights.get(m) || 0, 0.10)
		rememberMove(false, selected)
		return selected
	}
}
