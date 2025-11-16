export type CourtThemeId = 'highschool' | 'stadium' | 'beach' | 'blacktop' | 'snow_court' | 'jungle_court'

export type CourtTheme = {
  name: string
  emoji: string
  courtColor: string
  lineColor: string
  backgroundColor: string
  grainColor: string
  locked?: boolean
}

export const COURT_THEME_DATA: Record<CourtThemeId, CourtTheme> = {
  highschool: {
    name: 'High School',
    emoji: '🏫',
    courtColor: '#C19A6B',
    lineColor: '#000',
    backgroundColor: '#2d1810',
    grainColor: '#A0826D'
  },
  stadium: {
    name: 'Stadium',
    emoji: '🏟️',
    courtColor: '#8B4513',
    lineColor: '#FFD700',
    backgroundColor: '#1a1a2e',
    grainColor: '#6B3410'
  },
  beach: {
    name: 'Beach',
    emoji: '🏖️',
    courtColor: '#F4D03F',
    lineColor: '#0077BE',
    backgroundColor: '#87CEEB',
    grainColor: '#D4B830'
  },
  blacktop: {
    name: 'Blacktop',
    emoji: '🛣️',
    courtColor: '#2C2C2C',
    lineColor: '#FFFFFF',
    backgroundColor: '#0f0f0f',
    grainColor: '#1a1a1a'
  },
  snow_court: {
    name: 'Snow Court',
    emoji: '❄️',
    courtColor: '#E8F4F8',
    lineColor: '#003366',
    backgroundColor: '#B0D4E3',
    grainColor: '#D0E8F0',
    locked: true
  },
  jungle_court: {
    name: 'Jungle Court',
    emoji: '🌴',
    courtColor: '#228B22',
    lineColor: '#8B4513',
    backgroundColor: '#0a4a0a',
    grainColor: '#1a6b1a',
    locked: true
  }
}
