import {
  AddonProject,
  BedrockItem,
  BedrockBlock,
  BedrockEntity,
  BedrockRecipe,
  BedrockLootTable,
  BedrockTexture,
  BedrockScript,
  BedrockShaderConfig,
} from '../types/addon';

export function generateManifestJson(project: AddonProject, type: 'data' | 'resources') {
  return type === 'data' ? generateBpManifest(project) : generateRpManifest(project);
}

/**
 * Generate Behavior Pack manifest.json
 */
export function generateBpManifest(project: AddonProject) {
  const m = project.manifest;
  const modules: any[] = [
    {
      description: `${m.name} Behavior Module`,
      type: 'data',
      uuid: m.bpModuleUuid,
      version: m.version,
    },
  ];

  // If there are enabled scripts, add script module with @minecraft/server dependency
  const hasScripts = project.scripts.some((s) => s.enabled && s.code.trim().length > 0);
  if (hasScripts) {
    modules.push({
      description: `${m.name} Scripting Module`,
      type: 'script',
      language: 'javascript',
      uuid: 'a89c9247-c370-4f93-b6d4-8968f9b9f71c',
      version: [1, 0, 0],
      entry: 'scripts/main.js',
    });
  }

  const dependencies: any[] = [
    {
      uuid: m.rpUuid,
      version: m.version,
    },
  ];

  if (hasScripts) {
    dependencies.push({
      module_name: '@minecraft/server',
      version: '1.14.0',
    });
    dependencies.push({
      module_name: '@minecraft/server-ui',
      version: '1.3.0',
    });
  }

  return {
    format_version: 2,
    header: {
      name: `${m.name} [BP]`,
      description: m.description || 'Created with Minecraft Bedrock Addon Creator',
      uuid: m.bpUuid,
      version: m.version,
      min_engine_version: m.minEngineVersion,
    },
    modules,
    dependencies,
  };
}

/**
 * Generate Resource Pack manifest.json
 */
export function generateRpManifest(project: AddonProject) {
  const m = project.manifest;
  const rpManifest: any = {
    format_version: 2,
    header: {
      name: `${m.name} [RP]`,
      description: m.description || 'Created with Minecraft Bedrock Addon Creator',
      uuid: m.rpUuid,
      version: m.version,
      min_engine_version: m.minEngineVersion,
    },
    modules: [
      {
        description: `${m.name} Resources Module`,
        type: 'resources',
        uuid: m.rpModuleUuid,
        version: m.version,
      },
    ],
  };

  if (project.shaders?.enabled || m.experimentalFeatures?.renderDragonDeferred) {
    rpManifest.capabilities = ['raytraced', 'experimental_custom_biomes'];
  }

  return rpManifest;
}

/**
 * Generate Behavior item JSON (Bedrock 1.20.80 - 1.21.0 format)
 */
export function generateItemJson(item: BedrockItem) {
  const shortId = item.identifier.includes(':') ? item.identifier.split(':')[1] : item.identifier;
  const components: Record<string, any> = {
    'minecraft:icon': {
      texture: shortId,
    },
    'minecraft:display_name': {
      value: item.name,
    },
    'minecraft:max_stack_size': item.maxStack || 64,
    'minecraft:hand_equipped': item.handEquipped ?? false,
  };

  if (item.foil) {
    components['minecraft:glint'] = true;
  }

  if (item.isWeapon && item.damage) {
    components['minecraft:damage'] = item.damage;
  }

  if (item.durability && item.durability > 0) {
    components['minecraft:durability'] = {
      max_durability: item.durability,
    };
    if (item.repairItems && item.repairItems.length > 0) {
      components['minecraft:repairable'] = {
        repair_items: item.repairItems.map((r) => ({
          items: [r],
          repair_amount: Math.round(item.durability! * 0.25),
        })),
      };
    }
  }

  if (item.isFood) {
    components['minecraft:food'] = {
      nutrition: item.foodNutrition || 4,
      saturation_modifier: item.foodSaturation || 'normal',
      can_always_eat: false,
    };
    components['minecraft:use_animation'] = 'eat';
    components['minecraft:use_modifiers'] = {
      use_duration: 1.6,
      movement_modifier: 0.35,
    };
  }

  if (item.cooldownCategory && item.cooldownDuration) {
    components['minecraft:cooldown'] = {
      category: item.cooldownCategory,
      duration: item.cooldownDuration,
    };
  }

  // Parse custom components if provided by user/AI
  if (item.customComponentsJson) {
    try {
      const parsed = JSON.parse(item.customComponentsJson);
      Object.assign(components, parsed);
    } catch {
      // ignore invalid json
    }
  }

  return {
    format_version: '1.20.80',
    'minecraft:item': {
      description: {
        identifier: item.identifier,
        menu_category: {
          category: item.category.toLowerCase().replace(' ', '_'),
        },
      },
      components,
    },
  };
}

