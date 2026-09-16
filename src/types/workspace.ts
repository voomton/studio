export type PanelId =
  | 'characters'
  | 'assets'
  | 'scene'
  | 'outliner'
  | 'animation_library'
  | 'pose'
  | 'face'
  | 'hair'
  | 'outfit'
  | 'physics'
  | 'camera'
  | 'lights'
  | 'inspector'
  | 'timeline'
  | 'graph_editor'
  | 'dope_sheet'
  | 'audio'
  | 'lip_sync'
  | 'markers'
  | 'render'
  | 'preview'
  | 'project_settings'

export type DockZone = 'left' | 'right' | 'bottom' | 'floating' | 'hidden'

export type WorkspacePresetName = 'character' | 'scene' | 'animation' | 'cinematic' | 'audio' | 'render' | 'custom'

export interface PanelFloatingRect {
  x: number
  y: number
  width: number
  height: number
  isMinimized?: boolean
}

export interface WorkspaceLayout {
  leftWidth: number
  rightWidth: number
  bottomHeight: number
  leftCollapsed: boolean
  rightCollapsed: boolean
  bottomCollapsed: boolean
  maximizedPanelId: PanelId | 'viewport' | null
  dockedPanels: {
    left: PanelId[]
    right: PanelId[]
    bottom: PanelId[]
  }
  activeTabs: {
    left: PanelId
    right: PanelId
    bottom: PanelId
  }
  floatingPanels: Partial<Record<PanelId, PanelFloatingRect>>
  pinnedPanels: Partial<Record<PanelId, boolean>>
  mode: 'beginner' | 'pro'
  activePreset: WorkspacePresetName
  customPresets: Array<{ id: string; name: string; layout: WorkspaceLayout }>
  showToolShelf: boolean
}

export interface PanelDefinition {
  id: PanelId
  name: string
  shortLabel: string
  category: 'assets' | 'character' | 'scene' | 'animation' | 'tools'
  iconName: string
  defaultZone: 'left' | 'right' | 'bottom'
  minWidth?: number
  minHeight?: number
}

