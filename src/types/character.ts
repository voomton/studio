export type Gender = 'female' | 'male'

export type BodyBuild = 'slim' | 'average' | 'athletic' | 'curvy' | 'chibi'

export type EyeShape = 'sparkle_anime' | 'cat_eye' | 'tareme_gentle' | 'sharp_heroic' | 'chibi_cute' | 'tsundere'

export type EyebrowStyle = 'gentle' | 'arched' | 'sharp' | 'worried' | 'confident' | 'straight'

export type MouthExpression = 'smile' | 'neutral' | 'smirk' | 'pout' | 'open_talk' | 'cat_mouth' | 'shocked'

export type HairstyleId = 
  | 'twintails'
  | 'hime_cut'
  | 'short_bob'
  | 'spiky_hero'
  | 'high_ponytail'
  | 'wavy_locks'
  | 'odango_buns'

export type OutfitId = 
  | 'school_sailor'
  | 'casual_hoodie'
  | 'fantasy_robe'
  | 'gothic_lolita'
  | 'summer_yukata'
  | 'cyber_techwear'

export type FootwearId = 'loafers' | 'sneakers' | 'boots' | 'geta' | 'mary_janes'

export type SocksStyle = 'knee_high' | 'ankle' | 'thigh_high' | 'bare'

export type GlassesId = 'none' | 'round_wire' | 'black_frames' | 'rimless_oval' | 'sunglasses'

export type HeadwearId = 'none' | 'witch_hat' | 'cat_ears' | 'beret' | 'flower_pin' | 'flower_hairpin' | 'halo' | 'demon_horns'

export type AccessoryExtraId = 'none' | 'choker_ribbon' | 'crystal_earrings' | 'earrings' | 'angel_wings' | 'face_bandaid'

export type ExtraAccessoryId = AccessoryExtraId

export type PoseId = 'idle_breath' | 't_pose' | 'cute_peace' | 'heroic_stance' | 'shy_kawaii' | 'spellcaster'

export type StudioBackdrop = 'dark_obsidian' | 'sakura_garden' | 'cyber_neon' | 'clean_daylight'

export type CategoryTab = 'body' | 'face' | 'hair' | 'outfit' | 'accessories' | 'studio'

export interface CharacterConfig {
  id: string
  name: string
  gender: Gender
  createdAt: number
  updatedAt: number
  thumbnail?: string

  // Body attributes
  body: {
    height: number // 0.8 - 1.2
    build: BodyBuild
    skinTone: string // hex color
    skinShade: string // shadow tint hex
    shoulderWidth: number // 0.8 - 1.25
    waistScale: number // 0.7 - 1.3
    hipScale: number // 0.8 - 1.3
    chestSize: number // 0.6 - 1.5
    limbThickness: number // 0.8 - 1.25
    headScale: number // 0.85 - 1.15
  }

  // Facial attributes
  face: {
    eyeShape: EyeShape
    eyeSize: number // 0.8 - 1.25
    eyeColor: string // hex
    eyeSecondaryColor: string // hex (inner ring / highlight)
    pupilColor: string // hex
    eyeSpacing: number // 0.9 - 1.15
    eyebrowStyle: EyebrowStyle
    eyebrowColor: string
    eyebrowAngle: number // -15 to +15 deg
    mouthExpression: MouthExpression
    blushIntensity: number // 0 - 1
    blushColor: string
    hasNoseShadow: boolean
    earStyle: 'human' | 'elf'
  }

  // Hair attributes
  hair: {
    style: HairstyleId
    baseColor: string
    highlightColor: string
    tipGradientColor?: string
    glossIntensity: number // 0 - 1
    hasAhoge: boolean
  }

  // Outfit attributes
  outfit: {
    style: OutfitId
    primaryColor: string
    secondaryColor: string
    trimColor: string
    accentColor: string
    footwear: FootwearId
    shoeColor: string
    socksColor: string
    socksStyle: 'knee_high' | 'ankle' | 'thigh_high' | 'bare'
  }

  // Accessories
  accessories: {
    glasses: GlassesId
    glassesColor: string
    headwear: HeadwearId
    headwearColor: string
    headwearSecondaryColor: string
    extra: AccessoryExtraId
    extraColor: string
  }

  // Studio & Pose
  studio: {
    pose: PoseId
    backdrop: StudioBackdrop
    rimLightIntensity: number // 0 - 2
    rimLightColor: string
    outlineThickness: number // 0 - 2
    enableBreathing: boolean
  }
}