/**
 * Generate Behavior block JSON (Bedrock 1.21.0 format)
 */
export function generateBlockJson(block: BedrockBlock) {
  const shortId = block.identifier.includes(':') ? block.identifier.split(':')[1] : block.identifier;
  const components: Record<string, any> = {
    'minecraft:destructible_by_mining': {
      seconds_to_destroy: block.destructibleByMining || 2.0,
    },
    'minecraft:destructible_by_explosion': {
      explosion_resistance: block.blastResistance || 6.0,
    },
    'minecraft:friction': block.friction ?? 0.6,
    'minecraft:light_emission': block.lightEmission || 0,
    'minecraft:material_instances': {
      '*': {
        texture: shortId,
        render_method: 'opaque',
      },
    },
  };

  if (block.flammable) {
    components['minecraft:flammable'] = {
      flame_odds: 20,
      burn_odds: 10,
    };
  }

  if (block.lootDropItem) {
    // If not self drop, point to loot table
    components['minecraft:loot'] = `loot_tables/blocks/${shortId}.json`;
  }

  return {
    format_version: '1.21.0',
    'minecraft:block': {
      description: {
        identifier: block.identifier,
        menu_category: {
          category: block.category.toLowerCase(),
        },
      },
      components,
    },
  };
}

/**
 * Generate Behavior Entity JSON (Bedrock 1.21.0 format)
 */
export function generateEntityJson(entity: BedrockEntity) {
  const shortId = entity.identifier.includes(':') ? entity.identifier.split(':')[1] : entity.identifier;
  const components: Record<string, any> = {
    'minecraft:is_hidden_when_invisible': {},
    'minecraft:type_family': {
      family: entity.isBoss ? ['monster', 'mob', 'boss'] : ['monster', 'mob'],
    },
    'minecraft:health': {
      value: entity.health || 20,
      max: entity.health || 20,
    },
    'minecraft:movement': {
      value: entity.speed || 0.25,
    },
    'minecraft:navigation.walk': {
      can_path_over_water: true,
      avoid_water: false,
    },
    'minecraft:movement.basic': {},
    'minecraft:jump.static': {},
    'minecraft:can_climb': {},
    'minecraft:collision_box': {
      width: entity.isBoss ? 1.4 : 0.6,
      height: entity.isBoss ? 2.8 : 1.8,
    },
    'minecraft:nameable': {},
    'minecraft:physics': {},
    'minecraft:pushable': {
      is_pushable: true,
      is_pushable_by_piston: true,
    },
  };

  if (entity.attackDamage && entity.attackDamage > 0) {
    components['minecraft:attack'] = {
      damage: entity.attackDamage,
    };
  }

  // Behavior AI goals
  if (entity.behaviorMelee) {
    components['minecraft:behavior.melee_attack'] = {
      priority: 2,
      speed_multiplier: 1.2,
      track_target: true,
    };
    components['minecraft:behavior.nearest_attackable_target'] = {
      priority: 3,
      entity_types: [
        {
          filters: {
            test: 'is_family',
            subject: 'other',
            value: 'player',
          },
          max_dist: 16,
        },
      ],
      must_see: true,
    };
  }

  if (entity.behaviorPanic) {
    components['minecraft:behavior.panic'] = {
      priority: 1,
      speed_multiplier: 1.5,
    };
  }

  if (entity.behaviorWander) {
    components['minecraft:behavior.random_stroll'] = {
      priority: 6,
      speed_multiplier: 0.8,
    };
  }

  if (entity.behaviorLookAtPlayer) {
    components['minecraft:behavior.look_at_player'] = {
      priority: 7,
      look_distance: 6.0,
      probability: 0.02,
    };
    components['minecraft:behavior.random_look_around'] = {
      priority: 8,
    };
  }

  if (entity.lootTableId) {
    components['minecraft:loot'] = `loot_tables/entities/${shortId}.json`;
  }

  return {
    format_version: '1.21.0',
    'minecraft:entity': {
      description: {
        identifier: entity.identifier,
        is_spawnable: true,
        is_summonable: true,
        is_experimental: false,
      },
      components,
    },
  };
}

