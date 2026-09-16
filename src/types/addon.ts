export type AddonTab = 
  | 'overview'
  | 'items'
  | 'blocks'
  | 'entities'
  | 'recipes'
  | 'loot'
  | 'scripts'
  | 'textures'
  | 'ai_assistant'
  | 'files'
  | 'export'
  | 'changelog';

export interface BedrockManifest {
  name: string;
  description: string;
  author: string;
  namespace: string;
  version: [number, number, number];
  minEngineVersion: [number, number, number];
  bpUuid: string;
  bpModuleUuid: string;
  rpUuid: string;
  rpModuleUuid: string;
  experimentalFeatures: {
    betaApis: boolean;
    holidayCreatorFeatures: boolean;
    customBiomes: boolean;
    upcomingCreatorFeatures: boolean;
  };
}

export type ItemCategory = 'Equipment' | 'Items' | 'Nature' | 'Construction' | 'Spawn Eggs';

export interface BedrockItem {
  id: string;
  name: string;
  identifier: string; // e.g. "custom:ruby_sword"
  category: ItemCategory;
  maxStack: number;
  handEquipped: boolean;
  iconTextureId: string;
  isFood?: boolean;
  foodNutrition?: number;
  foodSaturation?: string; // 'low' | 'normal' | 'supernatural'
  isWeapon?: boolean;
  damage?: number;
  durability?: number;
  repairItems?: string[];
  cooldownCategory?: string;
  cooldownDuration?: number;
  foil?: boolean; // enchanted glint
  fireResistant?: boolean;
  customComponentsJson?: string;
  scriptAction?: string; // Bedrock Script API hook description
}

export interface BedrockBlock {
  id: string;
  name: string;
  identifier: string; // e.g. "custom:ruby_ore"
  category: 'Construction' | 'Nature' | 'Items';
  textureId: string;
  destructibleByMining: number; // hardness
  blastResistance: number;
  lightEmission: number; // 0-15
  friction: number; // 0.6 standard, 0.98 ice
  flammable: boolean;
  lootDropItem?: string; // e.g. "custom:ruby_gem" or self
  customGeometry?: 'full_cube' | 'slab' | 'cross' | 'pillar';
  mapColor?: string;
}

export interface BedrockEntity {
  id: string;
  name: string;
  identifier: string; // e.g. "custom:ruby_golem"
  health: number;
  speed: number;
  attackDamage: number;
  isBoss: boolean;
  behaviorMelee: boolean;
  behaviorWander: boolean;
  behaviorPanic: boolean;
  behaviorLookAtPlayer: boolean;
  behaviorFollowOwner?: boolean;
  isTameable?: boolean;
  lootTableId?: string;
  spawnRules?: {
    biomes: string[];
    weight: number;
    minHeight: number;
    maxHeight: number;
  };
}

export type RecipeType = 'shaped' | 'shapeless' | 'furnace';

export interface BedrockRecipe {
  id: string;
  identifier: string;
  type: RecipeType;
  outputItem: string;
  outputCount: number;
  // For shaped: 3 rows of 3 strings (symbols or item ids)
  grid?: string[]; // length 9
  // For shapeless: list of ingredient ids
  ingredients?: string[];
  // For furnace:
  furnaceInput?: string;
}

export interface BedrockLootPoolEntry {
  item: string;
  weight: number;
  minCount: number;
  maxCount: number;
}

export interface BedrockLootTable {
  id: string;
  identifier: string;
  entries: BedrockLootPoolEntry[];
}

export interface BedrockScript {
  id: string;
  filename: string;
  code: string;
  description: string;
  enabled: boolean;
}

export interface BedrockTexture {
  id: string;
  name: string;
  type: 'item' | 'block';
  pixelData: string[]; // 16x16 or 32x32 array of hex color strings or transparent ""
  width: number;
  height: number;
}

export interface AddonProject {
  manifest: BedrockManifest;
  items: BedrockItem[];
  blocks: BedrockBlock[];
  entities: BedrockEntity[];
  recipes: BedrockRecipe[];
  lootTables: BedrockLootTable[];
  scripts: BedrockScript[];
  textures: BedrockTexture[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  features: string[];
  bugFixes: string[];
  improvements: string[];
}
