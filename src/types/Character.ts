export type Character = {
  id: string
  name: string
  color: string
  secondaryColor: string
  hairStyle: 'short' | 'afro' | 'ponytail' | 'mohawk' | 'bald' | 'dreads'
  skinTone: string
}

export const CHARACTERS: Character[] = [
  {
    id: 'rocket',
    name: 'Rocket',
    color: '#ff0000',
    secondaryColor: '#cc0000',
    hairStyle: 'afro',
    skinTone: '#8B5A3C'
  },
  {
    id: 'ice',
    name: 'Ice',
    color: '#0066ff',
    secondaryColor: '#0044cc',
    hairStyle: 'bald',
    skinTone: '#4A3728'
  },
  {
    id: 'thunder',
    name: 'Thunder',
    color: '#ffcc00',
    secondaryColor: '#cc9900',
    hairStyle: 'mohawk',
    skinTone: '#D4A574'
  },
  {
    id: 'spark',
    name: 'Spark',
    color: '#9900ff',
    secondaryColor: '#6600cc',
    hairStyle: 'ponytail',
    skinTone: '#E8C4A8'
  },
  {
    id: 'blaze',
    name: 'Blaze',
    color: '#ff6600',
    secondaryColor: '#cc5200',
    hairStyle: 'dreads',
    skinTone: '#6B4423'
  },
  {
    id: 'viper',
    name: 'Viper',
    color: '#00cc00',
    secondaryColor: '#009900',
    hairStyle: 'short',
    skinTone: '#C89B6F'
  }
]