/**
 * Generate Recipe JSON
 */
export function generateRecipeJson(recipe: BedrockRecipe) {
  if (recipe.type === 'shaped') {
    const grid = recipe.grid || Array(9).fill('');
    // Extract unique symbols
    const symbolMap: Record<string, string> = {};
    const keys: Record<string, { item: string }> = {};
    let charCode = 65; // 'A'

    const pattern: string[] = ['', '', ''];
    for (let r = 0; r < 3; r++) {
      let rowStr = '';
      for (let c = 0; c < 3; c++) {
        const item = grid[r * 3 + c];
        if (!item) {
          rowStr += ' ';
        } else {
          if (!symbolMap[item]) {
            const char = String.fromCharCode(charCode++);
            symbolMap[item] = char;
            keys[char] = { item };
          }
          rowStr += symbolMap[item];
        }
      }
      pattern[r] = rowStr;
    }

    return {
      format_version: '1.20.10',
      'minecraft:recipe_shaped': {
        description: {
          identifier: recipe.identifier,
        },
        tags: ['crafting_table'],
        pattern,
        key: keys,
        result: {
          item: recipe.outputItem,
          count: recipe.outputCount || 1,
        },
      },
    };
  }

  if (recipe.type === 'furnace') {
    return {
      format_version: '1.20.10',
      'minecraft:recipe_furnace': {
        description: {
          identifier: recipe.identifier,
        },
        tags: ['furnace', 'blast_furnace'],
        input: recipe.furnaceInput || 'minecraft:iron_ore',
        output: recipe.outputItem,
      },
    };
  }

  // Shapeless
  return {
    format_version: '1.20.10',
    'minecraft:recipe_shapeless': {
      description: {
        identifier: recipe.identifier,
      },
      tags: ['crafting_table'],
      ingredients: (recipe.ingredients || []).map((item) => ({ item })),
      result: {
        item: recipe.outputItem,
        count: recipe.outputCount || 1,
      },
    },
  };
}

/**
 * Generate Loot Table JSON
 */
export function generateLootTableJson(loot: BedrockLootTable) {
  return {
    pools: [
      {
        rolls: 1,
        entries: loot.entries.map((e) => ({
          type: 'item',
          name: e.item,
          weight: e.weight || 1,
          functions: [
            {
              function: 'set_count',
              count: {
                min: e.minCount || 1,
                max: e.maxCount || 1,
              },
            },
          ],
        })),
      },
    ],
  };
}

/**
 * Generate RP textures/item_texture.json
 */
export function generateItemTextureJson(project: AddonProject) {
  const textureData: Record<string, { textures: string }> = {};

  project.items.forEach((item) => {
    const shortId = item.identifier.includes(':') ? item.identifier.split(':')[1] : item.identifier;
    textureData[shortId] = {
      textures: `textures/items/${shortId}`,
    };
  });

  return {
    resource_pack_name: project.manifest.name,
    texture_name: 'atlas.items',
    texture_data: textureData,
  };
}

/**
 * Generate RP textures/terrain_texture.json
 */
export function generateTerrainTextureJson(project: AddonProject) {
  const textureData: Record<string, { textures: string }> = {};

  project.blocks.forEach((block) => {
    const shortId = block.identifier.includes(':') ? block.identifier.split(':')[1] : block.identifier;
    textureData[shortId] = {
      textures: `textures/blocks/${shortId}`,
    };
  });

  return {
    resource_pack_name: project.manifest.name,
    texture_name: 'atlas.terrain',
    texture_data: textureData,
  };
}

