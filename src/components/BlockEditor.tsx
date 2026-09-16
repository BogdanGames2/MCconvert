import React, { useState } from 'react';
import { BedrockBlock, BedrockTexture } from '../types/addon';
import { Box, Plus, Trash2, Paintbrush, Code2, Copy, Check, Sun, ShieldAlert, Sparkles } from 'lucide-react';
import { generateBlockJson, renderPixelDataToDataUrl } from '../utils/bedrockGenerator';

interface BlockEditorProps {
  blocks: BedrockBlock[];
  textures: BedrockTexture[];
  namespace: string;
  onChange: (blocks: BedrockBlock[]) => void;
  onOpenTexturePainter: (textureId: string) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  textures,
  namespace,
  onChange,
  onOpenTexturePainter,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(blocks[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];

  const handleCreateBlock = () => {
    const newId = `block_${Date.now()}`;
    const newBlock: BedrockBlock = {
      id: newId,
      name: 'Новый Блок',
      identifier: `${namespace}:custom_block`,
      category: 'Construction',
      textureId: '',
      destructibleByMining: 2.0,
      blastResistance: 6.0,
      lightEmission: 0,
      friction: 0.6,
      flammable: false,
    };
    onChange([...blocks, newBlock]);
    setSelectedBlockId(newId);
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      alert('Нельзя удалить последний блок');
      return;
    }
    const filtered = blocks.filter((b) => b.id !== id);
    onChange(filtered);
    if (selectedBlockId === id) {
      setSelectedBlockId(filtered[0]?.id || '');
    }
  };

  const handleUpdateCurrent = (updates: Partial<BedrockBlock>) => {
    if (!selectedBlock) return;
    onChange(
      blocks.map((b) => (b.id === selectedBlock.id ? { ...b, ...updates } : b))
    );
  };

  const currentTexture = textures.find(
    (t) => t.id === selectedBlock?.textureId || t.name === selectedBlock?.identifier.split(':')[1]
  );
  const texturePreviewUrl = currentTexture ? renderPixelDataToDataUrl(currentTexture.pixelData, currentTexture.width, currentTexture.height) : '';

  const jsonOutput = selectedBlock ? JSON.stringify(generateBlockJson(selectedBlock), null, 2) : '{}';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Column: Block List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" />
            Блоки ({blocks.length})
          </h2>
          <button
            id="add-block-btn"
            onClick={handleCreateBlock}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[70vh] overflow-y-auto space-y-1.5 scrollbar-thin">
          {blocks.map((b) => {
            const isSelected = b.id === selectedBlock?.id;
            const tex = textures.find((t) => t.id === b.textureId || t.name === b.identifier.split(':')[1]);
            const url = tex ? renderPixelDataToDataUrl(tex.pixelData, tex.width, tex.height) : '';

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBlockId(b.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                    {url ? (
                      <img src={url} alt={b.name} className="w-6 h-6 object-contain image-rendering-pixelated" />
                    ) : (
                      <Box className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate text-slate-100">{b.name}</div>
                    <div className="text-[10px] font-mono text-emerald-400 truncate">{b.identifier}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {b.lightEmission > 0 && (
                    <span className="text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                      💡 {b.lightEmission}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBlock(b.id);
                    }}
                    className="p-1 hover:text-red-400 text-slate-500 transition"
                    title="Удалить блок"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Block Details */}
      {selectedBlock ? (
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {texturePreviewUrl ? (
                    <img
                      src={texturePreviewUrl}
                      alt={selectedBlock.name}
                      className="w-10 h-10 object-contain image-rendering-pixelated"
                    />
                  ) : (
                    <Box className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedBlock.name}</h3>
                  <span className="text-xs font-mono text-emerald-400">{selectedBlock.identifier}</span>
                </div>
              </div>

              <button
                onClick={() => onOpenTexturePainter(selectedBlock.textureId || selectedBlock.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Нарисовать текстуру</span>
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  value={selectedBlock.name}
                  onChange={(e) => handleUpdateCurrent({ name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Идентификатор (ID)
                </label>
                <input
                  type="text"
                  value={selectedBlock.identifier}
                  onChange={(e) => handleUpdateCurrent({ identifier: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Категория в инвентаре
                </label>
                <select
                  value={selectedBlock.category}
                  onChange={(e) => handleUpdateCurrent({ category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Construction">Construction (Строительные блоки)</option>
                  <option value="Nature">Nature (Природные блоки, руды)</option>
                  <option value="Items">Items (Механизмы, декорации)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Дроп при добыче (Loot drop)
                </label>
                <input
                  type="text"
                  placeholder="Оставьте пустым для выпадения самого себя"
                  value={selectedBlock.lootDropItem || ''}
                  onChange={(e) => handleUpdateCurrent({ lootDropItem: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                />
                <span className="text-[10px] text-slate-500">например: {namespace}:ruby_gem или minecraft:diamond</span>
              </div>
            </div>

            {/* Sliders & Physics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Время добычи (Прочность)
                  </label>
                  <span className="text-xs font-mono text-emerald-400">{selectedBlock.destructibleByMining}с</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="15.0"
                  step="0.1"
                  value={selectedBlock.destructibleByMining}
                  onChange={(e) => handleUpdateCurrent({ destructibleByMining: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[10px] text-slate-500">0.5 = земля, 1.5 = камень, 3.0 = обсидиан</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Взрывоустойчивость
                  </label>
                  <span className="text-xs font-mono text-emerald-400">{selectedBlock.blastResistance}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="50.0"
                  step="0.5"
                  value={selectedBlock.blastResistance}
                  onChange={(e) => handleUpdateCurrent({ blastResistance: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[10px] text-slate-500">6.0 = камень, 1200.0 = обсидиан</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Излучение света (0 - 15)
                  </label>
                  <span className="text-xs font-mono text-amber-400">{selectedBlock.lightEmission}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={selectedBlock.lightEmission}
                  onChange={(e) => handleUpdateCurrent({ lightEmission: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-slate-500">0 = нет света, 14 = факел, 15 = маяк/светокамень</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Трение (Скользкость)
                  </label>
                  <span className="text-xs font-mono text-sky-400">{selectedBlock.friction}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.02"
                  value={selectedBlock.friction}
                  onChange={(e) => handleUpdateCurrent({ friction: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500"
                />
                <span className="text-[10px] text-slate-500">0.6 = обычный блок, 0.98 = лед</span>
              </div>
            </div>

            {/* Checkbox toggles */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white max-w-xs">
                <input
                  type="checkbox"
                  checked={selectedBlock.flammable}
                  onChange={(e) => handleUpdateCurrent({ flammable: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                <span>Горючий блок (может сгореть от огня)</span>
              </label>
            </div>

            {/* Live Code Preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Сгенерированный JSON (BP/blocks/{selectedBlock.identifier.split(':')[1]}.json)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsonOutput);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-48 overflow-y-auto scrollbar-thin">
                {jsonOutput}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