export const PANEL_DEFINITIONS: Record<PanelId, PanelDefinition> = {
  characters: {
    id: 'characters',
    name: 'Character Library',
    shortLabel: 'Characters',
    category: 'character',
    iconName: 'Users',
    defaultZone: 'left',
    minWidth: 260
  },
  assets: {
    id: 'assets',
    name: 'Asset & Props Library',
    shortLabel: 'Assets',
    category: 'assets',
    iconName: 'Box',
    defaultZone: 'left',
    minWidth: 260
  },
  scene: {
    id: 'scene',
    name: 'Scene Hierarchy',
    shortLabel: 'Scene',
    category: 'scene',
    iconName: 'Layers',
    defaultZone: 'left',
    minWidth: 260
  },
  outliner: {
    id: 'outliner',
    name: 'Scene Outliner',
    shortLabel: 'Outliner',
    category: 'scene',
    iconName: 'ListTree',
    defaultZone: 'left',
    minWidth: 260
  },
  animation_library: {
    id: 'animation_library',
    name: 'Animation Library',
    shortLabel: 'Animations',
    category: 'animation',
    iconName: 'Clapperboard',
    defaultZone: 'left',
    minWidth: 280
  },
  pose: {
    id: 'pose',
    name: 'Pose Library',
    shortLabel: 'Pose',
    category: 'character',
    iconName: 'Move',
    defaultZone: 'right',
    minWidth: 280
  },
  face: {
    id: 'face',
    name: 'Facial Morph & Expressions',
    shortLabel: 'Face',
    category: 'character',
    iconName: 'Smile',
    defaultZone: 'right',
    minWidth: 280
  },
  hair: {
    id: 'hair',
    name: 'Hair Styling',
    shortLabel: 'Hair',
    category: 'character',
    iconName: 'Sparkles',
    defaultZone: 'right',
    minWidth: 280
  },
  outfit: {
    id: 'outfit',
    name: 'Outfit & Materials',
    shortLabel: 'Outfit',
    category: 'character',
    iconName: 'Shirt',
    defaultZone: 'right',
    minWidth: 280
  },
  physics: {
    id: 'physics',
    name: 'Spring Bones & Physics',
    shortLabel: 'Physics',
    category: 'character',
    iconName: 'Activity',
    defaultZone: 'right',
    minWidth: 280
  },
  camera: {
    id: 'camera',
    name: 'Camera & Framing',
    shortLabel: 'Camera',
    category: 'scene',
    iconName: 'Camera',
    defaultZone: 'right',
    minWidth: 280
  },
  lights: {
    id: 'lights',
    name: 'Lighting & Environment',
    shortLabel: 'Lights',
    category: 'scene',
    iconName: 'Sun',
    defaultZone: 'right',
    minWidth: 280
  },
  inspector: {
    id: 'inspector',
    name: 'Properties Inspector',
    shortLabel: 'Inspector',
    category: 'tools',
    iconName: 'Sliders',
    defaultZone: 'right',
    minWidth: 280
  },
  timeline: {
    id: 'timeline',
    name: 'Timeline Sequencer',
    shortLabel: 'Timeline',
    category: 'animation',
    iconName: 'Film',
    defaultZone: 'bottom',
    minHeight: 220
  },
  graph_editor: {
    id: 'graph_editor',
    name: 'Graph Curve Editor',
    shortLabel: 'Graph',
    category: 'animation',
    iconName: 'TrendingUp',
    defaultZone: 'bottom',
    minHeight: 220
  },
  dope_sheet: {
    id: 'dope_sheet',
    name: 'Dope Sheet Matrix',
    shortLabel: 'Dope Sheet',
    category: 'animation',
    iconName: 'AlignJustify',
    defaultZone: 'bottom',
    minHeight: 220
  },
  audio: {
    id: 'audio',
    name: 'Audio & Lip Sync',
    shortLabel: 'Audio',
    category: 'animation',
    iconName: 'Volume2',
    defaultZone: 'bottom',
    minHeight: 220
  },
  lip_sync: {
    id: 'lip_sync',
    name: 'Voice Lip Sync Engine',
    shortLabel: 'Lip Sync',
    category: 'animation',
    iconName: 'Mic',
    defaultZone: 'right',
    minWidth: 280
  },
  markers: {
    id: 'markers',
    name: 'Scene & Beat Markers',
    shortLabel: 'Markers',
    category: 'animation',
    iconName: 'Bookmark',
    defaultZone: 'bottom',
    minHeight: 200
  },
  render: {
    id: 'render',
    name: 'Render & Movie Export',
    shortLabel: 'Render',
    category: 'tools',
    iconName: 'Video',
    defaultZone: 'right',
    minWidth: 300
  },
  preview: {
    id: 'preview',
    name: 'Camera Live Preview',
    shortLabel: 'Preview',
    category: 'scene',
    iconName: 'Eye',
    defaultZone: 'right',
    minWidth: 280
  },
  project_settings: {
    id: 'project_settings',
    name: 'Project Settings',
    shortLabel: 'Settings',
    category: 'tools',
    iconName: 'Settings',
    defaultZone: 'right',
    minWidth: 280
  }
}