/**
 * Generate RP blocks.json
 */
export function generateRpBlocksJson(project: AddonProject) {
  const blocks: Record<string, any> = {};
  project.blocks.forEach((block) => {
    const shortId = block.identifier.includes(':') ? block.identifier.split(':')[1] : block.identifier;
    blocks[block.identifier] = {
      textures: shortId,
      sound: 'stone',
    };
  });
  return blocks;
}

/**
 * Generate Language localization text files (.lang)
 */
export function generateLangFile(project: AddonProject, lang: 'en' | 'ru' = 'ru') {
  const lines: string[] = [
    `pack.name=${project.manifest.name}`,
    `pack.description=${project.manifest.description}`,
    '',
  ];

  project.items.forEach((item) => {
    lines.push(`item.${item.identifier}=${item.name}`);
  });

  project.blocks.forEach((block) => {
    lines.push(`tile.${block.identifier}.name=${block.name}`);
  });

  project.entities.forEach((entity) => {
    lines.push(`entity.${entity.identifier}.name=${entity.name}`);
    lines.push(`item.spawn_egg.entity.${entity.identifier}.name=Создать: ${entity.name}`);
  });

  return lines.join('\n');
}

/**
 * Convert pixel data (array of hex strings or "") into PNG Data URL
 */
export function renderPixelDataToDataUrl(pixelData: string[], width: number = 16, height: number = 16): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const color = pixelData[idx];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generate a procedural pixel art texture for items/blocks if user hasn't drawn one
 */
