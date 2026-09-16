import { CharacterConfig, Gender, HairstyleId, OutfitId, EyeShape, MouthExpression, PoseId } from '../types/character'

export const DEFAULT_CHARACTER: CharacterConfig = {
  id: 'preset-sakura-idol',
  name: 'Sakura Miku',
  gender: 'female',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  body: {
    height: 1.0,
    build: 'average',
    skinTone: '#fed7aa', // warm peach anime skin
    skinShade: '#fbcfe8',
    shoulderWidth: 1.0,
    waistScale: 0.95,
    hipScale: 1.05,
    chestSize: 1.0,
    limbThickness: 1.0,
    headScale: 1.0
  },
  face: {
    eyeShape: 'sparkle_anime',
    eyeSize: 1.05,
    eyeColor: '#0284c7', // vibrant anime sky blue
    eyeSecondaryColor: '#38bdf8',
    pupilColor: '#0f172a',
    eyeSpacing: 1.0,
    eyebrowStyle: 'gentle',
    eyebrowColor: '#f43f5e',
    eyebrowAngle: 2,
    mouthExpression: 'smile',
    blushIntensity: 0.65,
    blushColor: '#fb7185',
    hasNoseShadow: true,
    earStyle: 'human'
  },
  hair: {
    style: 'twintails',
    baseColor: '#ec4899', // bubblegum anime pink
    highlightColor: '#fbcfe8',
    tipGradientColor: '#c084fc',
    glossIntensity: 0.8,
    hasAhoge: true
  },
  outfit: {
    style: 'school_sailor',
    primaryColor: '#ffffff',
    secondaryColor: '#1e293b',
    trimColor: '#e11d48',
    accentColor: '#38bdf8',
    footwear: 'loafers',
    shoeColor: '#18181b',
    socksColor: '#1e293b',
    socksStyle: 'knee_high'
  },
  accessories: {
    glasses: 'none',
    glassesColor: '#1e1b4b',
    headwear: 'none',
    headwearColor: '#e11d48',
    headwearSecondaryColor: '#ffffff',
    extra: 'choker_ribbon',
    extraColor: '#18181b'
  },
  studio: {
    pose: 'idle_breath',
    backdrop: 'dark_obsidian',
    rimLightIntensity: 1.2,
    rimLightColor: '#d32f2f',
    outlineThickness: 1.0,
    enableBreathing: true
  }
}

