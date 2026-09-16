import React, { useState } from 'react';
import { BedrockShaderConfig, BedrockManifest } from '../types/addon';
import {
  DEFAULT_SHADER_CONFIG,
  SHADER_PRESETS,
  generateLightingGlobalJson,
  generateAtmosphericFogJson,
  generateWaterFogJson,
} from '../utils/bedrockGenerator';
import {
  Sun,
  CloudFog,
  Sparkles,
  Layers,
  RotateCcw,
  Check,
  Copy,
  Info,
  Sliders,
  Eye,
  Wand2,
  Droplet,
  Flame,
  ShieldAlert,
} from 'lucide-react';

interface ShadersViewProps {
  shaders?: BedrockShaderConfig;
  manifest: BedrockManifest;
  onChangeShaders: (shaders: BedrockShaderConfig) => void;
  onUpdateManifest: (manifest: BedrockManifest) => void;
  onNavigateToAi?: (prompt: string) => void;
}

export const ShadersView: React.FC<ShadersViewProps> = ({
  shaders = DEFAULT_SHADER_CONFIG,
  manifest,
  onChangeShaders,
  onUpdateManifest,
  onNavigateToAi,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'fog' | 'postprocess' | 'pbr' | 'code'>(
    'visual'
  );
  const [copied, setCopied] = useState(false);

  const currentConfig: BedrockShaderConfig = shaders.enabled
    ? shaders
    : { ...DEFAULT_SHADER_CONFIG, enabled: false };

  const updateField = <K extends keyof BedrockShaderConfig>(
    key: K,
    value: BedrockShaderConfig[K]
  ) => {
    onChangeShaders({
      ...currentConfig,
      [key]: value,
      preset: 'custom',
    });
  };

  const handleToggleEnabled = (enabled: boolean) => {
    onChangeShaders({
      ...currentConfig,
      enabled,
    });
    // Ensure renderDragonDeferred is enabled in manifest if shaders are on
    if (enabled && !manifest.experimentalFeatures?.renderDragonDeferred) {
      onUpdateManifest({
        ...manifest,
        experimentalFeatures: {
          ...manifest.experimentalFeatures,
          renderDragonDeferred: true,
        },
      });
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    const p = SHADER_PRESETS[presetKey];
    if (!p) return;
    onChangeShaders({
      ...currentConfig,
      ...p.config,
      enabled: true,
      preset: presetKey as any,
    });
    if (!manifest.experimentalFeatures?.renderDragonDeferred) {
      onUpdateManifest({
        ...manifest,
        experimentalFeatures: {
          ...manifest.experimentalFeatures,
          renderDragonDeferred: true,
        },
      });
    }
  };

  const handleResetDefaults = () => {
    onChangeShaders({ ...DEFAULT_SHADER_CONFIG, enabled: true });
  };

  const currentLightingJson = JSON.stringify(generateLightingGlobalJson(currentConfig), null, 2);
  const currentFogJson = JSON.stringify(generateAtmosphericFogJson(currentConfig), null, 2);
  const currentWaterFogJson = JSON.stringify(generateWaterFogJson(currentConfig), null, 2);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Master Switch */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Шейдеры Minecraft Bedrock (Render Dragon Deferred)
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    RTX / PBR 1.21+
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Настройка отложенного освещения (Deferred Lighting), объёмного тумана, солнечных лучей и PBR материалов
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition"
              title="Сбросить к настройкам ультра-реализма"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сброс</span>
            </button>

            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">
                {currentConfig.enabled ? 'Шейдеры активны' : 'Шейдеры выключены'}
              </span>
              <input
                type="checkbox"
                checked={currentConfig.enabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Status notice */}
        {!currentConfig.enabled && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              Шейдеры сейчас отключены в проекте. Включите галочку выше, чтобы в ресурс-пак добавились файлы{' '}
              <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-200">lighting/global.json</code> и{' '}
              <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-200">fogs/*.json</code>, а также активировались возможности трассировки лучей.
            </div>
          </div>
        )}
      </div>

      {/* Preset Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Быстрые графические пресеты
          </h3>
          {onNavigateToAi && (
            <button
              onClick={() => onNavigateToAi('Создай кинематографичные шейдеры для Minecraft Bedrock')}
              className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-medium transition"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Создать шейдер через AI</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(SHADER_PRESETS).map(([key, p]) => {
            const isSelected = currentConfig.preset === key;
            return (
              <div
                key={key}
                onClick={() => handleApplyPreset(key)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulated Live Realtime Preview Canvas / Scene */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-white">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Симуляция эффектов шейдера в реальном времени</span>
          </div>
          <span className="text-slate-400">
            Пресет: <strong className="text-amber-400">{currentConfig.preset}</strong> | Экспозиция:{' '}
            {currentConfig.exposure}x | Bloom: {currentConfig.bloomIntensity}
          </span>
        </div>

        {/* Interactive Simulated Minecraft World View */}
        <div
          className="w-full h-48 sm:h-64 rounded-xl overflow-hidden relative border border-slate-700/60 flex flex-col justify-between p-4 shadow-inner"
          style={{
            background: `linear-gradient(to bottom, ${currentConfig.ambientColor} 0%, ${currentConfig.fogColorDay} 55%, ${currentConfig.fogColorSunset} 80%, #1e293b 100%)`,
          }}
        >
          {/* Sun / Light orb */}
          <div
            className="absolute rounded-full pointer-events-none transition-all duration-300"
            style={{
              top: '20%',
              right: '25%',
              width: `${Math.max(40, Math.min(100, currentConfig.sunIntensity * 45))}px`,
              height: `${Math.max(40, Math.min(100, currentConfig.sunIntensity * 45))}px`,
              backgroundColor: currentConfig.sunColor,
              boxShadow: `0 0 ${currentConfig.bloomIntensity * 40 + 20}px ${
                currentConfig.bloomIntensity * 20 + 10
              }px ${currentConfig.sunColor}`,
              filter: `blur(${Math.max(0.5, 3 - currentConfig.bloomThreshold)}px)`,
            }}
          />

          {/* Distant Mountain Skyline / Fog Layer */}
          <div
            className="absolute inset-x-0 bottom-12 h-24 pointer-events-none transition-all"
            style={{
              background: `linear-gradient(to top, ${currentConfig.fogColorDay}cc 20%, transparent 100%)`,
              opacity: Math.min(1, currentConfig.fogDensity * 12 + 0.3),
            }}
          />

          {/* Water Surface reflection bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none transition-all flex items-center justify-center border-t border-sky-400/30"
            style={{
              background: `linear-gradient(to bottom, ${currentConfig.waterFogColor}99 0%, #031e33 100%)`,
              backdropFilter: currentConfig.screenSpaceReflections ? 'blur(2px)' : 'none',
            }}
          >
            <div className="text-[10px] text-sky-200/80 font-mono tracking-wide">
              Водная гладь (Прозрачность: {currentConfig.waterFogDepth} блоков, Отражения SSR:{' '}
              {currentConfig.screenSpaceReflections ? 'Вкл' : 'Выкл'})
            </div>
          </div>

          {/* Sample Block preview on left */}
          <div
            className="relative z-10 w-24 sm:w-28 p-2.5 rounded-lg border text-center shadow-lg transition-all"
            style={{
              backgroundColor: '#334155',
              borderColor: currentConfig.sunColor,
              boxShadow: currentConfig.ssaoEnabled
                ? `inset 0 0 ${currentConfig.ssaoRadius * 12}px #000000bb, 0 4px 12px #00000088`
                : '0 4px 12px #00000066',
            }}
          >
            <div className="text-[10px] font-bold text-white mb-1">PBR Блок</div>
            <div
              className="w-12 h-12 mx-auto rounded border border-white/20 flex items-center justify-center text-xs font-bold transition-all"
              style={{
                backgroundColor: currentConfig.sunColor,
                color: '#000',
                boxShadow: `0 0 ${currentConfig.pbrEmissiveMultiplier * 6}px ${currentConfig.sunColor}`,
                opacity: 0.9,
              }}
            >
              PBR
            </div>
            <div className="text-[9px] text-slate-300 mt-1 font-mono">
              Rough: {currentConfig.pbrGlobalRoughness}
            </div>
          </div>

          {/* Scene tags */}
          <div className="relative z-10 flex items-center justify-end gap-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-slate-950/80 text-white font-mono border border-slate-800">
              Tone: {currentConfig.toneMapping.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950/80 text-emerald-300 font-mono border border-slate-800">
              SSAO: {currentConfig.ssaoEnabled ? 'ON' : 'OFF'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950/80 text-sky-300 font-mono border border-slate-800">
              SSR: {currentConfig.screenSpaceReflections ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Editor Subtabs */}
      <div className="flex border-b border-slate-800 gap-2 pb-1 overflow-x-auto text-xs">
        {[
          { id: 'visual', label: 'Солнце и Освещение', icon: <Sun className="w-3.5 h-3.5" /> },
          { id: 'fog', label: 'Атмосфера и Туман', icon: <CloudFog className="w-3.5 h-3.5" /> },
          { id: 'postprocess', label: 'Bloom, Тонемаппинг & SSAO', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'pbr', label: 'PBR Материалы', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'code', label: 'JSON Код (global.json)', icon: <Sliders className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Sun & Lighting */}
      {activeSubTab === 'visual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sun Intensity */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Интенсивность солнца (Sun Intensity)</label>
                <span className="font-mono text-amber-400">{currentConfig.sunIntensity}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={currentConfig.sunIntensity}
                onChange={(e) => updateField('sunIntensity', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Яркость прямого направленного солнечного света и плотность отбрасываемых теней.
              </p>
            </div>

            {/* Sun Color */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Цвет солнечного света (Sun Color)</label>
                <span className="font-mono text-slate-300">{currentConfig.sunColor}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentConfig.sunColor}
                  onChange={(e) => updateField('sunColor', e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={currentConfig.sunColor}
                  onChange={(e) => updateField('sunColor', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-1.5 text-[10px]">
                {[
                  { name: 'Золотой', hex: '#FFF4E0' },
                  { name: 'Белый день', hex: '#FFFFFF' },
                  { name: 'Закат', hex: '#FB923C' },
                  { name: 'Мистик', hex: '#C084FC' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => updateField('sunColor', c.hex)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Intensity */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Рассеянное фоновое освещение (Ambient Intensity)</label>
                <span className="font-mono text-emerald-400">{currentConfig.ambientLightIntensity}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={currentConfig.ambientLightIntensity}
                onChange={(e) => updateField('ambientLightIntensity', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Освещённость теневых сторон блоков и пещер от небесного купола.
              </p>
            </div>

            {/* Ambient Color */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Цвет рассеянного света неба (Ambient Color)</label>
                <span className="font-mono text-slate-300">{currentConfig.ambientColor}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentConfig.ambientColor}
                  onChange={(e) => updateField('ambientColor', e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={currentConfig.ambientColor}
                  onChange={(e) => updateField('ambientColor', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fog & Atmosphere */}
      {activeSubTab === 'fog' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fog Start & End */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Начало тумана (Fog Start)</label>
                <span className="font-mono text-sky-400">{currentConfig.fogStart}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.02"
                value={currentConfig.fogStart}
                onChange={(e) => updateField('fogStart', parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Расстояние от игрока до точки, где воздух начинает мягко затуманиваться.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Конец тумана (Fog End)</label>
                <span className="font-mono text-sky-400">{currentConfig.fogEnd}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={currentConfig.fogEnd}
                onChange={(e) => updateField('fogEnd', parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Точка полного погружения горизонта в атмосферную дымку.
              </p>
            </div>

            {/* Volumetric Density */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Плотность объёмного тумана (Volumetric Density)</label>
                <span className="font-mono text-amber-400">{currentConfig.fogDensity}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.005"
                value={currentConfig.fogDensity}
                onChange={(e) => updateField('fogDensity', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Создаёт реалистичные видимые солнечные лучи (God Rays) при прохождении сквозь листву и облака.
              </p>
            </div>

            {/* Water Fog Depth */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Видимость под водой (Water Fog Depth)</label>
                <span className="font-mono text-sky-400">{currentConfig.waterFogDepth} блоков</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="1"
                value={currentConfig.waterFogDepth}
                onChange={(e) => updateField('waterFogDepth', parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Чем выше значение, тем прозрачнее и чище вода для исследователя.
              </p>
            </div>

            {/* Fog Colors */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">Цвет дневного тумана (Day Fog)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentConfig.fogColorDay}
                  onChange={(e) => updateField('fogColorDay', e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={currentConfig.fogColorDay}
                  onChange={(e) => updateField('fogColorDay', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">Цвет подводного тумана (Water Fog)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentConfig.waterFogColor}
                  onChange={(e) => updateField('waterFogColor', e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={currentConfig.waterFogColor}
                  onChange={(e) => updateField('waterFogColor', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Post-processing & Bloom & SSAO */}
      {activeSubTab === 'postprocess' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tone Mapping */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">
                Оператор цветокоррекции (Tone Mapping Operator)
              </label>
              <select
                value={currentConfig.toneMapping}
                onChange={(e) => updateField('toneMapping', e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="aces">ACES (Кинематографичный стандарт Голливуда)</option>
                <option value="reinhard">Reinhard (Мягкие тени и плавные переходы)</option>
                <option value="neutral">Neutral (Натуральные естественные цвета)</option>
                <option value="linear">Linear (Без сжатия динамического диапазона)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Определяет математику перевода HDR-освещения в отображаемый спектр монитора.
              </p>
            </div>

            {/* Exposure */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Экспозиция (Exposure)</label>
                <span className="font-mono text-amber-400">{currentConfig.exposure}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={currentConfig.exposure}
                onChange={(e) => updateField('exposure', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Общая яркость кадра, адаптирующаяся под зрение игрока.</p>
            </div>

            {/* Bloom Intensity */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Интенсивность свечения (Bloom Intensity)</label>
                <span className="font-mono text-purple-400">{currentConfig.bloomIntensity}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.5"
                step="0.05"
                value={currentConfig.bloomIntensity}
                onChange={(e) => updateField('bloomIntensity', parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Мягкое неоновое свечение вокруг факелов, лавы, солнца и светящихся руд.
              </p>
            </div>

            {/* Bloom Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Порог свечения (Bloom Threshold)</label>
                <span className="font-mono text-purple-400">{currentConfig.bloomThreshold}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={currentConfig.bloomThreshold}
                onChange={(e) => updateField('bloomThreshold', parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Минимальная яркость пикселя для появления ореола.</p>
            </div>

            {/* SSAO Toggle & Radius */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Затенение складок и углов (SSAO)</span>
                  <span className="text-[11px] text-slate-400">Screen-Space Ambient Occlusion</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentConfig.ssaoEnabled}
                  onChange={(e) => updateField('ssaoEnabled', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
              </label>

              {currentConfig.ssaoEnabled && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">Радиус окклюзии</span>
                    <span className="font-mono text-amber-400">{currentConfig.ssaoRadius}м</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={currentConfig.ssaoRadius}
                    onChange={(e) => updateField('ssaoRadius', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* SSR Reflections Toggle */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Зеркальные отражения в реальном времени</span>
                <span className="text-[11px] text-slate-400">Screen-Space Reflections (SSR) на воде и гладких блоках</span>
              </div>
              <input
                type="checkbox"
                checked={currentConfig.screenSpaceReflections}
                onChange={(e) => updateField('screenSpaceReflections', e.target.checked)}
                className="w-4 h-4 rounded text-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: PBR Materials */}
      {activeSubTab === 'pbr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <p className="text-xs text-slate-400">
            PBR (Physically Based Rendering) определяет взаимодействие света с текстурами: металличность (metalness), шероховатость (roughness) и излучение (emissive).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Глобальная шероховатость (Roughness)</label>
                <span className="font-mono text-amber-400">{currentConfig.pbrGlobalRoughness}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={currentConfig.pbrGlobalRoughness}
                onChange={(e) => updateField('pbrGlobalRoughness', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">0.0 = идеально полированное зеркало, 1.0 = матовая поверхность.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Глобальная металличность (Metalness)</label>
                <span className="font-mono text-sky-400">{currentConfig.pbrGlobalMetalness}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={currentConfig.pbrGlobalMetalness}
                onChange={(e) => updateField('pbrGlobalMetalness', parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Определяет проводящие свойства и хромовый отблеск.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Множитель свечения (Emissive)</label>
                <span className="font-mono text-purple-400">{currentConfig.pbrEmissiveMultiplier}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={currentConfig.pbrEmissiveMultiplier}
                onChange={(e) => updateField('pbrEmissiveMultiplier', parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Сила свечения руд, редстоуна и светящихся блоков ночью.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: JSON Code View */}
      {activeSubTab === 'code' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono text-amber-400 font-bold">RP/lighting/global.json</span>
              <button
                onClick={() => handleCopyCode(currentLightingJson)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 scrollbar-thin">
              {currentLightingJson}
            </pre>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono text-sky-400 font-bold">RP/fogs/custom_fog.json</span>
              <button
                onClick={() => handleCopyCode(currentFogJson)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 scrollbar-thin">
              {currentFogJson}
            </pre>
          </div>
        </div>
      )}

      {/* Activation Instructions Card for Minecraft */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          Как активировать новые шейдеры в Minecraft Bedrock
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <strong className="text-white block">Шаг 1: Экспорт</strong>
            <p className="text-slate-400">
              Нажмите кнопку «Экспорт .mcaddon» в правом верхнем углу и дважды кликните по файлу для установки в игру.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <strong className="text-white block">Шаг 2: Настройки мира</strong>
            <p className="text-slate-400">
              В параметрах мира включите пакет ресурсов аддона и пункт «Будущие возможности создателя» в Экспериментах.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <strong className="text-white block">Шаг 3: Видео-режим</strong>
            <p className="text-slate-400">
              В игре откройте «Настройки» → «Видео» → переключите режим графики на «Отложенное техническое превью (Deferred)».
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
