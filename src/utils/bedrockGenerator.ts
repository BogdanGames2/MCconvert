import { AddonProject, BedrockItem, BedrockBlock, BedrockEntity, BedrockRecipe, BedrockLootTable, BedrockTexture } from '../types/addon';

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
  return {
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
export function generateDefaultPixelTexture(type: 'sword' | 'gem' | 'block' | 'food' | 'armor', primaryColor: string = '#3B82F6'): string[] {
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