export const PRESET_CHARACTERS: CharacterConfig[] = [
  DEFAULT_CHARACTER,
  {
    id: 'preset-rei-gothic',
    name: 'Rei Hoshino',
    gender: 'female',
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
    body: {
      height: 1.02,
      build: 'slim',
      skinTone: '#ffedd5',
      skinShade: '#e2e8f0',
      shoulderWidth: 0.95,
      waistScale: 0.88,
      hipScale: 0.95,
      chestSize: 0.85,
      limbThickness: 0.92,
      headScale: 0.98
    },
    face: {
      eyeShape: 'cat_eye',
      eyeSize: 1.0,
      eyeColor: '#7c3aed', // mystic purple
      eyeSecondaryColor: '#a855f7',
      pupilColor: '#09090b',
      eyeSpacing: 0.98,
      eyebrowStyle: 'sharp',
      eyebrowColor: '#18181b',
      eyebrowAngle: -4,
      mouthExpression: 'smirk',
      blushIntensity: 0.3,
      blushColor: '#f43f5e',
      hasNoseShadow: true,
      earStyle: 'human'
    },
    hair: {
      style: 'hime_cut',
      baseColor: '#18181b', // jet raven black
      highlightColor: '#475569',
      glossIntensity: 0.9,
      hasAhoge: false
    },
    outfit: {
      style: 'gothic_lolita',
      primaryColor: '#09090b',
      secondaryColor: '#ffffff',
      trimColor: '#e11d48',
      accentColor: '#9333ea',
      footwear: 'mary_janes',
      shoeColor: '#09090b',
      socksColor: '#ffffff',
      socksStyle: 'knee_high'
    },
    accessories: {
      glasses: 'round_wire',
      glassesColor: '#d4af37',
      headwear: 'witch_hat',
      headwearColor: '#09090b',
      headwearSecondaryColor: '#9333ea',
      extra: 'choker_ribbon',
      extraColor: '#e11d48'
    },
    studio: {
      pose: 'cute_peace',
      backdrop: 'dark_obsidian',
      rimLightIntensity: 1.4,
      rimLightColor: '#a855f7',
      outlineThickness: 1.0,
      enableBreathing: true
    }
  },
  {
    id: 'preset-ren-hero',
    name: 'Ren Kurogane',
    gender: 'male',
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 20000,
    body: {
      height: 1.08,
      build: 'athletic',
      skinTone: '#fcd34d',
      skinShade: '#f59e0b',
      shoulderWidth: 1.18,
      waistScale: 0.95,
      hipScale: 0.98,
      chestSize: 1.2,
      limbThickness: 1.1,
      headScale: 0.95
    },
    face: {
      eyeShape: 'sharp_heroic',
      eyeSize: 0.95,
      eyeColor: '#ea580c', // fiery amber
      eyeSecondaryColor: '#f97316',
      pupilColor: '#0f172a',
      eyeSpacing: 1.02,
      eyebrowStyle: 'confident',
      eyebrowColor: '#b45309',
      eyebrowAngle: 5,
      mouthExpression: 'smirk',
      blushIntensity: 0.2,
      blushColor: '#fb923c',
      hasNoseShadow: true,
      earStyle: 'human'
    },
    hair: {
      style: 'spiky_hero',
      baseColor: '#b45309', // golden flame hair
      highlightColor: '#fef08a',
      glossIntensity: 0.7,
      hasAhoge: true
    },
    outfit: {
      style: 'fantasy_robe',
      primaryColor: '#1e293b',
      secondaryColor: '#b91c1c',
      trimColor: '#eab308',
      accentColor: '#f97316',
      footwear: 'boots',
      shoeColor: '#451a03',
      socksColor: '#1e293b',
      socksStyle: 'knee_high'
    },
    accessories: {
      glasses: 'none',
      glassesColor: '#1e1b4b',
      headwear: 'none',
      headwearColor: '#e11d48',
      headwearSecondaryColor: '#ffffff',
      extra: 'face_bandaid',
      extraColor: '#fef08a'
    },
    studio: {
      pose: 'heroic_stance',
      backdrop: 'dark_obsidian',
      rimLightIntensity: 1.5,
      rimLightColor: '#f97316',
      outlineThickness: 1.1,
      enableBreathing: true
    }
  },
  {
    id: 'preset-aoi-mage',
    name: 'Aoi Shizuku',
    gender: 'female',
    createdAt: Date.now() - 30000,
    updatedAt: Date.now() - 30000,
    body: {
      height: 0.98,
      build: 'curvy',
      skinTone: '#fed7aa',
      skinShade: '#fbcfe8',
      shoulderWidth: 0.98,
      waistScale: 0.9,
      hipScale: 1.15,
      chestSize: 1.25,
      limbThickness: 1.02,
      headScale: 1.0
    },
    face: {
      eyeShape: 'tareme_gentle',
      eyeSize: 1.05,
      eyeColor: '#059669', // emerald green
      eyeSecondaryColor: '#34d399',
      pupilColor: '#064e3b',
      eyeSpacing: 1.0,
      eyebrowStyle: 'gentle',
      eyebrowColor: '#0284c7',
      eyebrowAngle: -2,
      mouthExpression: 'smile',
      blushIntensity: 0.7,
      blushColor: '#fb7185',
      hasNoseShadow: true,
      earStyle: 'elf'
    },
    hair: {
      style: 'wavy_locks',
      baseColor: '#0284c7', // aqua seafoam blue
      highlightColor: '#bae6fd',
      glossIntensity: 0.85,
      hasAhoge: false
    },
    outfit: {
      style: 'fantasy_robe',
      primaryColor: '#ffffff',
      secondaryColor: '#0284c7',
      trimColor: '#34d399',
      accentColor: '#facc15',
      footwear: 'boots',
      shoeColor: '#e0f2fe',
      socksColor: '#ffffff',
      socksStyle: 'knee_high'
    },
    accessories: {
      glasses: 'none',
      glassesColor: '#1e1b4b',
      headwear: 'halo',
      headwearColor: '#fef08a',
      headwearSecondaryColor: '#ffffff',
      extra: 'angel_wings',
      extraColor: '#ffffff'
    },
    studio: {
      pose: 'spellcaster',
      backdrop: 'sakura_garden',
      rimLightIntensity: 1.6,
      rimLightColor: '#38bdf8',
      outlineThickness: 1.0,
      enableBreathing: true
    }
  },
  {
    id: 'preset-cyber-cat',
    name: 'Nyx Cyber',
    gender: 'female',
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
    body: {
      height: 0.95,
      build: 'slim',
      skinTone: '#fde047',
      skinShade: '#cbd5e1',
      shoulderWidth: 0.95,
      waistScale: 0.9,
      hipScale: 1.0,
      chestSize: 0.9,
      limbThickness: 0.92,
      headScale: 1.02
    },
    face: {
      eyeShape: 'cat_eye',
      eyeSize: 1.1,
      eyeColor: '#ec4899', // neon hot pink
      eyeSecondaryColor: '#06b6d4',
      pupilColor: '#09090b',
      eyeSpacing: 1.0,
      eyebrowStyle: 'confident',
      eyebrowColor: '#06b6d4',
      eyebrowAngle: 3,
      mouthExpression: 'cat_mouth',
      blushIntensity: 0.5,
      blushColor: '#ec4899',
      hasNoseShadow: true,
      earStyle: 'human'
    },
    hair: {
      style: 'short_bob',
      baseColor: '#06b6d4', // neon cyan
      highlightColor: '#67e8f9',
      glossIntensity: 0.9,
      hasAhoge: true
    },
    outfit: {
      style: 'cyber_techwear',
      primaryColor: '#0f172a',
      secondaryColor: '#ec4899',
      trimColor: '#06b6d4',
      accentColor: '#eab308',
      footwear: 'sneakers',
      shoeColor: '#0f172a',
      socksColor: '#ec4899',
      socksStyle: 'knee_high'
    },
    accessories: {
      glasses: 'sunglasses',
      glassesColor: '#06b6d4',
      headwear: 'cat_ears',
      headwearColor: '#0f172a',
      headwearSecondaryColor: '#ec4899',
      extra: 'none',
      extraColor: '#ffffff'
    },
    studio: {
      pose: 'cute_peace',
      backdrop: 'cyber_neon',
      rimLightIntensity: 1.8,
      rimLightColor: '#06b6d4',
      outlineThickness: 1.2,
      enableBreathing: true
    }
  },
  {
    id: 'preset-hanako-summer',
    name: 'Hanako Momiji',
    gender: 'female',
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
    body: {
      height: 0.96,
      build: 'average',
      skinTone: '#fed7aa',
      skinShade: '#fbcfe8',
      shoulderWidth: 0.95,
      waistScale: 0.92,
      hipScale: 1.02,
      chestSize: 1.0,
      limbThickness: 0.98,
      headScale: 1.05
    },
    face: {
      eyeShape: 'sparkle_anime',
      eyeSize: 1.05,
      eyeColor: '#dc2626', // ruby crimson
      eyeSecondaryColor: '#f87171',
      pupilColor: '#450a0a',
      eyeSpacing: 1.0,
      eyebrowStyle: 'gentle',
      eyebrowColor: '#78350f',
      eyebrowAngle: 0,
      mouthExpression: 'smile',
      blushIntensity: 0.8,
      blushColor: '#f43f5e',
      hasNoseShadow: true,
      earStyle: 'human'
    },
    hair: {
      style: 'odango_buns',
      baseColor: '#78350f', // chestnut brown
      highlightColor: '#fbbf24',
      glossIntensity: 0.75,
      hasAhoge: true
    },
    outfit: {
      style: 'summer_yukata',
      primaryColor: '#be123c',
      secondaryColor: '#facc15',
      trimColor: '#ffffff',
      accentColor: '#fb7185',
      footwear: 'geta',
      shoeColor: '#78350f',
      socksColor: '#ffffff',
      socksStyle: 'bare'
    },
    accessories: {
      glasses: 'none',
      glassesColor: '#1e1b4b',
      headwear: 'none',
      headwearColor: '#be123c',
      headwearSecondaryColor: '#ffffff',
      extra: 'choker_ribbon',
      extraColor: '#be123c'
    },
    studio: {
      pose: 'shy_kawaii',
      backdrop: 'sakura_garden',
      rimLightIntensity: 1.3,
      rimLightColor: '#fb7185',
      outlineThickness: 1.0,
      enableBreathing: true
    }
  }
]

