import { AddonProject } from '../types/addon';
import { generateBedrockUuid } from './uuid';
import { generateDefaultPixelTexture, generateStarterCreatorItem, DEFAULT_SHADER_CONFIG } from './bedrockGenerator';

const rubyCreatorKit = generateStarterCreatorItem('ruby');
const magicCreatorKit = generateStarterCreatorItem('magic');
const luckyCreatorKit = generateStarterCreatorItem('lucky');

export const STARTER_TEMPLATES: { id: string; name: string; description: string; tag: string; project: AddonProject }[] = [
  {
    id: 'ruby_set',
    name: 'Рубиновый Сет (Руда, Оружие, Моб)',
    description: 'Полный набор: рубиновая руда с дропом, светящийся рубиновый меч, рубиновый голем, рецепты и текстуры.',
    tag: 'Популярный',
    project: {
      manifest: {
        name: 'Рубиновый Сет',
        description: 'Добавляет рубины, рубиновый меч с уроном 11 и рубинового голема в Minecraft Bedrock!',
        author: 'BedrockModder',
        namespace: 'ruby',
        version: [1, 0, 0],
        minEngineVersion: [1, 21, 0],
        bpUuid: generateBedrockUuid(),
        bpModuleUuid: generateBedrockUuid(),
        rpUuid: generateBedrockUuid(),
        rpModuleUuid: generateBedrockUuid(),
        giveCreatorItemOnStart: true,
        experimentalFeatures: {
          betaApis: true,
          holidayCreatorFeatures: true,
          customBiomes: false,
          upcomingCreatorFeatures: true,
          renderDragonDeferred: true,
        },
      },
      items: [
        rubyCreatorKit.item,
        {
          id: 'ruby_sword',
          name: 'Рубиновый Меч',
          identifier: 'ruby:ruby_sword',
          category: 'Equipment',
          maxStack: 1,
          handEquipped: true,
          iconTextureId: 'tex_ruby_sword',
          isWeapon: true,
          damage: 11,
          durability: 2150,
          foil: true,
          repairItems: ['ruby:ruby_gem'],
        },
        {
          id: 'ruby_gem',
          name: 'Сияющий Рубин',
          identifier: 'ruby:ruby_gem',
          category: 'Items',
          maxStack: 64,
          handEquipped: false,
          iconTextureId: 'tex_ruby_gem',
        },
        {
          id: 'ruby_apple',
          name: 'Рубиновое Яблоко',
          identifier: 'ruby:ruby_apple',
          category: 'Nature',
          maxStack: 64,
          handEquipped: false,
          iconTextureId: 'tex_ruby_gem',
          isFood: true,
          foodNutrition: 8,
          foodSaturation: 'supernatural',
        },
      ],
      blocks: [
        {
          id: 'ruby_ore',
          name: 'Рубиновая Руда',
          identifier: 'ruby:ruby_ore',
          category: 'Nature',
          textureId: 'tex_ruby_ore',
          destructibleByMining: 3.5,
          blastResistance: 12.0,
          lightEmission: 4,
          friction: 0.6,
          flammable: false,
          lootDropItem: 'ruby:ruby_gem',
        },
        {
          id: 'ruby_block',
          name: 'Блок Рубина',
          identifier: 'ruby:ruby_block',
          category: 'Construction',
          textureId: 'tex_ruby_block',
          destructibleByMining: 4.0,
          blastResistance: 15.0,
          lightEmission: 7,
          friction: 0.6,
          flammable: false,
        },
      ],
      entities: [
        {
          id: 'ruby_golem',
          name: 'Рубиновый Защитник',
          identifier: 'ruby:ruby_golem',
          health: 120,
          speed: 0.28,
          attackDamage: 14,
          isBoss: false,
          behaviorMelee: true,
          behaviorWander: true,
          behaviorPanic: false,
          behaviorLookAtPlayer: true,
          lootTableId: 'loot_ruby_golem',
        },
      ],
      recipes: [
        {
          id: 'recipe_ruby_sword',
          identifier: 'ruby:recipe_ruby_sword',
          type: 'shaped',
          outputItem: 'ruby:ruby_sword',
          outputCount: 1,
          grid: [
            '', 'ruby:ruby_gem', '',
            '', 'ruby:ruby_gem', '',
            '', 'minecraft:stick', '',
          ],
        },
        {
          id: 'recipe_ruby_block',
          identifier: 'ruby:recipe_ruby_block',
          type: 'shaped',
          outputItem: 'ruby:ruby_block',
          outputCount: 1,
          grid: [
            'ruby:ruby_gem', 'ruby:ruby_gem', 'ruby:ruby_gem',
            'ruby:ruby_gem', 'ruby:ruby_gem', 'ruby:ruby_gem',
            'ruby:ruby_gem', 'ruby:ruby_gem', 'ruby:ruby_gem',
          ],
        },
        {
          id: 'recipe_smelt_ore',
          identifier: 'ruby:recipe_smelt_ore',
          type: 'furnace',
          outputItem: 'ruby:ruby_gem',
          outputCount: 1,
          furnaceInput: 'ruby:ruby_ore',
        },
      ],
      lootTables: [
        {
          id: 'loot_ruby_golem',
          identifier: 'ruby:loot_ruby_golem',
          entries: [
            { item: 'ruby:ruby_gem', weight: 1, minCount: 2, maxCount: 5 },
            { item: 'minecraft:iron_ingot', weight: 1, minCount: 3, maxCount: 8 },
          ],
        },
      ],
      scripts: [
        {
          id: 'script_combat',
          filename: 'ruby_effects.js',
          description: 'Воспроизводит частицы и взрывной эффект при атаке рубиновым мечом',
          enabled: true,
          code: `import { world, system } from "@minecraft/server";

// Событие нанесения урона сущности
world.afterEvents.entityHurt.subscribe((event) => {
  const damageSource = event.damageSource;
  const attacker = damageSource.damagingEntity;
  const hurtEntity = event.hurtEntity;

  if (attacker && attacker.typeId === "minecraft:player") {
    // Получаем предмет в руке игрока
    const equippable = attacker.getComponent("minecraft:equippable");
    if (equippable) {
      const mainhand = equippable.getEquipment("Mainhand");
      if (mainhand && mainhand.typeId === "ruby:ruby_sword") {
        // Создаем частицы огня и звук
        const dim = attacker.dimension;
        const pos = hurtEntity.location;
        dim.spawnParticle("minecraft:lava_particle", { x: pos.x, y: pos.y + 1, z: pos.z });
        attacker.runCommandAsync("playsound random.explode @a ~ ~ ~ 0.5 1.5");
      }
    }
  }
});

console.warn("[Ruby Addon] Скрипты Bedrock успешно загружены!");`,
        },
        rubyCreatorKit.script,
      ],
      textures: [
        rubyCreatorKit.texture,
        {
          id: 'tex_ruby_sword',
          name: 'ruby_sword',
          type: 'item',
          pixelData: generateDefaultPixelTexture('sword', '#DC2626'),
          width: 16,
          height: 16,
        },
        {
          id: 'tex_ruby_gem',
          name: 'ruby_gem',
          type: 'item',
          pixelData: generateDefaultPixelTexture('gem', '#EF4444'),
          width: 16,
          height: 16,
        },
        {
          id: 'tex_ruby_ore',
          name: 'ruby_ore',
          type: 'block',
          pixelData: generateDefaultPixelTexture('block', '#EF4444'),
          width: 16,
          height: 16,
        },
        {
          id: 'tex_ruby_block',
          name: 'ruby_block',
          type: 'block',
          pixelData: generateDefaultPixelTexture('block', '#B91C1C'),
          width: 16,
          height: 16,
        },
      ],
      shaders: DEFAULT_SHADER_CONFIG,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: 'magic_spells',
    name: 'Магия и Посохи (Magic Addon)',
    description: 'Огненный посох с молнией, магический алтарь и зелье маны со скриптовой магией @minecraft/server.',
    tag: 'Скрипты',
    project: {
      manifest: {
        name: 'Магия Стихий',
        description: 'Магические посохи, заклинания молний и алтарь магии для Minecraft Bedrock!',
        author: 'MageDev',
        namespace: 'magic',
        version: [1, 0, 0],
        minEngineVersion: [1, 21, 0],
        bpUuid: generateBedrockUuid(),
        bpModuleUuid: generateBedrockUuid(),
        rpUuid: generateBedrockUuid(),
        rpModuleUuid: generateBedrockUuid(),
        experimentalFeatures: {
          betaApis: true,
          holidayCreatorFeatures: true,
          customBiomes: false,
          upcomingCreatorFeatures: true,
        },
      },
      items: [
        {
          id: 'fire_staff',
          name: 'Посох Молний и Огня',
          identifier: 'magic:fire_staff',
          category: 'Equipment',
          maxStack: 1,
          handEquipped: true,
          iconTextureId: 'tex_fire_staff',
          isWeapon: true,
          damage: 9,
          durability: 850,
          foil: true,
          cooldownCategory: 'staff',
          cooldownDuration: 2.5,
        },
        {
          id: 'mana_elixir',
          name: 'Эликсир Маны',
          identifier: 'magic:mana_elixir',
          category: 'Nature',
          maxStack: 16,
          handEquipped: false,
          iconTextureId: 'tex_mana_elixir',
          isFood: true,
          foodNutrition: 4,
          foodSaturation: 'supernatural',
        },
      ],
      blocks: [
        {
          id: 'arcane_altar',
          name: 'Алтарь Стихий',
          identifier: 'magic:arcane_altar',
          category: 'Construction',
          textureId: 'tex_altar',
          destructibleByMining: 4.0,
          blastResistance: 20.0,
          lightEmission: 12,
          friction: 0.6,
          flammable: false,
        },
      ],
      entities: [
        {
          id: 'arcane_wisp',
          name: 'Дух Магии',
          identifier: 'magic:arcane_wisp',
          health: 45,
          speed: 0.35,
          attackDamage: 8,
          isBoss: false,
          behaviorMelee: true,
          behaviorWander: true,
          behaviorPanic: false,
          behaviorLookAtPlayer: true,
        },
      ],
      recipes: [
        {
          id: 'recipe_staff',
          identifier: 'magic:recipe_staff',
          type: 'shaped',
          outputItem: 'magic:fire_staff',
          outputCount: 1,
          grid: [
            '', '', 'minecraft:blaze_rod',
            '', 'minecraft:blaze_rod', '',
            'minecraft:stick', '', '',
          ],
        },
      ],
      lootTables: [],
      scripts: [
        {
          id: 'script_lightning',
          filename: 'spells.js',
          description: 'При клике правой кнопкой мыши по блоку посохом призывает молнию',
          enabled: true,
          code: `import { world, system } from "@minecraft/server";

// Клик предметом по блоку
world.beforeEvents.itemUseOn.subscribe((event) => {
  const item = event.itemStack;
  const player = event.source;

  if (item && item.typeId === "magic:fire_staff") {
    const block = event.block;
    const loc = block.location;

    // Запускаем призыв молнии
    system.run(() => {
      player.dimension.spawnEntity("minecraft:lightning_bolt", {
        x: loc.x + 0.5,
        y: loc.y + 1,
        z: loc.z + 0.5
      });
      player.sendMessage("§e⚡ Вы призвали небесную молнию!");
    });
  }
});`,
        },
      ],
      textures: [
        {
          id: 'tex_fire_staff',
          name: 'fire_staff',
          type: 'item',
          pixelData: generateDefaultPixelTexture('sword', '#F59E0B'),
          width: 16,
          height: 16,
        },
        {
          id: 'tex_mana_elixir',
          name: 'mana_elixir',
          type: 'item',
          pixelData: generateDefaultPixelTexture('gem', '#3B82F6'),
          width: 16,
          height: 16,
        },
        {
          id: 'tex_altar',
          name: 'arcane_altar',
          type: 'block',
          pixelData: generateDefaultPixelTexture('block', '#8B5CF6'),
          width: 16,
          height: 16,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: 'lucky_block',
    name: 'Счастливый Блок (Lucky Block)',
    description: 'Классический Лаки Блок для Minecraft Bedrock. При разрушении выпадает случайный лут или ловушка!',
    tag: 'Мини-игра',
    project: {
      manifest: {
        name: 'Lucky Block Bedrock',
        description: 'Случайные события и сюрпризы при разрушении блока удачи!',
        author: 'LuckyCreator',
        namespace: 'lucky',
        version: [1, 0, 0],
        minEngineVersion: [1, 21, 0],
        bpUuid: generateBedrockUuid(),
        bpModuleUuid: generateBedrockUuid(),
        rpUuid: generateBedrockUuid(),
        rpModuleUuid: generateBedrockUuid(),
        experimentalFeatures: {
          betaApis: true,
          holidayCreatorFeatures: true,
          customBiomes: false,
          upcomingCreatorFeatures: true,
        },
      },
      items: [
        {
          id: 'lucky_sword',
          name: 'Меч Удачи',
          identifier: 'lucky:lucky_sword',
          category: 'Equipment',
          maxStack: 1,
          handEquipped: true,
          iconTextureId: 'tex_lucky_sword',
          isWeapon: true,
          damage: 10,
          durability: 1500,
          foil: true,
        },
      ],
      blocks: [
        {
          id: 'lucky_block',
          name: 'Счастливый Блок (?)',
          identifier: 'lucky:lucky_block',
          category: 'Construction',
          textureId: 'tex_lucky_block',
          destructibleByMining: 0.8,
          blastResistance: 3.0,
          lightEmission: 5,
          friction: 0.6,
          flammable: false,
        },
      ],
      entities: [],
      recipes: [
        {
          id: 'recipe_lucky_block',
          identifier: 'lucky:recipe_lucky_block',
          type: 'shaped',
          outputItem: 'lucky:lucky_block',
          outputCount: 1,
          grid: [
            'minecraft:gold_ingot', 'minecraft:gold_ingot', 'minecraft:gold_ingot',
            'minecraft:gold_ingot', 'minecraft:dropper', 'minecraft:gold_ingot',
            'minecraft:gold_ingot', 'minecraft:gold_ingot', 'minecraft:gold_ingot',
          ],
        },
      ],
      lootTables: [],
      scripts: [
        {
          id: 'script_lucky_events',
          filename: 'lucky_events.js',
          description: 'Генерирует случайные награды при разрушении блока',
          enabled: true,
          code: `import { world, system, ItemStack } from "@minecraft/server";

const REWARDS = [
  { text: "§a💎 Алмазный дождь!", action: (dim, loc) => {
    dim.spawnEntity("minecraft:item", loc).getComponent("item")?.setItemStack(new ItemStack("minecraft:diamond", 5));
  }},
  { text: "§6🍎 Золотое яблоко бога!", action: (dim, loc) => {
    dim.spawnEntity("minecraft:item", loc).getComponent("item")?.setItemStack(new ItemStack("minecraft:enchanted_golden_apple", 1));
  }},
  { text: "§c💥 Опасный сюрприз!", action: (dim, loc) => {
    dim.spawnEntity("minecraft:tnt", loc);
  }},
  { text: "§e⚡ Сила грома!", action: (dim, loc) => {
    dim.spawnEntity("minecraft:lightning_bolt", loc);
  }}
];

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const block = event.brokenBlockPermutation;
  if (block.type.id === "lucky:lucky_block") {
    const player = event.player;
    const dim = player.dimension;
    const loc = event.block.location;

    const chosen = REWARDS[Math.floor(Math.random() * REWARDS.length)];
    player.sendMessage(chosen.text);
    chosen.action(dim, loc);
  }
});`,
        },
      ],
      textures: [
        {
          id: 'tex_lucky_sword',
          name: 'lucky_sword',
          type: 'item',
          pixelData: generateDefaultPixelTexture('sword', '#EAB308'),
          width: 16,
          height: 16,
        },
        {
          id: 'tex_lucky_block',
          name: 'lucky_block',
          type: 'block',
          pixelData: generateDefaultPixelTexture('block', '#EAB308'),
          width: 16,
          height: 16,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
];
