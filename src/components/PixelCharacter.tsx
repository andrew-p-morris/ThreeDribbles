import { Character } from '../types/Character'
import { EquippedCosmetics, getCosmeticById } from '../types/Cosmetics'

type PixelCharacterProps = {
  character: Character
  size?: number
  equippedCosmetics?: EquippedCosmetics
  hasBasketball?: boolean
}

// Hair rendering helper for large characters
function renderHair(character: Character, pixelSize: number) {
  const hairColor = '#1a0f08' // Dark brown/black hair
  
  switch (character.hairStyle) {
    case 'afro':
      return (
        <>
          <rect x={pixelSize * 2} y={pixelSize * -0.5} width={pixelSize * 6} height={pixelSize * 1.5} fill={hairColor} stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 1.5} y={pixelSize * 0.5} width={pixelSize} height={pixelSize * 1.5} fill={hairColor} />
          <rect x={pixelSize * 7.5} y={pixelSize * 0.5} width={pixelSize} height={pixelSize * 1.5} fill={hairColor} />
        </>
      )
    case 'ponytail':
      return (
        <>
          <rect x={pixelSize * 3} y={pixelSize * 0} width={pixelSize * 4} height={pixelSize * 0.8} fill={hairColor} stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 6.5} y={pixelSize * 0.5} width={pixelSize * 1.5} height={pixelSize * 2} fill={hairColor} stroke="#000" strokeWidth="0.3" />
        </>
      )
    case 'mohawk':
      return (
        <rect x={pixelSize * 4} y={pixelSize * -0.5} width={pixelSize * 2} height={pixelSize * 1.5} fill={hairColor} stroke="#000" strokeWidth="0.5" />
      )
    case 'dreads':
      return (
        <>
          <rect x={pixelSize * 3} y={pixelSize * 0} width={pixelSize * 4} height={pixelSize * 0.8} fill={hairColor} stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 2.5} y={pixelSize * 1} width={pixelSize * 1} height={pixelSize * 2} fill={hairColor} stroke="#000" strokeWidth="0.3" />
          <rect x={pixelSize * 6.5} y={pixelSize * 1} width={pixelSize * 1} height={pixelSize * 2} fill={hairColor} stroke="#000" strokeWidth="0.3" />
        </>
      )
    case 'short':
      return (
        <rect x={pixelSize * 3} y={pixelSize * 0} width={pixelSize * 4} height={pixelSize * 0.8} fill={hairColor} stroke="#000" strokeWidth="0.5" />
      )
    case 'bald':
      return null
    default:
      return null
  }
}

// Hair rendering for court characters (smaller)
function renderCourtHair(character: Character, x: number, y: number) {
  const hairColor = '#1a0f08'
  
  switch (character.hairStyle) {
    case 'afro':
      return (
        <>
          {/* Main afro - scaled down proportionally */}
          <rect x={x - 1.5} y={y - 4.8} width={3} height={1.1} fill={hairColor} stroke="#000" strokeWidth="0.2" />
          {/* Left side piece - no stroke like large model, extends down more */}
          <rect x={x - 1.8} y={y - 3.8} width={0.6} height={1.2} fill={hairColor} />
          {/* Right side piece - no stroke like large model, extends down more */}
          <rect x={x + 1.2} y={y - 3.8} width={0.6} height={1.2} fill={hairColor} />
        </>
      )
    case 'ponytail':
      return (
        <>
          <rect x={x - 1.2} y={y - 4.8} width={2.4} height={0.6} fill={hairColor} stroke="#000" strokeWidth="0.2" />
          <rect x={x + 0.8} y={y - 4} width={0.8} height={1.5} fill={hairColor} stroke="#000" strokeWidth="0.15" />
        </>
      )
    case 'mohawk':
      return (
        <rect x={x - 0.6} y={y - 5} width={1.2} height={1.2} fill={hairColor} stroke="#000" strokeWidth="0.2" />
      )
    case 'dreads':
      return (
        <>
          <rect x={x - 1.2} y={y - 4.8} width={2.4} height={0.6} fill={hairColor} stroke="#000" strokeWidth="0.2" />
          <rect x={x - 1.5} y={y - 3.8} width={0.6} height={1.5} fill={hairColor} stroke="#000" strokeWidth="0.15" />
          <rect x={x + 0.9} y={y - 3.8} width={0.6} height={1.5} fill={hairColor} stroke="#000" strokeWidth="0.15" />
        </>
      )
    case 'short':
      return (
        <rect x={x - 1.2} y={y - 4.8} width={2.4} height={0.6} fill={hairColor} stroke="#000" strokeWidth="0.2" />
      )
    case 'bald':
      return null
    default:
      return null
  }
}