// Harmonious color palettes for generator
const PALETTES = [
  { hair: '#ec4899', eyes: '#0284c7', outfit1: '#ffffff', outfit2: '#1e293b', trim: '#e11d48' }, // Idol
  { hair: '#18181b', eyes: '#7c3aed', outfit1: '#09090b', outfit2: '#ffffff', trim: '#9333ea' }, // Gothic
  { hair: '#b45309', eyes: '#ea580c', outfit1: '#1e293b', outfit2: '#b91c1c', trim: '#eab308' }, // Shonen
  { hair: '#0284c7', eyes: '#059669', outfit1: '#f8fafc', outfit2: '#0284c7', trim: '#34d399' }, // Mage
  { hair: '#06b6d4', eyes: '#ec4899', outfit1: '#0f172a', outfit2: '#ec4899', trim: '#06b6d4' }, // Cyber
  { hair: '#78350f', eyes: '#dc2626', outfit1: '#be123c', outfit2: '#facc15', trim: '#ffffff' }, // Yukata
  { hair: '#6366f1', eyes: '#f43f5e', outfit1: '#ffffff', outfit2: '#6366f1', trim: '#f43f5e' }, // Magical Girl
  { hair: '#10b981', eyes: '#eab308', outfit1: '#064e3b', outfit2: '#10b981', trim: '#facc15' }, // Forest Elf
  { hair: '#f59e0b', eyes: '#3b82f6', outfit1: '#f1f5f9', outfit2: '#3b82f6', trim: '#f59e0b' }  // Cheerful
]

