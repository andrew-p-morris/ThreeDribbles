export type CosmeticCategory = 'headwear' | 'footwear' | 'jersey_style' | 'jewelry' | 'arm_items' | 'socks' | 'balls' | 'eyewear'

export type CosmeticItem = {
  id: string
  name: string
  category: CosmeticCategory
  emoji: string
  colors: {
    primary: string
    secondary?: string
  }
  locked: boolean
}

export type EquippedCosmetics = {
  headwear?: string
  footwear?: string
  jersey_style?: string
  jewelry?: string
  arm_items?: string
  socks?: string
  balls?: string
  eyewear?: string
}

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // Headwear - White/Black unlocked first
  {
    id: 'headband_white',
    name: 'White Headband',
    category: 'headwear',
    emoji: '🎽',
    colors: { primary: '#ffffff' },
    locked: false
  },
  {
    id: 'headband_black',
    name: 'Black Headband',
    category: 'headwear',
    emoji: '🎽',
    colors: { primary: '#000000' },
    locked: false
  },
  {
    id: 'headband_red',
    name: 'Red Headband',
    category: 'headwear',
    emoji: '🎽',
    colors: { primary: '#ff0000', secondary: '#ffffff' },
    locked: true
  },
  {
    id: 'cap_black',
    name: 'Black Cap',
    category: 'headwear',
    emoji: '🧢',
    colors: { primary: '#000000' },
    locked: true
  },
  {
    id: 'headband_blue',
    name: 'Blue Headband',
    category: 'headwear',
    emoji: '🎽',
    colors: { primary: '#0066ff' },
    locked: true
  },
  
  // Jewelry
  {
    id: 'gold_chain',
    name: 'Gold Chain',
    category: 'jewelry',
    emoji: '📿',
    colors: { primary: '#FFD700' },
    locked: true
  },
  {
    id: 'silver_chain',
    name: 'Silver Chain',
    category: 'jewelry',
    emoji: '📿',
    colors: { primary: '#C0C0C0' },
    locked: true
  },
  
  // Eyewear
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    category: 'eyewear',
    emoji: '🕶️',
    colors: { primary: '#000000', secondary: '#1a1a1a' },
    locked: true
  },
  {
    id: 'glasses',
    name: 'Glasses',
    category: 'eyewear',
    emoji: '👓',
    colors: { primary: '#000000', secondary: '#333333' },
    locked: true
  },
  
  // Arm Items - Wristbands first, then arm sleeves
  {
    id: 'wristbands_white',
    name: 'White Wristbands',
    category: 'arm_items',
    emoji: '⌚',
    colors: { primary: '#ffffff' },
    locked: false
  },
  {
    id: 'wristbands_black',
    name: 'Black Wristbands',
    category: 'arm_items',
    emoji: '⌚',
    colors: { primary: '#000000' },
    locked: false
  },
  {
    id: 'wristbands_red',
    name: 'Red Wristbands',
    category: 'arm_items',
    emoji: '⌚',
    colors: { primary: '#ff0000' },
    locked: true
  },
  {
    id: 'arm_sleeve_black',
    name: 'Black Arm Sleeve',
    category: 'arm_items',
    emoji: '💪',
    colors: { primary: '#000000' },
    locked: true
  },
  {
    id: 'arm_sleeve_white',
    name: 'White Arm Sleeve',
    category: 'arm_items',
    emoji: '💪',
    colors: { primary: '#ffffff' },
    locked: true
  },
  
  // Footwear - White/Black unlocked first
  {
    id: 'shoes_white',
    name: 'White Sneakers',
    category: 'footwear',
    emoji: '👟',
    colors: { primary: '#ffffff', secondary: '#cccccc' },
    locked: false
  },
  {
    id: 'shoes_black',
    name: 'Black Sneakers',
    category: 'footwear',
    emoji: '👟',
    colors: { primary: '#000000', secondary: '#ffffff' },
    locked: false
  },
  {
    id: 'high_tops_red',
    name: 'Red Sneakers',
    category: 'footwear',
    emoji: '👟',
    colors: { primary: '#ff0000', secondary: '#000000' },
    locked: true
  },
  {
    id: 'retro_sneakers_blue',
    name: 'Blue Sneakers',
    category: 'footwear',
    emoji: '👟',
    colors: { primary: '#0066ff', secondary: '#ffffff' },
    locked: true
  },
  {
    id: 'high_tops_yellow',
    name: 'Yellow Sneakers',
    category: 'footwear',
    emoji: '👟',
    colors: { primary: '#ffcc00', secondary: '#000000' },
    locked: true
  },
  
  // Socks - White/Black unlocked first
  {
    id: 'socks_white',
    name: 'White Socks',
    category: 'socks',
    emoji: '🧦',
    colors: { primary: '#ffffff' },
    locked: false
  },
  {
    id: 'socks_black',
    name: 'Black Socks',
    category: 'socks',
    emoji: '🧦',
    colors: { primary: '#000000' },
    locked: false
  },
  {
    id: 'socks_red',
    name: 'Red Socks',
    category: 'socks',
    emoji: '🧦',
    colors: { primary: '#ff0000' },
    locked: true
  },
  {
    id: 'socks_blue',
    name: 'Blue Socks',
    category: 'socks',
    emoji: '🧦',
    colors: { primary: '#0066ff' },
    locked: true
  },
  {
    id: 'socks_striped',
    name: 'Striped Socks',
    category: 'socks',
    emoji: '🧦',
    colors: { primary: '#ff0000', secondary: '#ffffff' },
    locked: true
  },
  
  // Jersey Styles
  {
    id: 'jersey_classic',
    name: 'Blue Jersey',
    category: 'jersey_style',
    emoji: '👕',
    colors: { primary: '#0066ff', secondary: '#003399' },
    locked: true
  },
  {
    id: 'army_jersey',
    name: 'Army Green Jersey',
    category: 'jersey_style',
    emoji: '🎖️',
    colors: { primary: '#4a5d3f', secondary: '#6b8e5d' },
    locked: true
  },
  {
    id: 'championship_jersey',
    name: 'Yellow Jersey',
    category: 'jersey_style',
    emoji: '🏆',
    colors: { primary: '#FFD700', secondary: '#996600' },
    locked: true
  },
  {
    id: 'flame_jersey',
    name: 'Red Jersey',
    category: 'jersey_style',
    emoji: '🔥',
    colors: { primary: '#ff3300', secondary: '#cc0000' },
    locked: true
  },
  {
    id: 'tuxedo_white',
    name: 'White Tuxedo',
    category: 'jersey_style',
    emoji: '🤵',
    colors: { primary: '#ffffff', secondary: '#ffffff' },
    locked: true
  },
  {
    id: 'tuxedo_black',
    name: 'Black Tuxedo',
    category: 'jersey_style',
    emoji: '🤵',
    colors: { primary: '#000000', secondary: '#000000' },
    locked: true
  },
  
  // Balls - Only orange unlocked
  {
    id: 'ball_orange',
    name: 'Classic Orange',
    category: 'balls',
    emoji: '🏀',
    colors: { primary: '#ff6b35' },
    locked: false
  },
  {
    id: 'ball_red',
    name: 'Red Ball',
    category: 'balls',
    emoji: '🏀',
    colors: { primary: '#ff0000' },
    locked: true
  },
  {
    id: 'ball_blue',
    name: 'Blue Ball',
    category: 'balls',
    emoji: '🏀',
    colors: { primary: '#0066ff' },
    locked: true
  },
  {
    id: 'ball_green',
    name: 'Green Ball',
    category: 'balls',
    emoji: '🏀',
    colors: { primary: '#00cc00' },
    locked: true
  },
  {
    id: 'ball_gold',
    name: 'Gold Ball',
    category: 'balls',
    emoji: '🏀',
    colors: { primary: '#FFD700' },
    locked: true
  }
]

export function getCosmeticById(id: string): CosmeticItem | undefined {
  return COSMETIC_ITEMS.find(item => item.id === id)
}

export function getCosmeticsByCategory(category: CosmeticCategory): CosmeticItem[] {
  return COSMETIC_ITEMS.filter(item => item.category === category)
}