export function generateDefaultPixelTexture(type: 'sword' | 'gem' | 'block' | 'food' | 'armor' | 'crown', primaryColor: string = '#3B82F6'): string[] {
  const pixels = Array(256).fill('');

  if (type === 'sword') {
    // 16x16 sword diagonal blade
    const bladeColor = primaryColor;
    const highlight = '#FFFFFF';
    const darkEdge = '#1E293B';
    const hilt = '#854D0E';
    const gold = '#EAB308';

    // Blade tip & diagonal line
    const coords = [
      [14, 1, highlight], [13, 2, bladeColor], [12, 3, bladeColor],
      [11, 4, bladeColor], [10, 5, bladeColor], [9, 6, bladeColor],
      [8, 7, bladeColor], [7, 8, bladeColor],
      // Blade width
      [13, 1, bladeColor], [12, 2, bladeColor], [11, 3, bladeColor],
      [10, 4, bladeColor], [9, 5, bladeColor], [8, 6, bladeColor],
      // Guard
      [8, 9, gold], [7, 9, gold], [6, 9, gold],
      [9, 8, gold], [9, 7, gold], [9, 6, gold],
      // Handle
      [5, 10, hilt], [4, 11, hilt],
      // Pommel
      [3, 12, gold], [2, 13, darkEdge]
    ];

    coords.forEach(([x, y, col]) => {
      const idx = (y as number) * 16 + (x as number);
      if (idx >= 0 && idx < 256) pixels[idx] = col as string;
    });
  } else if (type === 'block') {
    // Ore block or colored stone
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isEdge = x === 0 || y === 0 || x === 15 || y === 15;
        const baseStone = isEdge ? '#475569' : '#64748B';
        pixels[y * 16 + x] = baseStone;
      }
    }
    // Ore specks
    const specks = [
      [4, 4], [5, 4], [4, 5],
      [10, 6], [11, 6], [11, 7],
      [6, 11], [7, 11], [7, 12],
      [11, 11], [12, 11]
    ];
    specks.forEach(([x, y]) => {
      pixels[y * 16 + x] = primaryColor;
    });
  } else if (type === 'gem') {
    // Gem shape in center
    const gemCoords = [
      [7, 3], [8, 3],
      [6, 4], [7, 4], [8, 4], [9, 4],
      [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
      [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6],
      [6, 7], [7, 7], [8, 7], [9, 7],
      [6, 8], [7, 8], [8, 8], [9, 8],
      [7, 9], [8, 9],
      [7, 10], [8, 10],
      [7, 11], [8, 11]
    ];
    gemCoords.forEach(([x, y]) => {
      pixels[y * 16 + x] = primaryColor;
    });
    // highlight
    pixels[4 * 16 + 7] = '#FFFFFF';
    pixels[5 * 16 + 7] = '#FFFFFF';
  } else if (type === 'crown') {
    // 16x16 golden royal creator crown
    const gold = '#F59E0B';
    const darkGold = '#B45309';
    const lightGold = '#FDE68A';
    const ruby = '#EF4444';
    const emerald = '#10B981';
    const diamond = '#06B6D4';
    const white = '#FFFFFF';

    // Base rim of crown (rows 11 and 12)
    for (let x = 2; x <= 13; x++) {
      pixels[12 * 16 + x] = darkGold;
      pixels[11 * 16 + x] = gold;
    }
    // Gems in the base rim
    pixels[11 * 16 + 4] = ruby;
    pixels[11 * 16 + 7] = emerald;
    pixels[11 * 16 + 8] = diamond;
    pixels[11 * 16 + 11] = ruby;

    // Center peak (highest, x=7,8)
    pixels[5 * 16 + 7] = white;
    pixels[5 * 16 + 8] = lightGold;
    pixels[6 * 16 + 7] = emerald;
    pixels[6 * 16 + 8] = emerald;
    pixels[7 * 16 + 7] = gold;
    pixels[7 * 16 + 8] = gold;
    pixels[8 * 16 + 7] = gold;
    pixels[8 * 16 + 8] = gold;
    pixels[9 * 16 + 7] = gold;
    pixels[9 * 16 + 8] = gold;
    pixels[10 * 16 + 7] = gold;
    pixels[10 * 16 + 8] = gold;

    // Left peak (x=3,4)
    pixels[6 * 16 + 3] = white;
    pixels[6 * 16 + 4] = lightGold;
    pixels[7 * 16 + 3] = ruby;
    pixels[7 * 16 + 4] = gold;
    pixels[8 * 16 + 3] = gold;
    pixels[8 * 16 + 4] = gold;
    pixels[9 * 16 + 4] = gold;
    pixels[10 * 16 + 4] = gold;
    pixels[10 * 16 + 5] = gold;
    pixels[10 * 16 + 6] = gold;

    // Right peak (x=11,12)
    pixels[6 * 16 + 11] = lightGold;
    pixels[6 * 16 + 12] = white;
    pixels[7 * 16 + 11] = gold;
    pixels[7 * 16 + 12] = ruby;
    pixels[8 * 16 + 11] = gold;
    pixels[8 * 16 + 12] = gold;
    pixels[9 * 16 + 11] = gold;
    pixels[10 * 16 + 11] = gold;
    pixels[10 * 16 + 10] = gold;
    pixels[10 * 16 + 9] = gold;

    // Subtle sparkles
    pixels[4 * 16 + 2] = '#FEF08A';
    pixels[4 * 16 + 13] = '#FEF08A';
  } else {
    // Default 16x16 diamond badge
    for (let y = 4; y < 12; y++) {
      for (let x = 4; x < 12; x++) {
        pixels[y * 16 + x] = primaryColor;
      }
    }
    pixels[5 * 16 + 5] = '#FFFFFF';
  }

  return pixels;
}

/**
 * Default Bedrock Shaders configuration
 */
export const DEFAULT_SHADER_CONFIG: BedrockShaderConfig = {
  enabled: true,
  preset: 'ultra_realism',
  sunIntensity: 1.5,
  sunColor: '#FFF4E0',
  ambientLightIntensity: 0.45,
  ambientColor: '#88A3C7',
  fogStart: 0.15,
  fogEnd: 1.25,
  fogDensity: 0.04,
  fogColorDay: '#A8D2EB',
  fogColorSunset: '#F97316',
  fogColorNight: '#0B132B',
  waterFogDepth: 36,
  waterFogColor: '#0284C7',
  toneMapping: 'aces',
  exposure: 1.15,
  bloomIntensity: 0.85,
  bloomThreshold: 0.85,
  ssaoEnabled: true,
  ssaoRadius: 0.8,
  screenSpaceReflections: true,
  pbrGlobalRoughness: 0.45,
  pbrGlobalMetalness: 0.15,
  pbrEmissiveMultiplier: 2.2,
};