const SKIN_TONES = ['#fed7aa', '#ffedd5', '#fde047', '#fcd34d', '#fbb086', '#e0a96d', '#8d5b4c']

const HAIR_STYLES: HairstyleId[] = ['twintails', 'hime_cut', 'short_bob', 'spiky_hero', 'high_ponytail', 'wavy_locks', 'odango_buns']
const OUTFITS: OutfitId[] = ['school_sailor', 'casual_hoodie', 'fantasy_robe', 'gothic_lolita', 'summer_yukata', 'cyber_techwear']
const EYE_SHAPES: EyeShape[] = ['sparkle_anime', 'cat_eye', 'tareme_gentle', 'sharp_heroic', 'chibi_cute', 'tsundere']
const MOUTHS: MouthExpression[] = ['smile', 'neutral', 'smirk', 'pout', 'open_talk', 'cat_mouth']
const POSES: PoseId[] = ['idle_breath', 'cute_peace', 'heroic_stance', 'shy_kawaii', 'spellcaster']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateRandomCharacter(genderChoice?: Gender): CharacterConfig {
  const gender: Gender = genderChoice || (Math.random() > 0.5 ? 'female' : 'male')
  const pal = pick(PALETTES)
  const hairStyle = pick(HAIR_STYLES)
  const outfitStyle = pick(OUTFITS)
  const eyeShape = pick(EYE_SHAPES)
  const mouth = pick(MOUTHS)
  const pose = pick(POSES)
  const skin = pick(SKIN_TONES)

  const names = gender === 'female' 
    ? ['Yuki', 'Sakura', 'Asuka', 'Hinata', 'Akari', 'Mei', 'Kanna', 'Noa', 'Chika'] 
    : ['Ren', 'Haruto', 'Kenji', 'Shin', 'Tatsuya', 'Riku', 'Sora', 'Kaito']

  const randomName = `${pick(names)}_${Math.floor(100 + Math.random() * 900)}`

  return {
    id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: randomName,
    gender,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    body: {
      height: 0.92 + Math.random() * 0.16,
      build: pick(['slim', 'average', 'athletic', 'curvy', 'chibi']),
      skinTone: skin,
      skinShade: '#fbcfe8',
      shoulderWidth: 0.9 + Math.random() * 0.2,
      waistScale: 0.85 + Math.random() * 0.25,
      hipScale: 0.9 + Math.random() * 0.25,
      chestSize: gender === 'female' ? 0.8 + Math.random() * 0.5 : 0.7,
      limbThickness: 0.9 + Math.random() * 0.2,
      headScale: 0.95 + Math.random() * 0.1
    },
    face: {
      eyeShape,
      eyeSize: 0.95 + Math.random() * 0.15,
      eyeColor: pal.eyes,
      eyeSecondaryColor: pal.trim,
      pupilColor: '#09090b',
      eyeSpacing: 0.96 + Math.random() * 0.08,
      eyebrowStyle: pick(['gentle', 'arched', 'sharp', 'confident']),
      eyebrowColor: pal.hair,
      eyebrowAngle: Math.floor(-4 + Math.random() * 8),
      mouthExpression: mouth,
      blushIntensity: 0.3 + Math.random() * 0.5,
      blushColor: '#fb7185',
      hasNoseShadow: true,
      earStyle: Math.random() > 0.8 ? 'elf' : 'human'
    },
    hair: {
      style: hairStyle,
      baseColor: pal.hair,
      highlightColor: '#fef08a',
      glossIntensity: 0.8,
      hasAhoge: Math.random() > 0.4
    },
    outfit: {
      style: outfitStyle,
      primaryColor: pal.outfit1,
      secondaryColor: pal.outfit2,
      trimColor: pal.trim,
      accentColor: pal.eyes,
      footwear: pick(['loafers', 'sneakers', 'boots', 'mary_janes', 'geta']),
      shoeColor: pal.outfit2,
      socksColor: pal.outfit1,
      socksStyle: pick(['knee_high', 'ankle', 'thigh_high', 'bare'])
    },
    accessories: {
      glasses: Math.random() > 0.7 ? pick(['round_wire', 'black_frames', 'sunglasses']) : 'none',
      glassesColor: '#1e1b4b',
      headwear: Math.random() > 0.6 ? pick(['cat_ears', 'witch_hat', 'halo', 'demon_horns']) : 'none',
      headwearColor: pal.trim,
      headwearSecondaryColor: pal.outfit2,
      extra: Math.random() > 0.7 ? pick(['choker_ribbon', 'angel_wings', 'face_bandaid']) : 'none',
      extraColor: pal.trim
    },
    studio: {
      pose,
      backdrop: pick(['dark_obsidian', 'sakura_garden', 'cyber_neon', 'clean_daylight']),
      rimLightIntensity: 1.2 + Math.random() * 0.5,
      rimLightColor: pal.trim,
      outlineThickness: 1.0,
      enableBreathing: true
    }
  }
}
