import React, { useState } from 'react';
import { BedrockItem, BedrockTexture } from '../types/addon';
import { Sword, Plus, Trash2, Sparkles, Apple, Shield, Paintbrush, Code2, Copy, Check } from 'lucide-react';
import { generateItemJson, renderPixelDataToDataUrl } from '../utils/bedrockGenerator';

interface ItemEditorProps {
  items: BedrockItem[];
  textures: BedrockTexture[];
  namespace: string;
  onChange: (items: BedrockItem[]) => void;
  onOpenTexturePainter: (textureId: string) => void;
}

export const ItemEditor: React.FC<ItemEditorProps> = ({
  items,
  textures,
  namespace,
  onChange,
  onOpenTexturePainter,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleCreateItem = () => {
    const newId = `item_${Date.now()}`;
    const newItem: BedrockItem = {
      id: newId,
      name: 'Новый Меч',
      identifier: `${namespace}:new_sword`,
      category: 'Equipment',
      maxStack: 1,
      handEquipped: true,
      iconTextureId: '',
      isWeapon: true,
      damage: 8,
      durability: 1200,
      foil: false,
    };
    onChange([...items, newItem]);
    setSelectedItemId(newId);
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      alert('Нельзя удалить последний предмет');
      return;
    }
    const filtered = items.filter((i) => i.id !== id);
    onChange(filtered);
    if (selectedItemId === id) {
      setSelectedItemId(filtered[0]?.id || '');
    }
  };

  const handleUpdateCurrent = (updates: Partial<BedrockItem>) => {
    if (!selectedItem) return;
    onChange(
      items.map((it) => (it.id === selectedItem.id ? { ...it, ...updates } : it))
    );
  };

  // Get preview texture
  const currentTexture = textures.find(
    (t) => t.id === selectedItem?.iconTextureId || t.name === selectedItem?.identifier.split(':')[1]
  );
  const texturePreviewUrl = currentTexture ? renderPixelDataToDataUrl(currentTexture.pixelData, currentTexture.width, currentTexture.height) : '';

  const jsonOutput = selectedItem ? JSON.stringify(generateItemJson(selectedItem), null, 2) : '{}';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Sidebar: Item List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sword className="w-4 h-4 text-emerald-400" />
            Предметы ({items.length})
          </h2>
          <button
            id="add-item-btn"
            onClick={handleCreateItem}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[70vh] overflow-y-auto space-y-1.5 scrollbar-thin">
          {items.map((it) => {
            const isSelected = it.id === selectedItem?.id;
            const tex = textures.find((t) => t.id === it.iconTextureId || t.name === it.identifier.split(':')[1]);
            const url = tex ? renderPixelDataToDataUrl(tex.pixelData, tex.width, tex.height) : '';

            return (
              <div
                key={it.id}
                onClick={() => setSelectedItemId(it.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                    {url ? (
                      <img src={url} alt={it.name} className="w-6 h-6 object-contain image-rendering-pixelated" />
                    ) : (
                      <Sword className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate text-slate-100">{it.name}</div>
                    <div className="text-[10px] font-mono text-emerald-400 truncate">{it.identifier}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {it.isWeapon && (
                    <span className="text-[10px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded border border-red-800/40">
                      ⚔️ {it.damage}
                    </span>
                  )}
                  {it.isFood && (
                    <span className="text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                      🍗 {it.foodNutrition}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(it.id);
                    }}
                    className="p-1 hover:text-red-400 text-slate-500 transition"
                    title="Удалить предмет"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Item Configurator */}
      {selectedItem ? (
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {texturePreviewUrl ? (
                    <img
                      src={texturePreviewUrl}
                      alt={selectedItem.name}
                      className="w-10 h-10 object-contain image-rendering-pixelated"
                    />
                  ) : (
                    <Sword className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedItem.name}</h3>
                  <span className="text-xs font-mono text-emerald-400">{selectedItem.identifier}</span>
                </div>
              </div>

              <button
                onClick={() => onOpenTexturePainter(selectedItem.iconTextureId || selectedItem.id)}
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
                  value={selectedItem.name}
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
                  value={selectedItem.identifier}
                  onChange={(e) => handleUpdateCurrent({ identifier: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Категория в инвентаре
                </label>
                <select
                  value={selectedItem.category}
                  onChange={(e) => handleUpdateCurrent({ category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Equipment">Equipment (Оружие / Броня)</option>
                  <option value="Items">Items (Материалы / Разное)</option>
                  <option value="Nature">Nature (Еда / Природа)</option>
                  <option value="Construction">Construction (Строительство)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Максимальный стак
                </label>
                <select
                  value={selectedItem.maxStack}
                  onChange={(e) => handleUpdateCurrent({ maxStack: parseInt(e.target.value) || 64 })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="1">1 (Оружие, броня, инструменты)</option>
                  <option value="16">16 (Жемчуг края, снежки)</option>
                  <option value="64">64 (Стандартный стак)</option>
                </select>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={selectedItem.handEquipped}
                  onChange={(e) => handleUpdateCurrent({ handEquipped: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                <span>3D в руке</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={selectedItem.foil}
                  onChange={(e) => handleUpdateCurrent({ foil: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                <span>Свечение (Foil)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={selectedItem.isWeapon}
                  onChange={(e) => handleUpdateCurrent({ isWeapon: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                <span>Оружие/Инструмент</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={selectedItem.isFood}
                  onChange={(e) => handleUpdateCurrent({ isFood: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                <span>Еда/Зелье</span>
              </label>
            </div>

            {/* Weapon Details */}
            {selectedItem.isWeapon && (
              <div className="p-4 bg-slate-950/70 border border-red-900/30 rounded-xl space-y-3">
                <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Параметры Оружия и Прочности
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Урон от атаки (сердечки)</label>
                    <input
                      type="number"
                      min={1}
                      value={selectedItem.damage || 7}
                      onChange={(e) => handleUpdateCurrent({ damage: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Максимальная прочность</label>
                    <input
                      type="number"
                      min={0}
                      value={selectedItem.durability || 1561}
                      onChange={(e) => handleUpdateCurrent({ durability: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Перезарядка (сек)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={selectedItem.cooldownDuration || 0}
                      onChange={(e) =>
                        handleUpdateCurrent({
                          cooldownDuration: parseFloat(e.target.value) || 0,
                          cooldownCategory: selectedItem.cooldownCategory || 'attack',
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Food Details */}
            {selectedItem.isFood && (
              <div className="p-4 bg-slate-950/70 border border-amber-900/30 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Apple className="w-4 h-4" />
                  Параметры Питания
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Восстановление голода (едениц)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedItem.foodNutrition || 4}
                      onChange={(e) => handleUpdateCurrent({ foodNutrition: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Насыщение (Saturation)</label>
                    <select
                      value={selectedItem.foodSaturation || 'normal'}
                      onChange={(e) => handleUpdateCurrent({ foodSaturation: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="low">Низкое (ягоды)</option>
                      <option value="normal">Обычное (хлеб, яблоки)</option>
                      <option value="good">Хорошее (жареное мясо)</option>
                      <option value="supernatural">Сверхъестественное (золотая морковь)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Live Code Preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Сгенерированный JSON (BP/items/{selectedItem.identifier.split(':')[1]}.json)
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