function renderChain(equippedCosmetics: EquippedCosmetics | undefined, pixelSize: number) {
  if (!equippedCosmetics?.jewelry) return null
  const cosmetic = getCosmeticById(equippedCosmetics.jewelry)
  if (!cosmetic) return null

  const centerX = pixelSize * 5
  const centerY = pixelSize * 2.5
  const rx = pixelSize * 1.5
  const ry = pixelSize * 1.2

  return (
    <>
      {/* Chain necklace - half circle arcing down from neck */}
      <path
        d={`M ${centerX - rx} ${centerY} A ${rx} ${ry} 0 0 0 ${centerX + rx} ${centerY}`}
        fill="none"
        stroke={cosmetic.colors.primary}
        strokeWidth="0.4"
      />
      {/* Pendant at bottom */}
      <circle cx={pixelSize * 5} cy={pixelSize * 3.7} r={pixelSize * 0.5} fill={cosmetic.colors.primary} stroke="#000" strokeWidth="0.2" />
    </>
  )
}

function renderHeadwear(equippedCosmetics: EquippedCosmetics | undefined, pixelSize: number) {
  if (!equippedCosmetics?.headwear) return null
  const cosmetic = getCosmeticById(equippedCosmetics.headwear)
  if (!cosmetic) return null

  switch (cosmetic.id) {
    case 'headband_red':
    case 'headband_white':
    case 'headband_black':
    case 'headband_blue':
      return (
        <rect x={pixelSize * 3} y={pixelSize * 0.6} width={pixelSize * 4} height={pixelSize * 0.5} fill={cosmetic.colors.primary} stroke="#000" strokeWidth="0.3" />
      )
    case 'cap_black':
      return (
        <>
          <rect x={pixelSize * 2.5} y={pixelSize * -0.2} width={pixelSize * 5} height={pixelSize * 1} fill={cosmetic.colors.primary} stroke="#000" strokeWidth="0.3" />
          <rect x={pixelSize * 2} y={pixelSize * 0.8} width={pixelSize * 6} height={pixelSize * 0.4} fill={cosmetic.colors.primary} stroke="#000" strokeWidth="0.3" />
        </>
      )
    default:
      return null
  }
}

function renderFootwear(equippedCosmetics: EquippedCosmetics | undefined, pixelSize: number) {
  if (!equippedCosmetics?.footwear) return null
  const cosmetic = getCosmeticById(equippedCosmetics.footwear)
  if (!cosmetic) return null

  return (
    <>
      <rect x={pixelSize * 2.8} y={pixelSize * 10.5} width={pixelSize * 1.8} height={pixelSize * 1.2} fill={cosmetic.colors.primary} stroke="#000" strokeWidth="0.5" />
      <rect x={pixelSize * 5.4} y={pixelSize * 10.5} width={pixelSize * 1.8} height={pixelSize * 1.2} fill={cosmetic.colors.primary} stroke="#000" strokeWidth="0.5" />
      {cosmetic.colors.secondary && (
        <>
          <rect x={pixelSize * 3} y={pixelSize * 10.7} width={pixelSize * 0.5} height={pixelSize * 0.5} fill={cosmetic.colors.secondary} />
          <rect x={pixelSize * 5.6} y={pixelSize * 10.7} width={pixelSize * 0.5} height={pixelSize * 0.5} fill={cosmetic.colors.secondary} />
        </>
      )}
    </>
  )
}

function renderJerseyStyle(equippedCosmetics: EquippedCosmetics | undefined, pixelSize: number, character: Character) {
  if (!equippedCosmetics?.jersey_style) return null
  const cosmetic = getCosmeticById(equippedCosmetics.jersey_style)
  if (!cosmetic) return null

  // Jersey style changes the jersey and shorts colors
  return {
    jerseyColor: cosmetic.colors.primary,
    shortsColor: cosmetic.colors.secondary || cosmetic.colors.primary
  }
}

