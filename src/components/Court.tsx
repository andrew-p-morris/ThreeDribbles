import { Position, Archetype } from '../types/Game'
import { CHARACTERS } from '../types/Character'
import { CourtPixelCharacter } from './PixelCharacter'
import { EquippedCosmetics, getCosmeticById } from '../types/Cosmetics'
import { useSettings, COURT_THEME_DATA } from '../contexts/SettingsContext'
import './Court.css'

type CourtProps = {
  positions: Position[]
  offensePosition: number
  defensePosition: number
  onPositionClick: (positionId: number) => void
  highlightedPositions: number[]
  shotAnimation?: { from: { x: number, y: number }, show: boolean } | null
  ballPosition?: { x: number, y: number } | null
  player1Score: number
  player2Score: number
  shotResult?: { made: boolean, points: number, probability: number, baseProbability: number, distance: number } | null
  player1CharacterId?: string
  player2CharacterId?: string
  isPlayer1Offense: boolean
  player1Archetype: Archetype
  player2Archetype: Archetype
  showBlockIndicator?: boolean
  player1Cosmetics?: EquippedCosmetics
  player2Cosmetics?: EquippedCosmetics
  hidePositionMarkers?: boolean
}

function Court({
  positions,
  offensePosition,
  defensePosition,
  onPositionClick,
  highlightedPositions,
  shotAnimation,
  ballPosition,
  player1Score,
  player2Score,
  shotResult,
  player1CharacterId,
  player2CharacterId,
  isPlayer1Offense,
  player1Archetype,
  player2Archetype,
  showBlockIndicator,
  player1Cosmetics,
  player2Cosmetics,
  hidePositionMarkers = false
}: CourtProps) {
  const basketX = 35
  const basketY = 72
  const basketRadius = 2.5 // Increased from 1.5
  
  const { courtTheme } = useSettings()
  const theme = COURT_THEME_DATA[courtTheme]
  
  const player1Character = CHARACTERS.find(c => c.id === player1CharacterId) || CHARACTERS[0]
  const player2Character = CHARACTERS.find(c => c.id === player2CharacterId) || CHARACTERS[1]
  
  const offenseCharacter = isPlayer1Offense ? player1Character : player2Character
  const defenseCharacter = isPlayer1Offense ? player2Character : player1Character
  
  // Get ball color from offense player's cosmetics
  const offenseCosmetics = isPlayer1Offense ? player1Cosmetics : player2Cosmetics
  const ballCosmetic = offenseCosmetics?.balls ? getCosmeticById(offenseCosmetics.balls) : null
  const ballColor = ballCosmetic?.colors.primary || '#ff6b35'
  
  return (
    <div className="court-container">
      <svg viewBox="0 0 70 80" className="court-svg" style={{ background: theme.backgroundColor }}>
        {/* Theme-specific decorations/fans */}
        {courtTheme === 'beach' && (
          <>
            {/* Palm trees */}
            <rect x="2" y="15" width="1.2" height="6" fill="#8B4513" stroke="#000" strokeWidth="0.15" />
            <circle cx="2.6" cy="14.5" r="2" fill="#228B22" stroke="#000" strokeWidth="0.2" />
            
            <rect x="91" y="20" width="1.2" height="6" fill="#8B4513" stroke="#000" strokeWidth="0.15" />
            <circle cx="91.6" cy="19.5" r="2" fill="#228B22" stroke="#000" strokeWidth="0.2" />
            
            {/* Beach umbrella */}
            <line x1="3" y1="55" x2="3" y2="60" stroke="#8B4513" strokeWidth="0.3" />
            <path d="M 1 55 Q 3 53 5 55" fill="#ff6b35" stroke="#000" strokeWidth="0.2" />
            
            {/* Surfboard */}
            <rect x="90" y="50" width="2.5" height="0.8" fill="#00ccff" stroke="#000" strokeWidth="0.2" rx="0.4" />
            
            {/* Beach ball */}
            <circle cx="3" cy="35" r="1" fill="#ff0000" stroke="#000" strokeWidth="0.15" />
            <path d="M 2 35 Q 3 34 4 35" stroke="#fff" strokeWidth="0.15" fill="none" />
            <path d="M 3 34 L 3 36" stroke="#0000ff" strokeWidth="0.15" />
          </>
        )}
        
        {courtTheme === 'stadium' && (
          <>
            {/* Stadium lights */}
            <rect x="2" y="10" width="1" height="4" fill="#555" stroke="#000" strokeWidth="0.2" />
            <circle cx="2.5" cy="9.5" r="1.2" fill="#FFD700" stroke="#000" strokeWidth="0.2" opacity="0.8" />
            
            <rect x="92" y="10" width="1" height="4" fill="#555" stroke="#000" strokeWidth="0.2" />
            <circle cx="92.5" cy="9.5" r="1.2" fill="#FFD700" stroke="#000" strokeWidth="0.2" opacity="0.8" />
            
            {/* Championship banners */}
            <rect x="2" y="25" width="3" height="4" fill="#0066ff" stroke="#000" strokeWidth="0.2" />
            <text x="3.5" y="27.5" textAnchor="middle" fill="#FFD700" fontSize="1.5" fontWeight="bold">1</text>
            
            <rect x="90" y="30" width="3" height="4" fill="#ff0000" stroke="#000" strokeWidth="0.2" />
            <text x="91.5" y="32.5" textAnchor="middle" fill="#FFD700" fontSize="1.5" fontWeight="bold">2</text>
            
            {/* Jumbotron */}
            <rect x="66" y="8" width="8" height="5" fill="#1a1a1a" stroke="#FFD700" strokeWidth="0.3" />
            <rect x="67" y="9" width="6" height="3" fill="#003300" />
          </>
        )}
        
        {courtTheme === 'blacktop' && (
          <>
            {/* Chain link fence */}
            <line x1="1" y1="10" x2="6" y2="15" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            <line x1="1" y1="15" x2="6" y2="10" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            <line x1="1" y1="30" x2="6" y2="35" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            <line x1="1" y1="35" x2="6" y2="30" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            
            <line x1="89" y1="10" x2="94" y2="15" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            <line x1="89" y1="15" x2="94" y2="10" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            <line x1="89" y1="30" x2="94" y2="35" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            <line x1="89" y1="35" x2="94" y2="30" stroke="#888" strokeWidth="0.2" opacity="0.5" />
            
            {/* Graffiti/street art */}
            <rect x="2" y="22" width="3" height="3" fill="#ff0000" stroke="#000" strokeWidth="0.2" opacity="0.7" />
            <text x="3.5" y="24.5" textAnchor="middle" fill="#000" fontSize="1.5" fontWeight="bold">B</text>
            
            {/* Boom box */}
            <rect x="90" y="45" width="3" height="2" fill="#333" stroke="#000" strokeWidth="0.2" />
            <circle cx="91" cy="46" r="0.5" fill="#555" stroke="#000" strokeWidth="0.1" />
            <circle cx="92" cy="46" r="0.5" fill="#555" stroke="#000" strokeWidth="0.1" />
          </>
        )}
        
        {courtTheme === 'highschool' && (
          <>
            {/* Bleachers (empty) */}
            <rect x="1" y="15" width="5" height="0.5" fill="#8B4513" stroke="#000" strokeWidth="0.1" />
            <rect x="1" y="20" width="5" height="0.5" fill="#8B4513" stroke="#000" strokeWidth="0.1" />
            <rect x="1" y="25" width="5" height="0.5" fill="#8B4513" stroke="#000" strokeWidth="0.1" />
            
            <rect x="89" y="15" width="5" height="0.5" fill="#8B4513" stroke="#000" strokeWidth="0.1" />
            <rect x="89" y="20" width="5" height="0.5" fill="#8B4513" stroke="#000" strokeWidth="0.1" />
            <rect x="89" y="25" width="5" height="0.5" fill="#8B4513" stroke="#000" strokeWidth="0.1" />
            
            {/* School banner */}
            <rect x="2" y="35" width="4" height="3" fill="#003366" stroke="#000" strokeWidth="0.2" />
            <text x="4" y="37" textAnchor="middle" fill="#FFD700" fontSize="1.2" fontWeight="bold">GO</text>
            
            {/* Trophy case */}
            <rect x="90" y="50" width="3" height="4" fill="#8B4513" stroke="#000" strokeWidth="0.2" />
            <text x="91.5" y="52.5" textAnchor="middle" fill="#FFD700" fontSize="2">🏆</text>
            
            {/* Basketball rack */}
            <circle cx="2.5" cy="55" r="0.8" fill="#ff6b35" stroke="#000" strokeWidth="0.15" />
            <circle cx="4" cy="55" r="0.8" fill="#ff6b35" stroke="#000" strokeWidth="0.15" />
          </>
        )}
        
        {courtTheme === 'snow_court' && (
          <>
            {/* Snowman */}
            <circle cx="3" cy="25" r="1.5" fill="#ffffff" stroke="#000" strokeWidth="0.2" />
            <circle cx="3" cy="22" r="1" fill="#ffffff" stroke="#000" strokeWidth="0.2" />
            <circle cx="2.7" cy="21.7" r="0.2" fill="#000" />
            <circle cx="3.3" cy="21.7" r="0.2" fill="#000" />
            
            {/* Snow trees */}
            <path d="M 91 20 L 89 25 L 93 25 Z" fill="#228B22" stroke="#000" strokeWidth="0.2" />
            <path d="M 91 17 L 89.5 21 L 92.5 21 Z" fill="#ffffff" stroke="#000" strokeWidth="0.2" />
            <rect x="90.5" y="25" width="1" height="3" fill="#8B4513" stroke="#000" strokeWidth="0.15" />
            
            {/* Snowflakes */}
            <text x="2" y="12" fill="#ffffff" fontSize="2" opacity="0.7">❄</text>
            <text x="92" y="35" fill="#ffffff" fontSize="2" opacity="0.7">❄</text>
            <text x="4" y="50" fill="#ffffff" fontSize="1.5" opacity="0.6">❄</text>
            
            {/* Ice skates */}
            <rect x="91" y="50" width="2" height="0.5" fill="#003366" stroke="#000" strokeWidth="0.15" />
            <line x1="91" y1="50.5" x2="90" y2="51.5" stroke="#888" strokeWidth="0.2" />
          </>
        )}
        
        {courtTheme === 'jungle_court' && (
          <>
            {/* Jungle trees */}
            <rect x="2" y="18" width="1.5" height="8" fill="#8B4513" stroke="#000" strokeWidth="0.15" />
            <circle cx="2.7" cy="17" r="2.5" fill="#228B22" stroke="#000" strokeWidth="0.2" />
            <circle cx="1.5" cy="18" r="1.5" fill="#1a6b1a" stroke="#000" strokeWidth="0.15" />
            
            <rect x="91" y="22" width="1.5" height="7" fill="#8B4513" stroke="#000" strokeWidth="0.15" />
            <circle cx="91.7" cy="21" r="2.5" fill="#228B22" stroke="#000" strokeWidth="0.2" />
            
            {/* Vines */}
            <path d="M 3 8 Q 4 12 3 16" stroke="#1a6b1a" strokeWidth="0.4" fill="none" />
            <circle cx="3" cy="10" r="0.5" fill="#228B22" />
            <circle cx="3" cy="14" r="0.5" fill="#228B22" />
            
            {/* Tropical plants */}
            <path d="M 91 45 L 89.5 47 L 92.5 47 Z" fill="#228B22" stroke="#000" strokeWidth="0.2" />
            <path d="M 91 47 L 89.5 49 L 92.5 49 Z" fill="#1a6b1a" stroke="#000" strokeWidth="0.2" />
            
            {/* Tiki torch */}
            <rect x="2.5" y="48" width="0.5" height="6" fill="#8B4513" stroke="#000" strokeWidth="0.15" />
            <path d="M 2 48 L 2.75 46 L 3.5 48" fill="#ff6600" stroke="#ff3300" strokeWidth="0.15" />
          </>
        )}
        
        {/* Court surface */}
        <rect x="8" y="5" width="54" height="70" fill={theme.courtColor} rx="0" />
        
        {/* Surface texture (grain/cracks) */}
        <rect x="8" y="5" width="54" height="1.5" fill={theme.grainColor} opacity="0.3" />
        <rect x="8" y="15" width="54" height="1" fill={theme.grainColor} opacity="0.2" />
        <rect x="8" y="30" width="54" height="1.5" fill={theme.grainColor} opacity="0.25" />
        <rect x="8" y="45" width="54" height="1" fill={theme.grainColor} opacity="0.2" />
        <rect x="8" y="60" width="54" height="1.5" fill={theme.grainColor} opacity="0.3" />
        
        {/* Court border */}
        <rect x="8" y="5" width="54" height="70" stroke={theme.lineColor} strokeWidth="0.5" fill="none" rx="0" />
        
        {/* Half court line */}
        <line x1="8" y1="20" x2="62" y2="20" stroke={theme.lineColor} strokeWidth="0.4" />
        
        {/* Center circle */}
        <circle cx="35" cy="20" r="8" stroke={theme.lineColor} strokeWidth="0.4" fill="none" />
        
        {/* Three-point line */}
        <path
          d="M 12 75 Q 12 42, 35 42 Q 58 42, 58 75"
          stroke={theme.lineColor}
          strokeWidth="0.5"
          fill="none"
        />
        
        {/* Paint area */}
        <rect x="26" y="58" width="18" height="17" fill="none" stroke={theme.lineColor} strokeWidth="0.4" />
        
        {/* Free throw circle - top half only, bottom matches free throw line width (26 to 44) */}
        <path 
          d="M 26 58 A 9 9 0 0 1 44 58" 
          stroke={theme.lineColor} 
          strokeWidth="0.4" 
          fill="none"
        />
        <line x1="26" y1="58" x2="44" y2="58" stroke={theme.lineColor} strokeWidth="0.4" />
        
        {/* Basket - Orange with theme line color outline (bigger) */}
        <circle cx="35" cy="72" r={basketRadius} fill="#ff6b35" stroke={theme.lineColor} strokeWidth="0.4" />
        
        {/* Shot animation - pixelated basketball */}
        {shotAnimation?.show && ballPosition && (
          <g className="shot-ball-group">
            {/* Define clip path for the ball to keep lines inside */}
            <defs>
              <clipPath id="ballClip">
                <circle 
                  cx={ballPosition.x} 
                  cy={ballPosition.y} 
                  r="1.2"
                />
              </clipPath>
            </defs>
            {/* Basketball circle - match size from player's hand (r=1.2) */}
            <circle 
              cx={ballPosition.x} 
              cy={ballPosition.y} 
              r="1.2" 
              fill={ballColor} 
              stroke="#000" 
              strokeWidth="0.15"
            />
            {/* Lines clipped to circle */}
            <g clipPath="url(#ballClip)">
              {/* Vertical line */}
              <line 
                x1={ballPosition.x} 
                y1={ballPosition.y - 1.2} 
                x2={ballPosition.x} 
                y2={ballPosition.y + 1.2} 
                stroke="#000" 
                strokeWidth="0.15"
              />
              {/* Top curve */}
              <path 
                d={`M ${ballPosition.x - 1.2} ${ballPosition.y} Q ${ballPosition.x} ${ballPosition.y - 0.5} ${ballPosition.x + 1.2} ${ballPosition.y}`}
                stroke="#000" 
                strokeWidth="0.15" 
                fill="none"
              />
              {/* Bottom curve */}
              <path 
                d={`M ${ballPosition.x - 1.2} ${ballPosition.y} Q ${ballPosition.x} ${ballPosition.y + 1.1} ${ballPosition.x + 1.2} ${ballPosition.y}`}
                stroke="#000" 
                strokeWidth="0.15" 
                fill="none"
              />
            </g>
          </g>
        )}
        
        {/* Position markers */}
        {positions.map((position) => {
          const isOffense = position.id === offensePosition
          const isDefense = position.id === defensePosition
          const isHighlighted = highlightedPositions.includes(position.id)
          const isClickable = isHighlighted
          
          return (
            <g key={position.id}>
              {/* Position marker - hide when player is on it or during replay */}
              {!hidePositionMarkers && !isOffense && !isDefense && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={3}
                  fill={
                    isHighlighted
                      ? 'rgba(255, 107, 53, 0.4)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }
                  stroke={
                    isHighlighted
                      ? '#ff6b35'
                      : 'rgba(255, 255, 255, 0.4)'
                  }
                  strokeWidth={0.4}
                  className={isClickable ? 'position-clickable' : ''}
                  onClick={() => isClickable && onPositionClick(position.id)}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                />
              )}
              
              {/* Position label - only show if no player on it and not in replay */}
              {!hidePositionMarkers && !isOffense && !isDefense && (
                <text
                  x={position.x}
                  y={position.y + 0.6}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.8)"
                  fontSize="2.5"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {position.id}
                </text>
              )}
              
              {/* Player characters - offset if both on same position */}
                  {isOffense && isDefense ? (
                    <>
                      {/* Both players on same spot - show side by side */}
                      <CourtPixelCharacter 
                        character={offenseCharacter} 
                        x={position.x - 2} 
                        y={position.y}
                        hasBasketball={true}
                        equippedCosmetics={isPlayer1Offense ? player1Cosmetics : player2Cosmetics}
                      />
                      <CourtPixelCharacter 
                        character={defenseCharacter} 
                        x={position.x + 2} 
                        y={position.y}
                        hasBasketball={false}
                        equippedCosmetics={isPlayer1Offense ? player2Cosmetics : player1Cosmetics}
                      />
                      {/* Red X indicator for good defense */}
                      {showBlockIndicator && (
                        <g>
                          <line x1={position.x - 3} y1={position.y - 6} x2={position.x + 3} y2={position.y} stroke="#ff0000" strokeWidth="0.8" />
                          <line x1={position.x + 3} y1={position.y - 6} x2={position.x - 3} y2={position.y} stroke="#ff0000" strokeWidth="0.8" />
                        </g>
                      )}
                    </>
                  ) : isOffense ? (
                    <CourtPixelCharacter 
                      character={offenseCharacter} 
                      x={position.x} 
                      y={position.y}
                      hasBasketball={true}
                      equippedCosmetics={isPlayer1Offense ? player1Cosmetics : player2Cosmetics}
                    />
                  ) : isDefense ? (
                    <CourtPixelCharacter 
                      character={defenseCharacter} 
                      x={position.x} 
                      y={position.y}
                      hasBasketball={false}
                      equippedCosmetics={isPlayer1Offense ? player2Cosmetics : player1Cosmetics}
                    />
                  ) : null}
            </g>
          )
        })}
        
        {/* Shot result banner - displayed on court above half court line */}
        {shotResult && (
          <g>
            {/* Background rectangle */}
            <rect 
              x="15" 
              y="10" 
              width="40" 
              height="8" 
              fill={shotResult.made ? 'rgba(0, 200, 0, 0.9)' : 'rgba(200, 0, 0, 0.9)'} 
              stroke="#f4e4c1" 
              strokeWidth="0.3"
              rx="1"
            />
            {/* Text */}
            <text 
              x="35" 
              y="14.5" 
              textAnchor="middle" 
              fill="#f4e4c1" 
              fontSize="2.5" 
              fontWeight="bold"
            >
              {shotResult.made ? '✓ MADE!' : '✗ MISS!'}
              {shotResult.made && ` +${shotResult.points}`}
            </text>
            {/* Percentage with contest indicator */}
            <text 
              x="35" 
              y="17" 
              textAnchor="middle" 
              fill="#f4e4c1" 
              fontSize="1.8" 
              opacity="0.9"
            >
              {shotResult.baseProbability !== shotResult.probability ? (
                // Shot was contested - show contest level
                (() => {
                  const contestReduction = shotResult.baseProbability - shotResult.probability
                  const contestLevel = contestReduction >= 0.15 ? 'Heavily Contested' : 
                                     contestReduction >= 0.10 ? 'Contested' : 
                                     'Semi Contested'
                  return `${contestLevel} ${Math.round(shotResult.probability * 100)}%`
                })()
              ) : (
                // Shot was open
                `${Math.round(shotResult.probability * 100)}%`
              )}
            </text>
          </g>
        )}
      </svg>
      
      <div className="court-legend">
        <div className="legend-item">
          <span className="legend-icon offense">●</span>
          <span>Offense</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon defense">●</span>
          <span>Defense</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon available">●</span>
          <span>Available</span>
        </div>
      </div>
    </div>
  )
}

export default Court

