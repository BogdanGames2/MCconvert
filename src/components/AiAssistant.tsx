import React, { useState } from 'react';
import { AddonProject, BedrockItem, BedrockBlock, BedrockEntity, BedrockRecipe, BedrockScript, BedrockShaderConfig } from '../types/addon';
import { Sparkles, Send, Bot, Wand2, Plus, Check, Loader2, MessageSquare, AlertTriangle, Code2, Sun } from 'lucide-react';
import { generateDefaultPixelTexture } from '../utils/bedrockGenerator';

interface AiAssistantProps {
  project: AddonProject;
  onAddItem: (item: BedrockItem) => void;
  onAddBlock: (block: BedrockBlock) => void;
  onAddEntity: (entity: BedrockEntity) => void;
  onAddRecipe: (recipe: BedrockRecipe) => void;
  onAddScript: (script: BedrockScript) => void;
  onUpdateShaders?: (shaders: BedrockShaderConfig) => void;
}

const PRESET_PROMPTS = [
  '👑 Стартовый священный предмет "СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ" со спецэффектами',
  '🌅 Реалистичные шейдеры с золотым солнцем, ACES тонемаппингом и мягким туманом',
  '⚔️ Огненный клинок титана с уроном 15 и эффектом взрыва',
  '🛡️ Непробиваемый щит дракона с высокой прочностью',
  '🌌 Неоновые шейдеры с ярким Bloom и фиолетовым свечением в ночи',
  '👾 Лавовый голем с 150 HP, атакующий зомби и игроков',
  '💎 Рубиновый лаки блок со случайным дропом через скрипты',
  '⚡ Посох вызова небесной молнии на Scripting API',
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  project,
  onAddItem,
  onAddBlock,
  onAddEntity,
  onAddRecipe,
  onAddScript,
  onUpdateShaders,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'generator' | 'chat'>('generator');
  const [prompt, setPrompt] = useState('');
  const [genType, setGenType] = useState<string>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedStatus, setAddedStatus] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Привет! Я AI-эксперт по разработке модов для Minecraft Bedrock Edition. Могу написать для тебя готовый JSON код предмета, блока, моба или скрипт на @minecraft/server, либо объяснить любые ошибки в игре!',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedResult(null);
    setAddedStatus(null);

    try {
      const res = await fetch('/api/gemini/generate-addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse,
          type: genType === 'auto' ? undefined : genType,
          currentAddon: {
            name: project.manifest.name,
            namespace: project.manifest.namespace,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Ошибка при генерации контента');
      }

      setGeneratedResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось связаться с сервером AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddGeneratedToProject = () => {
    if (!generatedResult) return;
    const r = generatedResult;
    const type = r.type || 'item';

    if (type === 'item') {
      const isWeapon = r.behaviorJson?.['minecraft:item']?.components?.['minecraft:damage'] !== undefined;
      const isFood = r.behaviorJson?.['minecraft:item']?.components?.['minecraft:food'] !== undefined;

      const newItem: BedrockItem = {
        id: `ai_${Date.now()}`,
        name: r.name || 'AI Предмет',
        identifier: r.identifier || `${project.manifest.namespace}:ai_item`,
        category: (r.category as any) || 'Equipment',
        maxStack: isWeapon ? 1 : 64,
        handEquipped: isWeapon,
        iconTextureId: '',
        isWeapon,
        damage: isWeapon ? r.behaviorJson?.['minecraft:item']?.components?.['minecraft:damage'] || 10 : undefined,
        durability: 1500,
        isFood,
        foodNutrition: isFood ? 6 : undefined,
        foil: true,
        customComponentsJson: JSON.stringify(r.behaviorJson?.['minecraft:item']?.components || {}, null, 2),
      };
      onAddItem(newItem);
      setAddedStatus('✅ Предмет успешно добавлен в проект!');
    } else if (type === 'block') {
      const newBlock: BedrockBlock = {
        id: `ai_${Date.now()}`,
        name: r.name || 'AI Блок',
        identifier: r.identifier || `${project.manifest.namespace}:ai_block`,
        category: 'Construction',
        textureId: '',
        destructibleByMining: 2.5,
        blastResistance: 10.0,
        lightEmission: 5,
        friction: 0.6,
        flammable: false,
      };
      onAddBlock(newBlock);
      setAddedStatus('✅ Блок успешно добавлен в проект!');
    } else if (type === 'entity') {
      const newEntity: BedrockEntity = {
        id: `ai_${Date.now()}`,
        name: r.name || 'AI Моб',
        identifier: r.identifier || `${project.manifest.namespace}:ai_mob`,
        health: r.behaviorJson?.['minecraft:entity']?.components?.['minecraft:health']?.value || 50,
        speed: 0.28,
        attackDamage: 8,
        isBoss: false,
        behaviorMelee: true,
        behaviorWander: true,
        behaviorPanic: false,
        behaviorLookAtPlayer: true,
      };
      onAddEntity(newEntity);
      setAddedStatus('✅ Моб успешно добавлен в проект!');
    } else if (type === 'script' || r.scriptCode) {
      const newScript: BedrockScript = {
        id: `ai_${Date.now()}`,
        filename: `${r.identifier?.split(':')[1] || 'ai_script'}.js`,
        description: r.summary || 'Скрипт сгенерированный AI',
        enabled: true,
        code: r.scriptCode || '// Script',
      };
      onAddScript(newScript);
      setAddedStatus('✅ Скрипт успешно добавлен в проект!');
    } else if (type === 'shader' || r.shaderConfig) {
      if (r.shaderConfig && onUpdateShaders) {
        onUpdateShaders({
          ...r.shaderConfig,
          enabled: true,
          preset: 'custom',
        });
        setAddedStatus('✅ Шейдеры успешно применены к проекту!');
      } else {
        setAddedStatus('Шейдер сгенерирован!');
      }
    } else {
      setAddedStatus('Контент добавлен!');
    }

    setTimeout(() => setAddedStatus(null), 4000);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatSending) return;
    const userMsg = { role: 'user' as const, text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          context: {
            manifest: project.manifest,
            itemsCount: project.items.length,
            blocksCount: project.blocks.length,
            entitiesCount: project.entities.length,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Ошибка в чате');
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ Ошибка: ${err.message || 'Не удалось получить ответ'}` },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sub tabs: Generator vs Chat */}
      <div className="flex items-center justify-center">
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('generator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'generator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>AI Генератор Модов</span>
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-300" />
            <span>AI Эксперт (Вопросы и Ошибки)</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'generator' ? (
        <div className="space-y-6">
          {/* Generator Input Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Создайте мод по текстовому описанию
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Опишите предмет, моба, блок или механику своими словами. AI автоматически построит корректные JSON файлы Bedrock 1.21+ и предложит добавить их в проект.
              </p>
            </div>

            {/* Prompt presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.slice(2).trim());
                    handleGenerate(p.slice(2).trim());
                  }}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-full border border-slate-700 transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input form */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="Например: Меч дракона с уроном 14, который стреляет молниями при атаке..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-850 border border-slate-700 rounded-xl text-slate-300"
                >
                  <option value="auto">Авто-определение</option>
                  <option value="shader">Шейдеры (Render Dragon)</option>
                  <option value="item">Только Предмет</option>
                  <option value="block">Только Блок</option>
                  <option value="entity">Только Моб</option>
                  <option value="script">Только Скрипт</option>
                </select>
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow transition shrink-0"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>{isGenerating ? 'Создаю...' : 'Сгенерировать'}</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Ошибка генерации:</div>
                  <div>{errorMsg}</div>
                </div>
              </div>
            )}
          </div>

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      {generatedResult.type || 'item'}
                    </span>
                    <h3 className="text-sm font-bold text-white">{generatedResult.name}</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 mt-1 block">
                    {generatedResult.identifier}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddGeneratedToProject}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить в проект</span>
                  </button>
                </div>
              </div>

              {addedStatus && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs text-emerald-200 font-medium">
                  {addedStatus}
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {generatedResult.summary}
              </p>

              {/* Behavior JSON Preview */}
              {generatedResult.behaviorJson && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    Behavior JSON (Поведение):
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-48 overflow-y-auto scrollbar-thin">
                    {JSON.stringify(generatedResult.behaviorJson, null, 2)}
                  </pre>
                </div>
              )}

              {/* Script code if applicable */}
              {generatedResult.scriptCode && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    Scripting API Код:
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-400 max-h-48 overflow-y-auto scrollbar-thin">
                    {generatedResult.scriptCode}
                  </pre>
                </div>
              )}

              {/* Shader Config if applicable */}
              {generatedResult.shaderConfig && (
                <div className="p-3.5 bg-slate-950 rounded-lg border border-amber-500/30 space-y-2">
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sun className="w-4 h-4" />
                    Параметры освещения и шейдеров (Render Dragon Deferred):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Солнце</span>
                      <span className="font-bold text-amber-400">{generatedResult.shaderConfig.sunIntensity}x</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Цвет солнца</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: generatedResult.shaderConfig.sunColor }} />
                        <span className="font-mono text-slate-200">{generatedResult.shaderConfig.sunColor}</span>
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Плотность тумана</span>
                      <span className="font-bold text-sky-400">{generatedResult.shaderConfig.fogDensity}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tone Mapping</span>
                      <span className="font-mono text-emerald-400 uppercase">{generatedResult.shaderConfig.toneMapping}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Chat Q&A mode */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              Minecraft Bedrock Ассистент
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Задайте любой вопрос по созданию модов, скриптам, ошибкам в Content Log или экспорту в Minecraft.
            </p>
          </div>

          <div className="space-y-3 min-h-[350px] max-h-[500px] overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 scrollbar-thin">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-emerald-300" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-850 border border-slate-750 text-slate-200 rounded-tl-none font-sans'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatSending && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>AI формулирует ответ...</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Спросите что угодно о Bedrock модах (например: как работает @minecraft/server)..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSendChat}
              disabled={isChatSending || !chatInput.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