export const SHADER_PRESETS: Record<
  string,
  { name: string; desc: string; config: Partial<BedrockShaderConfig> }
> = {
  ultra_realism: {
    name: 'Ультра Реализм (RTX & PBR)',
    desc: 'Кинематографичный ACES тонемаппинг, мягкие тени, зеркальные отражения воды, SSAO и глубокий горизонт.',
    config: {
      preset: 'ultra_realism',
      sunIntensity: 1.6,
      sunColor: '#FFF7E6',
      ambientLightIntensity: 0.5,
      ambientColor: '#8EA4C7',
      fogStart: 0.2,
      fogEnd: 1.4,
      fogDensity: 0.035,
      fogColorDay: '#9FD4F5',
      fogColorSunset: '#FB923C',
      fogColorNight: '#0D1B2A',
      waterFogDepth: 42,
      waterFogColor: '#0284C7',
      toneMapping: 'aces',
      exposure: 1.15,
      bloomIntensity: 0.85,
      bloomThreshold: 0.85,
      ssaoEnabled: true,
      ssaoRadius: 0.8,
      screenSpaceReflections: true,
      pbrGlobalRoughness: 0.4,
      pbrGlobalMetalness: 0.2,
      pbrEmissiveMultiplier: 2.4,
    },
  },
  warm_aesthetic: {
    name: 'Тёплый Закат (Warm Aesthetic)',
    desc: 'Уютный золотистый свет, мягкий персиковый туман, нежные солнечные лучи и романтичная атмосфера.',
    config: {
      preset: 'warm_aesthetic',
      sunIntensity: 1.35,
      sunColor: '#FED7AA',
      ambientLightIntensity: 0.6,
      ambientColor: '#FDBA74',
      fogStart: 0.1,
      fogEnd: 1.1,
      fogDensity: 0.06,
      fogColorDay: '#FDBA74',
      fogColorSunset: '#EA580C',
      fogColorNight: '#1C1917',
      waterFogDepth: 30,
      waterFogColor: '#0EA5E9',
      toneMapping: 'neutral',
      exposure: 1.05,
      bloomIntensity: 0.95,
      bloomThreshold: 0.9,
      ssaoEnabled: true,
      ssaoRadius: 0.9,
      screenSpaceReflections: true,
      pbrGlobalRoughness: 0.55,
      pbrGlobalMetalness: 0.05,
      pbrEmissiveMultiplier: 1.8,
    },
  },
  gothic_dark: {
    name: 'Мрачный Незер и Тьма (Gothic Dark)',
    desc: 'Зловещая атмосфера тёмного фэнтези, плотный багровый туман, контрастные тени и таинственный тусклый свет.',
    config: {
      preset: 'gothic_dark',
      sunIntensity: 0.8,
      sunColor: '#FCA5A5',
      ambientLightIntensity: 0.25,
      ambientColor: '#3F3F46',
      fogStart: 0.05,
      fogEnd: 0.75,
      fogDensity: 0.12,
      fogColorDay: '#7F1D1D',
      fogColorSunset: '#450A0A',
      fogColorNight: '#09090B',
      waterFogDepth: 18,
      waterFogColor: '#7F1D1D',
      toneMapping: 'reinhard',
      exposure: 0.9,
      bloomIntensity: 1.3,
      bloomThreshold: 0.7,
      ssaoEnabled: true,
      ssaoRadius: 1.2,
      screenSpaceReflections: true,
      pbrGlobalRoughness: 0.7,
      pbrGlobalMetalness: 0.3,
      pbrEmissiveMultiplier: 3.5,
    },
  },
  neon_glow: {
    name: 'Неоновый Киберпанк (Neon Glow)',
    desc: 'Яркое свечение светящихся руд и блоков, глубокая ночь с фиолетовым светом, сочный футуристичный Bloom.',
    config: {
      preset: 'neon_glow',
      sunIntensity: 1.2,
      sunColor: '#E0E7FF',
      ambientLightIntensity: 0.35,
      ambientColor: '#6366F1',
      fogStart: 0.15,
      fogEnd: 1.2,
      fogDensity: 0.05,
      fogColorDay: '#A5B4FC',
      fogColorSunset: '#C084FC',
      fogColorNight: '#1E1B4B',
      waterFogDepth: 35,
      waterFogColor: '#06B6D4',
      toneMapping: 'aces',
      exposure: 1.2,
      bloomIntensity: 1.8,
      bloomThreshold: 0.65,
      ssaoEnabled: true,
      ssaoRadius: 0.7,
      screenSpaceReflections: true,
      pbrGlobalRoughness: 0.25,
      pbrGlobalMetalness: 0.45,
      pbrEmissiveMultiplier: 4.5,
    },
  },
};