// Detailed pixelated basketball character (10x12 grid)
export function PixelCharacter({ character, size = 40, equippedCosmetics, hasBasketball = false }: PixelCharacterProps) {
  const pixelSize = size / 10
  const jerseyStyle = renderJerseyStyle(equippedCosmetics, pixelSize, character)
  const jerseyColor = jerseyStyle?.jerseyColor || character.color
  const shortsColor = jerseyStyle?.shortsColor || character.secondaryColor

  return (
    <svg width={size * 1.4} height={size * 1.2} style={{ imageRendering: 'pixelated' }}>
      {/* Hair (rendered first, behind head) */}
      {renderHair(character, pixelSize)}
      
      {/* Head - varies by skin tone */}
      <rect x={pixelSize * 3} y={pixelSize * 0.5} width={pixelSize * 4} height={pixelSize * 2} fill={character.skinTone} stroke="#000" strokeWidth="0.5" />
      
      {/* Headwear (over hair but under some items) */}
      {renderHeadwear(equippedCosmetics, pixelSize)}
      
      {/* Eyes - only show if no sunglasses */}
      {!(equippedCosmetics?.eyewear && getCosmeticById(equippedCosmetics.eyewear)?.id === 'sunglasses') && (
        <>
          <rect x={pixelSize * 3.5} y={pixelSize * 1.2} width={pixelSize * 0.8} height={pixelSize * 0.8} fill="#000" />
          <rect x={pixelSize * 5.7} y={pixelSize * 1.2} width={pixelSize * 0.8} height={pixelSize * 0.8} fill="#000" />
        </>
      )}
      
      {/* Eyewear - sunglasses or glasses */}
      {equippedCosmetics?.eyewear && (() => {
        const eyewear = getCosmeticById(equippedCosmetics.eyewear)
        if (!eyewear) return null
        
        if (eyewear.id === 'sunglasses') {
          return (
            <>
              {/* Sunglasses frames */}
              <rect x={pixelSize * 3} y={pixelSize * 1.1} width={pixelSize * 1.5} height={pixelSize * 1} fill={eyewear.colors.primary} stroke="#000" strokeWidth="0.3" />
              <rect x={pixelSize * 5.5} y={pixelSize * 1.1} width={pixelSize * 1.5} height={pixelSize * 1} fill={eyewear.colors.primary} stroke="#000" strokeWidth="0.3" />
              {/* Bridge */}
              <rect x={pixelSize * 4.5} y={pixelSize * 1.3} width={pixelSize * 1} height={pixelSize * 0.3} fill={eyewear.colors.primary} stroke="#000" strokeWidth="0.2" />
              {/* Lenses (dark) */}
              <rect x={pixelSize * 3.2} y={pixelSize * 1.3} width={pixelSize * 1.1} height={pixelSize * 0.6} fill={eyewear.colors.secondary} />
              <rect x={pixelSize * 5.7} y={pixelSize * 1.3} width={pixelSize * 1.1} height={pixelSize * 0.6} fill={eyewear.colors.secondary} />
            </>
          )
        } else if (eyewear.id === 'glasses') {
          return (
            <>
              {/* Glasses frames */}
              <rect x={pixelSize * 3.2} y={pixelSize * 1.2} width={pixelSize * 1.3} height={pixelSize * 0.8} fill="none" stroke={eyewear.colors.primary} strokeWidth="0.3" />
              <rect x={pixelSize * 5.5} y={pixelSize * 1.2} width={pixelSize * 1.3} height={pixelSize * 0.8} fill="none" stroke={eyewear.colors.primary} strokeWidth="0.3" />
              {/* Bridge */}
              <rect x={pixelSize * 4.5} y={pixelSize * 1.4} width={pixelSize * 1} height={pixelSize * 0.2} fill={eyewear.colors.primary} />
              {/* Temples (sides) */}
              <line x1={pixelSize * 3} y1={pixelSize * 1.6} x2={pixelSize * 2} y2={pixelSize * 1.8} stroke={eyewear.colors.primary} strokeWidth="0.3" />
              <line x1={pixelSize * 8} y1={pixelSize * 1.6} x2={pixelSize * 9} y2={pixelSize * 1.8} stroke={eyewear.colors.primary} strokeWidth="0.3" />
            </>
          )
        }
        return null
      })()}
      
      {/* Arms - skin tone (or covered by sleeve/tuxedo) */}
      {equippedCosmetics?.jersey_style && (equippedCosmetics.jersey_style === 'tuxedo_white' || equippedCosmetics.jersey_style === 'tuxedo_black') ? (
        <>
          {/* Tuxedo covers both arms */}
          <rect x={pixelSize * 1} y={pixelSize * 3} width={pixelSize} height={pixelSize * 2} fill={jerseyColor} stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 8} y={pixelSize * 3} width={pixelSize} height={pixelSize * 2} fill={jerseyColor} stroke="#000" strokeWidth="0.5" />
        </>
      ) : equippedCosmetics?.arm_items?.includes('arm_sleeve') ? (
        <>
          {/* Left arm with sleeve */}
          <rect x={pixelSize * 1} y={pixelSize * 3} width={pixelSize} height={pixelSize * 2} fill={getCosmeticById(equippedCosmetics.arm_items)?.colors.primary || character.skinTone} stroke="#000" strokeWidth="0.5" />
          {/* Right arm normal */}
          <rect x={pixelSize * 8} y={pixelSize * 3} width={pixelSize} height={pixelSize * 2} fill={character.skinTone} stroke="#000" strokeWidth="0.5" />
        </>
      ) : (
        <>
          <rect x={pixelSize * 1} y={pixelSize * 3} width={pixelSize} height={pixelSize * 2} fill={character.skinTone} stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 8} y={pixelSize * 3} width={pixelSize} height={pixelSize * 2} fill={character.skinTone} stroke="#000" strokeWidth="0.5" />
          {/* Wristbands rendered on top of arms */}
          {equippedCosmetics?.arm_items?.includes('wristbands') && (
            <>
              <rect x={pixelSize * 1} y={pixelSize * 4.2} width={pixelSize} height={pixelSize * 0.6} fill={getCosmeticById(equippedCosmetics.arm_items)?.colors.primary || '#FFF'} stroke="#000" strokeWidth="0.2" />
              <rect x={pixelSize * 8} y={pixelSize * 4.2} width={pixelSize} height={pixelSize * 0.6} fill={getCosmeticById(equippedCosmetics.arm_items)?.colors.primary || '#FFF'} stroke="#000" strokeWidth="0.2" />
            </>
          )}
        </>
      )}
      
      {/* Jersey - main color */}
      <rect x={pixelSize * 2} y={pixelSize * 2.5} width={pixelSize * 6} height={pixelSize * 3.5} fill={jerseyColor} stroke="#000" strokeWidth="0.5" />
      
      {/* Chain on top of jersey */}
      {renderChain(equippedCosmetics, pixelSize)}
      
      {/* Jersey stripe/detail */}
      <rect x={pixelSize * 4} y={pixelSize * 2.5} width={pixelSize * 2} height={pixelSize * 0.5} fill={character.secondaryColor} />
      
      {/* Tuxedo bowtie */}
      {equippedCosmetics?.jersey_style && (equippedCosmetics.jersey_style === 'tuxedo_white' || equippedCosmetics.jersey_style === 'tuxedo_black') && (
        <>
          {/* Bowtie center */}
          <rect x={pixelSize * 4.2} y={pixelSize * 2.8} width={pixelSize * 1.6} height={pixelSize * 0.4} fill="#ff0000" stroke="#000" strokeWidth="0.2" />
          {/* Bowtie left wing */}
          <rect x={pixelSize * 3.5} y={pixelSize * 2.6} width={pixelSize * 0.8} height={pixelSize * 0.6} fill="#ff0000" stroke="#000" strokeWidth="0.2" />
          {/* Bowtie right wing */}
          <rect x={pixelSize * 5.7} y={pixelSize * 2.6} width={pixelSize * 0.8} height={pixelSize * 0.6} fill="#ff0000" stroke="#000" strokeWidth="0.2" />
        </>
      )}
      
      {/* Shorts - secondary color */}
      <rect x={pixelSize * 2.5} y={pixelSize * 6} width={pixelSize * 5} height={pixelSize * 2} fill={shortsColor} stroke="#000" strokeWidth="0.5" />
      
      {/* Legs - skin tone, or tuxedo color if tuxedo is equipped */}
      {equippedCosmetics?.jersey_style && (equippedCosmetics.jersey_style === 'tuxedo_white' || equippedCosmetics.jersey_style === 'tuxedo_black') ? (
        <>
          <rect x={pixelSize * 3} y={pixelSize * 8} width={pixelSize * 1.5} height={pixelSize * 2.5} fill={shortsColor} stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 5.5} y={pixelSize * 8} width={pixelSize * 1.5} height={pixelSize * 2.5} fill={shortsColor} stroke="#000" strokeWidth="0.5" />
        </>
      ) : (
        <>
          <rect x={pixelSize * 3} y={pixelSize * 8} width={pixelSize * 1.5} height={pixelSize * 2.5} fill={character.skinTone} stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 5.5} y={pixelSize * 8} width={pixelSize * 1.5} height={pixelSize * 2.5} fill={character.skinTone} stroke="#000" strokeWidth="0.5" />
        </>
      )}
      
      {/* Socks */}
      {equippedCosmetics?.socks && (() => {
        const socks = getCosmeticById(equippedCosmetics.socks)
        if (!socks) return null
        
        if (socks.id === 'socks_striped') {
          return (
            <>
              {/* Striped socks - alternating colors */}
              <rect x={pixelSize * 3} y={pixelSize * 9.5} width={pixelSize * 1.5} height={pixelSize * 0.5} fill={socks.colors.primary} />
              <rect x={pixelSize * 3} y={pixelSize * 10} width={pixelSize * 1.5} height={pixelSize * 0.5} fill={socks.colors.secondary} />
              <rect x={pixelSize * 5.5} y={pixelSize * 9.5} width={pixelSize * 1.5} height={pixelSize * 0.5} fill={socks.colors.primary} />
              <rect x={pixelSize * 5.5} y={pixelSize * 10} width={pixelSize * 1.5} height={pixelSize * 0.5} fill={socks.colors.secondary} />
            </>
          )
        } else {
          return (
            <>
              <rect x={pixelSize * 3} y={pixelSize * 9.5} width={pixelSize * 1.5} height={pixelSize * 1} fill={socks.colors.primary} />
              <rect x={pixelSize * 5.5} y={pixelSize * 9.5} width={pixelSize * 1.5} height={pixelSize * 1} fill={socks.colors.primary} />
            </>
          )
        }
      })()}
      
      {/* Footwear (shoes with custom colors if equipped) */}
      {equippedCosmetics?.footwear ? (
        renderFootwear(equippedCosmetics, pixelSize)
      ) : (
        <>
          {/* Default black shoes */}
          <rect x={pixelSize * 2.8} y={pixelSize * 10.5} width={pixelSize * 1.8} height={pixelSize * 1.2} fill="#000" stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 5.4} y={pixelSize * 10.5} width={pixelSize * 1.8} height={pixelSize * 1.2} fill="#000" stroke="#000" strokeWidth="0.5" />
          <rect x={pixelSize * 3} y={pixelSize * 10.7} width={pixelSize * 0.5} height={pixelSize * 0.5} fill="#FFF" />
          <rect x={pixelSize * 5.6} y={pixelSize * 10.7} width={pixelSize * 0.5} height={pixelSize * 0.5} fill="#FFF" />
        </>
      )}
      
      {/* Basketball (if holding one) */}
      {hasBasketball && (() => {
        const ballCosmetic = equippedCosmetics?.balls ? getCosmeticById(equippedCosmetics.balls) : null
        const ballColor = ballCosmetic?.colors.primary || '#ff6b35'
        // Use thicker, darker stroke to match court model's appearance
        // Court model uses 0.15 which looks darker - use proportionally thicker for larger ball
        const ballStrokeWidth = Math.max(0.4, pixelSize * 0.1) // Thicker and darker
        
        return (
          <g>
            {/* Basketball in right hand - at bottom of hand */}
            <circle cx={pixelSize * 9.2} cy={pixelSize * 6} r={pixelSize * 1.2} fill={ballColor} stroke="#000" strokeWidth={ballStrokeWidth} />
            {/* Basketball lines - darker to match court model */}
            <line x1={pixelSize * 9.2} y1={pixelSize * 4.8} x2={pixelSize * 9.2} y2={pixelSize * 7.2} stroke="#000" strokeWidth={ballStrokeWidth} />
            <path d={`M ${pixelSize * 8} ${pixelSize * 6} Q ${pixelSize * 9.2} ${pixelSize * 5} ${pixelSize * 10.4} ${pixelSize * 6}`} stroke="#000" strokeWidth={ballStrokeWidth} fill="none" />
            <path d={`M ${pixelSize * 8} ${pixelSize * 6} Q ${pixelSize * 9.2} ${pixelSize * 7} ${pixelSize * 10.4} ${pixelSize * 6}`} stroke="#000" strokeWidth={ballStrokeWidth} fill="none" />
          </g>
        )
      })()}
    </svg>
  )
}

