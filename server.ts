import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI initialization
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// AI Bedrock Addon Generator
app.post('/api/gemini/generate-addon', async (req, res) => {
  try {
    const { prompt, type, currentAddon } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in settings. You can create items manually or add your key.',
      });
    }

    const systemInstruction = `You are an elite Minecraft Bedrock Edition (Bedrock Add-Ons / MCPE) developer and JSON schema expert.
Generate valid, compliant Minecraft Bedrock 1.21+ Addon components based on the user's prompt.
Supported types:
- 'item': A custom item with format_version 1.21.0 or 1.20.80, components such as minecraft:icon, minecraft:display_name, minecraft:damage, minecraft:food, minecraft:durability, minecraft:hand_equipped, minecraft:max_stack_size, etc.
- 'block': A custom block with format_version 1.21.0, components such as minecraft:destructible_by_mining, minecraft:friction, minecraft:light_emission, minecraft:geometry, minecraft:material_instances, etc.
- 'entity': A custom entity (behavior JSON) format_version 1.21.0 with components (minecraft:health, minecraft:movement, minecraft:behavior.*, minecraft:loot, etc.).
- 'recipe': A recipe JSON (shaped, shapeless, furnace).
- 'script': JavaScript / TypeScript code using @minecraft/server (Bedrock Script API 1.13.0+ / 1.21+) with world.beforeEvents, world.afterEvents, system.runInterval, etc.
- 'full_addon': A comprehensive mod description with items, blocks, entities, and recipes.

Always return a clean JSON object with this exact structure:
{
  "name": "Human-readable name (Russian or English depending on prompt)",
  "identifier": "custom_namespace:item_or_block_name",
  "category": "Equipment" | "Items" | "Nature" | "Construction" | "Spawn Eggs",
  "type": "item" | "block" | "entity" | "recipe" | "script",
  "summary": "Brief explanation of what was created and how it works in Minecraft Bedrock",
  "behaviorJson": { ... valid Bedrock behavior JSON ... },
  "resourceJson": { ... valid Bedrock resource JSON (client entity, item texture definition, or block textures) ... },
  "scriptCode": "... optional Bedrock Script API code if applicable ...",
  "recipeJson": { ... optional recipe definition if applicable ... },
  "lootTableJson": { ... optional loot table if applicable ... },
  "recommendedTextureColor": "#HEX color code representing the theme (e.g. #FF4500 for fire ruby)"
}
Return ONLY valid JSON matching this structure without Markdown backticks or wrapping text.`;

    const userPrompt = `Create Minecraft Bedrock Addon content for: "${prompt}".
Type requested: ${type || 'auto-detect'}.
Current addon context namespace: ${currentAddon?.namespace || 'my_mod'}.
Make sure JSON follows modern Bedrock 1.20.80 - 1.21+ syntax!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    let parsed;
    try {
      parsed = JSON.parse(text || '{}');
    } catch {
      // Clean possible backticks
      const clean = (text || '').replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(clean);
    }

    res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-addon:', error);
    res.status(500).json({ error: error.message || 'Failed to generate addon content' });
  }
});

// AI Assistant Chat for Bedrock questions & debugging
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in settings. You can still use all visual builders, templates, and export tools!',
      });
    }

    const systemInstruction = `Ты — профессиональный эксперт и разработчик модов для Minecraft Bedrock Edition (MCPE / Windows / iOS / Android).
Ты знаешь всё о:
- Behavior Packs (BP) и Resource Packs (RP)
- Структуре manifest.json (UUID, min_engine_version, modules)
- Minecraft Bedrock Scripting API (@minecraft/server, @minecraft/server-ui)
- Создании кастомных предметов, блоков (1.21.0), мобов, анимаций, геометрии (Blockbench)
- Исправлении ошибок (Content Log errors, missing texture, UUID mismatch, experimental toggles: Beta APIs, Holiday Creator Features)
- Экспорте в .mcaddon и .mcpack

Отвечай понятно, дружелюбно, подробно и на русском языке, давай конкретные примеры JSON и JS кода, если нужно.`;

    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    if (context) {
      contents.unshift({
        role: 'user',
        parts: [{ text: `[Контекст текущего аддона пользователя: ${JSON.stringify(context)}]` }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ error: error.message || 'Chat generation failed' });
  }
});

// Setup Vite or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