function hexToRgbFloats(hex: string): [number, number, number] {
  let clean = (hex || '#FFFFFF').replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 1;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 1;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 1;
  return [parseFloat(r.toFixed(3)), parseFloat(g.toFixed(3)), parseFloat(b.toFixed(3))];
}

/**
 * Generate RP/lighting/global.json for Render Dragon Deferred Shaders
 */
export function generateLightingGlobalJson(shader: BedrockShaderConfig) {
  const [sr, sg, sb] = hexToRgbFloats(shader.sunColor);
  const [ar, ag, ab] = hexToRgbFloats(shader.ambientColor);

  return {
    format_version: '1.21.0',
    'minecraft:lighting_settings': {
      description: {
        identifier: 'custom:lighting_settings',
      },
      directional_lights: {
        sun: {
          illuminance: Math.round(100000 * (shader.sunIntensity || 1.5)),
          color: [sr, sg, sb],
        },
        moon: {
          illuminance: 0.3,
          color: [0.65, 0.75, 1.0],
        },
      },
      ambient_lighting: {
        color: [ar, ag, ab],
        intensity: shader.ambientLightIntensity || 0.45,
      },
      tone_mapping: {
        operator: shader.toneMapping || 'aces',
      },
      color_grading: {
        exposure: shader.exposure || 1.15,
        contrast: 1.05,
        saturation: 1.12,
      },
      bloom: {
        intensity: shader.bloomIntensity || 0.85,
        threshold: shader.bloomThreshold || 0.85,
      },
      shadows: {
        max_distance: 180.0,
      },
      ambient_occlusion: {
        enabled: shader.ssaoEnabled ?? true,
        radius: shader.ssaoRadius || 0.8,
      },
      reflections: {
        screen_space_enabled: shader.screenSpaceReflections ?? true,
      },
      pbr_materials: {
        global_roughness: shader.pbrGlobalRoughness || 0.45,
        global_metalness: shader.pbrGlobalMetalness || 0.15,
        emissive_multiplier: shader.pbrEmissiveMultiplier || 2.2,
      },
    },
  };
}

/**
 * Generate RP/fogs/custom_fog.json
 */
export function generateAtmosphericFogJson(shader: BedrockShaderConfig) {
  return {
    format_version: '1.21.0',
    'minecraft:fog_settings': {
      description: {
        identifier: 'custom:atmospheric_fog',
      },
      distance: {
        air: {
          fog_start: shader.fogStart || 0.15,
          fog_end: shader.fogEnd || 1.25,
          fog_color: shader.fogColorDay || '#A8D2EB',
          render_distance_type: 'render',
        },
        weather: {
          fog_start: 0.05,
          fog_end: 0.75,
          fog_color: '#4B5563',
          render_distance_type: 'render',
        },
      },
      volumetric: {
        density: {
          air: {
            max_density: shader.fogDensity || 0.04,
            zero_density_height: 192,
            max_density_height: 64,
          },
        },
        media_coefficients: {
          air: {
            scattering: [0.03, 0.05, 0.08],
            absorption: [0.01, 0.01, 0.02],
          },
        },
      },
    },
  };
}

/**
 * Generate RP/fogs/water_fog.json
 */
