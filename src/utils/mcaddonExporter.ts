import JSZip from 'jszip';
import { AddonProject } from '../types/addon';
import {
  generateBpManifest,
  generateRpManifest,
  generateItemJson,
  generateBlockJson,
  generateEntityJson,
  generateRecipeJson,
  generateLootTableJson,
  generateItemTextureJson,
  generateTerrainTextureJson,
  generateRpBlocksJson,
  generateLangFile,
  renderPixelDataToDataUrl,
  generateLightingGlobalJson,
  generateAtmosphericFogJson,
  generateWaterFogJson,
} from './bedrockGenerator';

/**
 * Creates a canvas-drawn pack_icon.png as base64 / blob
 */
export function generatePackIconBlob(title: string): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new Blob());
      return;
    }

    // Minecraft dirt & grass block style background
    const grad = ctx.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, '#10b981'); // Emerald green top
    grad.addColorStop(0.35, '#059669');
    grad.addColorStop(0.36, '#78350f'); // Dirt bottom
    grad.addColorStop(1, '#451a03');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Grid pixel overlay
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x < 128; x += 8) {
      ctx.fillRect(x, 0, 1, 128);
    }
    for (let y = 0; y < 128; y += 8) {
      ctx.fillRect(0, y, 128, 1);
    }

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 124);

    // Inner icon / text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('BEDROCK', 64, 45);
    ctx.fillText('MOD', 64, 68);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#fef08a';
    const cleanTitle = (title || 'ADDON').slice(0, 14);
    ctx.fillText(cleanTitle.toUpperCase(), 64, 92);

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
}

/**
 * Convert dataURL to Uint8Array for JSZip
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const byteString = atob(parts[1] || '');
  const array = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }
  return array;
}

/**
 * Build all folders & files for Behavior Pack inside a JSZip folder
 */
export async function populateBehaviorPack(zip: JSZip, project: AddonProject, packIconBlob: Blob) {
  // manifest.json
  zip.file('manifest.json', JSON.stringify(generateBpManifest(project), null, 2));

  // pack_icon.png
  zip.file('pack_icon.png', packIconBlob);

  // items/
  const itemsFolder = zip.folder('items');
  project.items.forEach((item) => {
    const shortId = item.identifier.includes(':') ? item.identifier.split(':')[1] : item.identifier;
    itemsFolder?.file(`${shortId}.json`, JSON.stringify(generateItemJson(item), null, 2));
  });

  // blocks/
  const blocksFolder = zip.folder('blocks');
  project.blocks.forEach((block) => {
    const shortId = block.identifier.includes(':') ? block.identifier.split(':')[1] : block.identifier;
    blocksFolder?.file(`${shortId}.json`, JSON.stringify(generateBlockJson(block), null, 2));
  });

  // entities/
  const entitiesFolder = zip.folder('entities');
  project.entities.forEach((entity) => {
    const shortId = entity.identifier.includes(':') ? entity.identifier.split(':')[1] : entity.identifier;
    entitiesFolder?.file(`${shortId}.json`, JSON.stringify(generateEntityJson(entity), null, 2));
  });

  // recipes/
  const recipesFolder = zip.folder('recipes');
  project.recipes.forEach((recipe) => {
    const shortId = recipe.identifier.includes(':') ? recipe.identifier.split(':')[1] : recipe.identifier;
    recipesFolder?.file(`${shortId}.json`, JSON.stringify(generateRecipeJson(recipe), null, 2));
  });

  // loot_tables/
  const lootFolder = zip.folder('loot_tables');
  project.lootTables.forEach((loot) => {
    const shortId = loot.identifier.includes(':') ? loot.identifier.split(':')[1] : loot.identifier;
    lootFolder?.file(`${shortId}.json`, JSON.stringify(generateLootTableJson(loot), null, 2));
  });

  // scripts/
  const hasScripts = project.scripts.some((s) => s.enabled && s.code.trim().length > 0);
  if (hasScripts) {
    const scriptsFolder = zip.folder('scripts');
    const combinedScripts = project.scripts
      .filter((s) => s.enabled)
      .map((s) => `// Script: ${s.filename} - ${s.description}\n${s.code}`)
      .join('\n\n');
    scriptsFolder?.file('main.js', combinedScripts);
  }
}

/**
 * Build all folders & files for Resource Pack inside a JSZip folder
 */