// For court display (smaller, SVG format)
export function CourtPixelCharacter({ character, x, y, hasBasketball, equippedCosmetics }: { character: Character, x: number, y: number, hasBasketball?: boolean, equippedCosmetics?: EquippedCosmetics }) {
  // Determine colors based on equipped cosmetics
  const jerseyStyle = equippedCosmetics?.jersey_style ? getCosmeticById(equippedCosmetics.jersey_style) : null
  const jerseyColor = jerseyStyle?.colors.primary || character.color
  const shortsColor = jerseyStyle?.colors.secondary || character.secondaryColor
  
  const footwear = equippedCosmetics?.footwear ? getCosmeticById(equippedCosmetics.footwear) : null
  const shoeColor = footwear?.colors.primary || '#000'
  const shoeHighlight = footwear?.colors.secondary || '#FFF'
  return (
    <g>
      {/* Hair (rendered first) */}
      {renderCourtHair(character, x, y)}
      
      {/* Head - skin tone */}
      <rect x={x - 1.2} y={y - 4} width={2.4} height={2} fill={character.skinTone} stroke="#000" strokeWidth="0.15" />
      
      {/* Eyes - only show if no sunglasses */}
      {!(equippedCosmetics?.eyewear && getCosmeticById(equippedCosmetics.eyewear)?.id === 'sunglasses') && (
        <>
          <rect x={x - 0.7} y={y - 3.3} width={0.5} height={0.5} fill="#000" />
          <rect x={x + 0.2} y={y - 3.3} width={0.5} height={0.5} fill="#000" />
        </>
      )}
      
      {/* Eyewear - sunglasses or glasses */}
      {equippedCosmetics?.eyewear && (() => {
        const eyewear = getCosmeticById(equippedCosmetics.eyewear)
        if (!eyewear) return null
        
        if (eyewear.id === 'sunglasses') {
          return (
            <>
              {/* Sunglasses frames */}
              <rect x={x - 0.8} y={y - 3.5} width={0.7} height={0.5} fill={eyewear.colors.primary} stroke="#000" strokeWidth="0.1" />
              <rect x={x + 0.1} y={y - 3.5} width={0.7} height={0.5} fill={eyewear.colors.primary} stroke="#000" strokeWidth="0.1" />
              {/* Bridge */}
              <rect x={x - 0.2} y={y - 3.3} width={0.4} height={0.15} fill={eyewear.colors.primary} stroke="#000" strokeWidth="0.1" />
              {/* Lenses (dark) */}
              <rect x={x - 0.7} y={y - 3.3} width={0.5} height={0.3} fill={eyewear.colors.secondary} />
              <rect x={x + 0.2} y={y - 3.3} width={0.5} height={0.3} fill={eyewear.colors.secondary} />
            </>
          )
        } else if (eyewear.id === 'glasses') {
          return (
            <>
              {/* Glasses frames */}
              <rect x={x - 0.7} y={y - 3.4} width={0.6} height={0.4} fill="none" stroke={eyewear.colors.primary} strokeWidth="0.1" />
              <rect x={x + 0.1} y={y - 3.4} width={0.6} height={0.4} fill="none" stroke={eyewear.colors.primary} strokeWidth="0.1" />
              {/* Bridge */}
              <rect x={x - 0.2} y={y - 3.2} width={0.4} height={0.1} fill={eyewear.colors.primary} />
              {/* Temples (sides) */}
              <line x1={x - 0.8} y1={y - 3.2} x2={x - 1.2} y2={y - 3} stroke={eyewear.colors.primary} strokeWidth="0.1" />
              <line x1={x + 0.8} y1={y - 3.2} x2={x + 1.2} y2={y - 3} stroke={eyewear.colors.primary} strokeWidth="0.1" />
            </>
          )
        }
        return null
      })()}
      
      {/* Arms - skin tone or with sleeve/tuxedo */}
      {equippedCosmetics?.jersey_style && (equippedCosmetics.jersey_style === 'tuxedo_white' || equippedCosmetics.jersey_style === 'tuxedo_black') ? (
        <>
          {/* Tuxedo covers both arms */}
          <rect x={x - 2} y={y - 1.5} width={0.5} height={1.3} fill={jerseyColor} stroke="#000" strokeWidth="0.1" />
          <rect x={x + 1.5} y={y - 1.5} width={0.5} height={1.3} fill={jerseyColor} stroke="#000" strokeWidth="0.1" />
        </>
      ) : equippedCosmetics?.arm_items?.includes('arm_sleeve') ? (
        <>
          {/* Left arm with full sleeve */}
          <rect x={x - 2} y={y - 1.5} width={0.5} height={1.3} fill={getCosmeticById(equippedCosmetics.arm_items)?.colors.primary || '#000'} stroke="#000" strokeWidth="0.1" />
          {/* Right arm normal */}
          <rect x={x + 1.5} y={y - 1.5} width={0.5} height={1.3} fill={character.skinTone} stroke="#000" strokeWidth="0.1" />
        </>
      ) : (
        <>
          <rect x={x - 2} y={y - 1.5} width={0.5} height={1.3} fill={character.skinTone} stroke="#000" strokeWidth="0.1" />
          <rect x={x + 1.5} y={y - 1.5} width={0.5} height={1.3} fill={character.skinTone} stroke="#000" strokeWidth="0.1" />
          {/* Wristbands on top of arms */}
          {equippedCosmetics?.arm_items?.includes('wristbands') && (
            <>
              <rect x={x - 2} y={y - 0.7} width={0.5} height={0.3} fill={getCosmeticById(equippedCosmetics.arm_items)?.colors.primary || '#FFF'} stroke="#000" strokeWidth="0.08" />
              <rect x={x + 1.5} y={y - 0.7} width={0.5} height={0.3} fill={getCosmeticById(equippedCosmetics.arm_items)?.colors.primary || '#FFF'} stroke="#000" strokeWidth="0.08" />
            </>
          )}
        </>
      )}
      
      {/* Jersey */}
      <rect x={x - 1.5} y={y - 2} width={3} height={2.2} fill={jerseyColor} stroke="#000" strokeWidth="0.15" />
      
      {/* Chain on TOP of jersey - facing down */}
      {equippedCosmetics?.jewelry && (() => {
        const chain = getCosmeticById(equippedCosmetics.jewelry)
        if (!chain) return null
        
        return (
          <>
            {/* Half circle chain arcing down from neck */}
            <path
              d={`M ${x - 0.8} ${y - 1.7} A 0.8 0.6 0 0 0 ${x + 0.8} ${y - 1.7}`}
              fill="none"
              stroke={chain.colors.primary}
              strokeWidth="0.15"
            />
            {/* Pendant at bottom */}
            <circle cx={x} cy={y - 1.1} r={0.25} fill={chain.colors.primary} stroke="#000" strokeWidth="0.08" />
          </>
        )
      })()}
      
      {/* Jersey stripe */}
      <rect x={x - 0.5} y={y - 2} width={1} height={0.4} fill={character.secondaryColor} />
      
      {/* Tuxedo bowtie - positioned lower, at neck/chest level */}
      {equippedCosmetics?.jersey_style && (equippedCosmetics.jersey_style === 'tuxedo_white' || equippedCosmetics.jersey_style === 'tuxedo_black') && (
        <>
          {/* Bowtie center */}
          <rect x={x - 0.25} y={y - 2.2} width={0.5} height={0.15} fill="#ff0000" stroke="#000" strokeWidth="0.05" />
          {/* Bowtie left wing */}
          <rect x={x - 0.5} y={y - 2.3} width={0.25} height={0.25} fill="#ff0000" stroke="#000" strokeWidth="0.05" />
          {/* Bowtie right wing */}
          <rect x={x + 0.25} y={y - 2.3} width={0.25} height={0.25} fill="#ff0000" stroke="#000" strokeWidth="0.05" />
        </>
      )}
      
      {/* Headwear */}
      {equippedCosmetics?.headwear && (() => {
        const headwear = getCosmeticById(equippedCosmetics.headwear)
        if (headwear?.id.includes('headband')) {
          return <rect x={x - 1.2} y={y - 3.8} width={2.4} height={0.3} fill={headwear.colors.primary} stroke="#000" strokeWidth="0.1" />
        } else if (headwear?.id === 'cap_black') {
          return (
            <>
              <rect x={x - 1.4} y={y - 4.5} width={2.8} height={0.6} fill={headwear.colors.primary} stroke="#000" strokeWidth="0.1" />
              <rect x={x - 1.6} y={y - 3.9} width={3.2} height={0.25} fill={headwear.colors.primary} stroke="#000" strokeWidth="0.1" />
            </>
          )
        }
        return null
      })()}
      
      {/* Shorts */}
      <rect x={x - 1.3} y={y + 0.2} width={2.6} height={1.3} fill={shortsColor} stroke="#000" strokeWidth="0.15" />
      
      {/* Legs - skin tone, or tuxedo color if tuxedo is equipped */}
      {equippedCosmetics?.jersey_style && (equippedCosmetics.jersey_style === 'tuxedo_white' || equippedCosmetics.jersey_style === 'tuxedo_black') ? (
        <>
          <rect x={x - 1} y={y + 1.5} width={0.8} height={1.5} fill={shortsColor} stroke="#000" strokeWidth="0.1" />
          <rect x={x + 0.2} y={y + 1.5} width={0.8} height={1.5} fill={shortsColor} stroke="#000" strokeWidth="0.1" />
        </>
      ) : (
        <>
          <rect x={x - 1} y={y + 1.5} width={0.8} height={1.5} fill={character.skinTone} stroke="#000" strokeWidth="0.1" />
          <rect x={x + 0.2} y={y + 1.5} width={0.8} height={1.5} fill={character.skinTone} stroke="#000" strokeWidth="0.1" />
        </>
      )}
      
      {/* Socks */}
      {equippedCosmetics?.socks && (() => {
        const socks = getCosmeticById(equippedCosmetics.socks)
        if (!socks) return null
        
        if (socks.id === 'socks_striped') {
          return (
            <>
              {/* Striped socks */}
              <rect x={x - 1} y={y + 2.5} width={0.8} height={0.25} fill={socks.colors.primary} />
              <rect x={x - 1} y={y + 2.75} width={0.8} height={0.25} fill={socks.colors.secondary} />
              <rect x={x + 0.2} y={y + 2.5} width={0.8} height={0.25} fill={socks.colors.primary} />
              <rect x={x + 0.2} y={y + 2.75} width={0.8} height={0.25} fill={socks.colors.secondary} />
            </>
          )
        } else {
          return (
            <>
              <rect x={x - 1} y={y + 2.5} width={0.8} height={0.5} fill={socks.colors.primary} />
              <rect x={x + 0.2} y={y + 2.5} width={0.8} height={0.5} fill={socks.colors.primary} />
            </>
          )
        }
      })()}
      
      {/* Shoes with cosmetic colors */}
      <rect x={x - 1.1} y={y + 3} width={1} height={0.7} fill={shoeColor} stroke="#000" strokeWidth="0.1" />
      <rect x={x + 0.1} y={y + 3} width={1} height={0.7} fill={shoeColor} stroke="#000" strokeWidth="0.1" />
      
      {/* Shoe highlights */}
      <rect x={x - 0.9} y={y + 3.1} width={0.3} height={0.3} fill={shoeHighlight} />
      <rect x={x + 0.3} y={y + 3.1} width={0.3} height={0.3} fill={shoeHighlight} />
      
      {/* Basketball (if offensive player) */}
      {hasBasketball && (() => {
        const ballCosmetic = equippedCosmetics?.balls ? getCosmeticById(equippedCosmetics.balls) : null
        const ballColor = ballCosmetic?.colors.primary || '#ff6b35'
        
        return (
          <g>
            {/* Basketball at bottom of hand */}
            <circle cx={x + 2} cy={y + 0.3} r="1.2" fill={ballColor} stroke="#000" strokeWidth="0.15" />
            {/* Basketball lines */}
            <line x1={x + 2} y1={y - 0.9} x2={x + 2} y2={y + 1.5} stroke="#000" strokeWidth="0.15" />
            <path d={`M ${x + 0.8} ${y + 0.3} Q ${x + 2} ${y - 0.5} ${x + 3.2} ${y + 0.3}`} stroke="#000" strokeWidth="0.15" fill="none" />
            <path d={`M ${x + 0.8} ${y + 0.3} Q ${x + 2} ${y + 1.1} ${x + 3.2} ${y + 0.3}`} stroke="#000" strokeWidth="0.15" fill="none" />
          </g>
        )
      })()}
    </g>
  )
}