export function generateWaterFogJson(shader: BedrockShaderConfig) {
  return {
    format_version: '1.21.0',
    'minecraft:fog_settings': {
      description: {
        identifier: 'custom:water_fog',
      },
      distance: {
        water: {
          fog_start: 0.1,
          fog_end: shader.waterFogDepth || 36.0,
          fog_color: shader.waterFogColor || '#0284C7',
          render_distance_type: 'fixed',
        },
      },
    },
  };
}

/**
 * Generator for starter mythical item: "СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ"
 */
export function generateStarterCreatorItem(namespace: string): {
  item: BedrockItem;
  script: BedrockScript;
  texture: BedrockTexture;
} {
  const itemId = 'creator_some_guy';
  const fullIdentifier = `${namespace}:${itemId}`;
  const texId = 'tex_creator_some_guy';

  const item: BedrockItem = {
    id: itemId,
    name: 'СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ',
    identifier: fullIdentifier,
    category: 'Equipment',
    maxStack: 1,
    handEquipped: true,
    iconTextureId: texId,
    isWeapon: true,
    damage: 25,
    durability: 9999,
    foil: true,
    fireResistant: true,
    customComponentsJson: JSON.stringify(
      {
        'minecraft:rarity': 'epic',
        'minecraft:can_destroy_in_creative': false,
        'minecraft:hover_text_color': 'gold',
      },
      null,
      2
    ),
    scriptAction: 'Выдаётся автоматически игроку при первом появлении в мире с салютом и эффектами',
  };

  const script: BedrockScript = {
    id: 'script_starter_creator_item',
    filename: 'starter_creator_item.js',
    description: 'Торжественно выдает игроку предмет "СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ" при первом спавне',
    enabled: true,
    code: `import { world, system, ItemStack } from "@minecraft/server";

// Защита от повторной выдачи предмета через тег игрока
const TAG_STARTER_RECEIVED = "has_received_creator_item_v1";

world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  if (!player || !player.isValid) return;

  // Проверяем, получал ли уже игрок артефакт Создателя
  if (!player.hasTag(TAG_STARTER_RECEIVED)) {
    try {
      const inventory = player.getComponent("minecraft:inventory");
      if (inventory && inventory.container) {
        // Создаем священный артефакт Создателя
        const creatorItem = new ItemStack("${fullIdentifier}", 1);
        creatorItem.nameTag = "§6👑 СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ";
        creatorItem.setLore([
          "§d◆ Священный Артефакт Истинного Создателя",
          "§e◆ Выкован великим автором аддона",
          "§a◆ Урон: +25 | Прочность: 9999",
          "§b◆ Владелец: §f" + player.name,
          "§7Создатель: какой-то крутой чел"
        ]);

        inventory.container.addItem(creatorItem);
        player.addTag(TAG_STARTER_RECEIVED);

        // Торжественное оповещение в чат и спецэффекты
        system.run(() => {
          player.sendMessage("§6========================================");
          player.sendMessage("§e👑 §lВНИМАНИЕ! §r§6Вам передан священный артефакт:");
          player.sendMessage("§d✨ [СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ] ✨");
          player.sendMessage("§aСоздатель мира благословляет вас на великие победы!");
          player.sendMessage("§6========================================");

          // Звук победы, частицы и стартовые баффы
          try {
            player.runCommandAsync("playsound random.levelup @s ~ ~ ~ 1.0 1.2");
            player.runCommandAsync("particle minecraft:totem_particle ~ ~1 ~");
            player.runCommandAsync("effect @s regeneration 20 2 true");
            player.runCommandAsync("effect @s speed 30 1 true");
            player.runCommandAsync("effect @s resistance 30 1 true");
          } catch (cmdErr) {}
        });
      }
    } catch (err) {
      console.warn("[Addon] Не удалось выдать артефакт Создателя:", err);
    }
  }
});

console.warn("[Addon] Скрипт артефакта 'СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ' активен!");`,
  };

  const texture: BedrockTexture = {
    id: texId,
    name: itemId,
    type: 'item',
    width: 16,
    height: 16,
    pixelData: generateDefaultPixelTexture('crown', '#F59E0B'),
  };

  return { item, script, texture };
}