export async function populateResourcePack(zip: JSZip, project: AddonProject, packIconBlob: Blob) {
  // manifest.json
  zip.file('manifest.json', JSON.stringify(generateRpManifest(project), null, 2));

  // pack_icon.png
  zip.file('pack_icon.png', packIconBlob);

  // textures/
  const texturesFolder = zip.folder('textures');
  texturesFolder?.file('item_texture.json', JSON.stringify(generateItemTextureJson(project), null, 2));
  texturesFolder?.file('terrain_texture.json', JSON.stringify(generateTerrainTextureJson(project), null, 2));

  // blocks.json
  zip.file('blocks.json', JSON.stringify(generateRpBlocksJson(project), null, 2));

  // Textures for items
  const itemsTextureFolder = texturesFolder?.folder('items');
  for (const item of project.items) {
    const shortId = item.identifier.includes(':') ? item.identifier.split(':')[1] : item.identifier;
    const texObj = project.textures.find((t) => t.id === item.iconTextureId || t.name === shortId);
    let dataUrl = '';
    if (texObj && texObj.pixelData.length > 0) {
      dataUrl = renderPixelDataToDataUrl(texObj.pixelData, texObj.width || 16, texObj.height || 16);
    }
    if (dataUrl) {
      itemsTextureFolder?.file(`${shortId}.png`, dataUrlToUint8Array(dataUrl));
    }
  }

  // Textures for blocks
  const blocksTextureFolder = texturesFolder?.folder('blocks');
  for (const block of project.blocks) {
    const shortId = block.identifier.includes(':') ? block.identifier.split(':')[1] : block.identifier;
    const texObj = project.textures.find((t) => t.id === block.textureId || t.name === shortId);
    let dataUrl = '';
    if (texObj && texObj.pixelData.length > 0) {
      dataUrl = renderPixelDataToDataUrl(texObj.pixelData, texObj.width || 16, texObj.height || 16);
    }
    if (dataUrl) {
      blocksTextureFolder?.file(`${shortId}.png`, dataUrlToUint8Array(dataUrl));
    }
  }

  // texts/
  const textsFolder = zip.folder('texts');
  textsFolder?.file('en_US.lang', generateLangFile(project, 'en'));
  textsFolder?.file('ru_RU.lang', generateLangFile(project, 'ru'));

  // Bedrock Render Dragon Deferred Shaders
  if (project.shaders?.enabled) {
    const lightingFolder = zip.folder('lighting');
    lightingFolder?.file(
      'global.json',
      JSON.stringify(generateLightingGlobalJson(project.shaders), null, 2)
    );

    const fogsFolder = zip.folder('fogs');
    fogsFolder?.file(
      'custom_fog.json',
      JSON.stringify(generateAtmosphericFogJson(project.shaders), null, 2)
    );
    fogsFolder?.file(
      'water_fog.json',
      JSON.stringify(generateWaterFogJson(project.shaders), null, 2)
    );
  }
}

/**
 * Trigger browser download for a Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export full .mcaddon (Single container containing BP and RP)
 */
export async function exportMcAddon(project: AddonProject, autoDownload: boolean = true): Promise<Blob> {
  const zip = new JSZip();
  const packIconBlob = await generatePackIconBlob(project.manifest.name);

  // Minecraft Bedrock looks for BP and RP folders in .mcaddon
  const bpFolder = zip.folder(`${project.manifest.namespace}_BP`)!;
  const rpFolder = zip.folder(`${project.manifest.namespace}_RP`)!;

  await populateBehaviorPack(bpFolder, project, packIconBlob);
  await populateResourcePack(rpFolder, project, packIconBlob);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
  if (autoDownload) {
    triggerBlobDownload(blob, `${project.manifest.name || 'mod'}.mcaddon`);
  }
  return blob;
}

/**
 * Export Behavior Pack as .mcpack
 */
export async function exportBehaviorMcPack(project: AddonProject, autoDownload: boolean = true): Promise<Blob> {
  const zip = new JSZip();
  const packIconBlob = await generatePackIconBlob(`${project.manifest.name} BP`);
  await populateBehaviorPack(zip, project, packIconBlob);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
  if (autoDownload) {
    triggerBlobDownload(blob, `${project.manifest.name}_BP.mcpack`);
  }
  return blob;
}

/**
 * Export Resource Pack as .mcpack
 */
export async function exportResourceMcPack(project: AddonProject, autoDownload: boolean = true): Promise<Blob> {
  const zip = new JSZip();
  const packIconBlob = await generatePackIconBlob(`${project.manifest.name} RP`);
  await populateResourcePack(zip, project, packIconBlob);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
  if (autoDownload) {
    triggerBlobDownload(blob, `${project.manifest.name}_RP.mcpack`);
  }
  return blob;
}

/**
 * General export zip helper
 */
export async function exportZip(project: AddonProject, type: 'bp' | 'rp' | 'both' = 'both'): Promise<Blob> {
  if (type === 'bp') {
    return await exportBehaviorMcPack(project, true);
  } else if (type === 'rp') {
    return await exportResourceMcPack(project, true);
  } else {
    return await exportMcAddon(project, true);
  }
}