export const WORKSPACE_PRESETS: Record<Exclude<WorkspacePresetName, 'custom'>, WorkspaceLayout> = {
  animation: {
    leftWidth: 280,
    rightWidth: 340,
    bottomHeight: 280,
    leftCollapsed: false,
    rightCollapsed: false,
    bottomCollapsed: false,
    maximizedPanelId: null,
    dockedPanels: {
      left: ['characters', 'assets', 'animation_library'],
      right: ['inspector', 'pose', 'camera'],
      bottom: ['timeline', 'graph_editor', 'dope_sheet', 'audio']
    },
    activeTabs: {
      left: 'characters',
      right: 'inspector',
      bottom: 'timeline'
    },
    floatingPanels: {},
    pinnedPanels: { inspector: true, timeline: true },
    mode: 'pro',
    activePreset: 'animation',
    customPresets: [],
    showToolShelf: true
  },
  character: {
    leftWidth: 260,
    rightWidth: 320,
    bottomHeight: 200,
    leftCollapsed: false,
    rightCollapsed: false,
    bottomCollapsed: true,
    maximizedPanelId: null,
    dockedPanels: {
      left: ['characters'],
      right: ['inspector', 'face', 'hair', 'outfit', 'physics'],
      bottom: []
    },
    activeTabs: {
      left: 'characters',
      right: 'inspector',
      bottom: 'timeline'
    },
    floatingPanels: {},
    pinnedPanels: { inspector: true },
    mode: 'pro',
    activePreset: 'character',
    customPresets: [],
    showToolShelf: false
  },
  scene: {
    leftWidth: 270,
    rightWidth: 320,
    bottomHeight: 200,
    leftCollapsed: false,
    rightCollapsed: false,
    bottomCollapsed: true,
    maximizedPanelId: null,
    dockedPanels: {
      left: ['scene', 'assets', 'outliner'],
      right: ['inspector', 'lights'],
      bottom: []
    },
    activeTabs: {
      left: 'scene',
      right: 'inspector',
      bottom: 'timeline'
    },
    floatingPanels: {},
    pinnedPanels: { inspector: true },
    mode: 'pro',
    activePreset: 'scene',
    customPresets: [],
    showToolShelf: true
  },
  cinematic: {
    leftWidth: 280,
    rightWidth: 320,
    bottomHeight: 260,
    leftCollapsed: false,
    rightCollapsed: false,
    bottomCollapsed: false,
    maximizedPanelId: null,
    dockedPanels: {
      left: ['scene', 'assets'],
      right: ['camera', 'lights', 'inspector'],
      bottom: ['timeline', 'audio']
    },
    activeTabs: {
      left: 'scene',
      right: 'camera',
      bottom: 'timeline'
    },
    floatingPanels: {},
    pinnedPanels: { camera: true },
    mode: 'pro',
    activePreset: 'cinematic',
    customPresets: [],
    showToolShelf: true
  },
  audio: {
    leftWidth: 280,
    rightWidth: 320,
    bottomHeight: 280,
    leftCollapsed: false,
    rightCollapsed: false,
    bottomCollapsed: false,
    maximizedPanelId: null,
    dockedPanels: {
      left: ['assets', 'scene'],
      right: ['audio', 'lip_sync', 'inspector'],
      bottom: ['audio', 'timeline']
    },
    activeTabs: {
      left: 'assets',
      right: 'audio',
      bottom: 'audio'
    },
    floatingPanels: {},
    pinnedPanels: { audio: true },
    mode: 'pro',
    activePreset: 'audio',
    customPresets: [],
    showToolShelf: true
  },
  render: {
    leftWidth: 260,
    rightWidth: 340,
    bottomHeight: 220,
    leftCollapsed: false,
    rightCollapsed: false,
    bottomCollapsed: false,
    maximizedPanelId: null,
    dockedPanels: {
      left: ['scene'],
      right: ['render', 'project_settings', 'inspector'],
      bottom: ['timeline']
    },
    activeTabs: {
      left: 'scene',
      right: 'render',
      bottom: 'timeline'
    },
    floatingPanels: {},
    pinnedPanels: { render: true },
    mode: 'pro',
    activePreset: 'render',
    customPresets: [],
    showToolShelf: true
  }
}

export const BEGINNER_LAYOUT: WorkspaceLayout = {
  leftWidth: 260,
  rightWidth: 320,
  bottomHeight: 240,
  leftCollapsed: false,
  rightCollapsed: false,
  bottomCollapsed: false,
  maximizedPanelId: null,
  dockedPanels: {
    left: ['characters', 'assets'],
    right: ['inspector', 'pose'],
    bottom: ['timeline']
  },
  activeTabs: {
    left: 'characters',
    right: 'inspector',
    bottom: 'timeline'
  },
  floatingPanels: {},
  pinnedPanels: {},
  mode: 'beginner',
  activePreset: 'animation',
  customPresets: [],
  showToolShelf: true
}
