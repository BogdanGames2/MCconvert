import React, { useState } from 'react';
import { BedrockRecipe, BedrockItem, BedrockBlock } from '../types/addon';
import { Hammer, Plus, Trash2, Flame, ArrowRight, Code2, Copy, Check } from 'lucide-react';
import { generateRecipeJson } from '../utils/bedrockGenerator';

interface RecipeEditorProps {
  recipes: BedrockRecipe[];
  items: BedrockItem[];
  blocks: BedrockBlock[];
  namespace: string;
  onChange: (recipes: BedrockRecipe[]) => void;
}

const COMMON_VANILLA_ITEMS = [
  { id: 'minecraft:stick', name: 'Палка' },
  { id: 'minecraft:iron_ingot', name: 'Железный слиток' },
  { id: 'minecraft:gold_ingot', name: 'Золотой слиток' },
  { id: 'minecraft:diamond', name: 'Алмаз' },
  { id: 'minecraft:netherite_ingot', name: 'Незеритовый слиток' },
  { id: 'minecraft:emerald', name: 'Изумруд' },
  { id: 'minecraft:redstone', name: 'Красная пыль' },
  { id: 'minecraft:blaze_rod', name: 'Стержень ифрита' },
  { id: 'minecraft:string', name: 'Нить' },
  { id: 'minecraft:leather', name: 'Кожа' },
  { id: 'minecraft:obsidian', name: 'Обсидиан' },
  { id: 'minecraft:glass', name: 'Стекло' },
  { id: 'minecraft:cobblestone', name: 'Булыжник' },
  { id: 'minecraft:oak_planks', name: 'Дубовые доски' },
];

export const RecipeEditor: React.FC<RecipeEditorProps> = ({
  recipes,
  items,
  blocks,
  namespace,
  onChange,
}) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [activeGridIndex, setActiveGridIndex] = useState<number | null>(null);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0];

  // List of available ingredients = custom items + custom blocks + vanilla items
  const allAvailableItems = [
    ...items.map((i) => ({ id: i.identifier, name: `${i.name} [Мод]` })),
    ...blocks.map((b) => ({ id: b.identifier, name: `${b.name} [Мод]` })),
    ...COMMON_VANILLA_ITEMS,
  ];

  const handleCreateRecipe = () => {
    const newId = `recipe_${Date.now()}`;
    const output = items[0]?.identifier || `${namespace}:ruby_sword`;
    const newRecipe: BedrockRecipe = {
      id: newId,
      identifier: `${namespace}:recipe_${Date.now()}`,
      type: 'shaped',
      outputItem: output,
      outputCount: 1,
      grid: Array(9).fill(''),
    };
    onChange([...recipes, newRecipe]);
    setSelectedRecipeId(newId);
  };

  const handleDeleteRecipe = (id: string) => {
    if (recipes.length <= 1) {
      alert('Нельзя удалить последний рецепт');
      return;
    }
    const filtered = recipes.filter((r) => r.id !== id);
    onChange(filtered);
    if (selectedRecipeId === id) {
      setSelectedRecipeId(filtered[0]?.id || '');
    }
  };

  const handleUpdateCurrent = (updates: Partial<BedrockRecipe>) => {
    if (!selectedRecipe) return;
    onChange(
      recipes.map((r) => (r.id === selectedRecipe.id ? { ...r, ...updates } : r))
    );
  };

  const handleSetGridCell = (cellIndex: number, itemId: string) => {
    if (!selectedRecipe) return;
    const newGrid = [...(selectedRecipe.grid || Array(9).fill(''))];
    newGrid[cellIndex] = itemId;
    handleUpdateCurrent({ grid: newGrid });
    setActiveGridIndex(null);
  };

  const jsonOutput = selectedRecipe ? JSON.stringify(generateRecipeJson(selectedRecipe), null, 2) : '{}';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Column: Recipe List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Hammer className="w-4 h-4 text-emerald-400" />
            Рецепты ({recipes.length})
          </h2>
          <button
            id="add-recipe-btn"
            onClick={handleCreateRecipe}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[70vh] overflow-y-auto space-y-1.5 scrollbar-thin">
          {recipes.map((r) => {
            const isSelected = r.id === selectedRecipe?.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRecipeId(r.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded bg-slate-950 flex items-center justify-center border border-slate-700">
                    {r.type === 'furnace' ? (
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <Hammer className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-100 truncate">
                      {r.outputItem.split(':')[1] || r.outputItem} x{r.outputCount}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">{r.type}</div>
                  </div>
                </div>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleDeleteRecipe(r.id);
                  }}
                  className="p-1 hover:text-red-400 text-slate-500 transition"
                  title="Удалить рецепт"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Recipe Editor */}
      {selectedRecipe ? (
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Рецепт крафта</h3>
                <span className="text-xs font-mono text-emerald-400">{selectedRecipe.identifier}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Тип рецепта:</span>
                <select
                  value={selectedRecipe.type}
                  onChange={(e) => handleUpdateCurrent({ type: e.target.value as any })}
                  className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="shaped">Верстак (Shaped 3x3)</option>
                  <option value="shapeless">Без формы (Shapeless)</option>
                  <option value="furnace">Печь / Выплавка (Furnace)</option>
                </select>
              </div>
            </div>

            {/* Output Item & Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Результат крафта (Предмет на выходе)
                </label>
                <select
                  value={selectedRecipe.outputItem}
                  onChange={(e) => handleUpdateCurrent({ outputItem: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-emerald-300 font-mono"
                >
                  {allAvailableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Количество на выходе
                </label>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={selectedRecipe.outputCount || 1}
                  onChange={(e) => handleUpdateCurrent({ outputCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Shaped 3x3 Grid Visual Designer */}
            {selectedRecipe.type === 'shaped' && (
              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-300 mb-2">
                  Сетка верстака 3x3 (нажмите на ячейку для выбора ингредиента):
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 justify-center py-4 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
                  {/* 3x3 Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-inner">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => {
                      const currentVal = selectedRecipe.grid?.[cellIdx] || '';
                      const itemObj = allAvailableItems.find((a) => a.id === currentVal);
                      const isPicking = activeGridIndex === cellIdx;

                      return (
                        <button
                          key={cellIdx}
                          type="button"
                          onClick={() => setActiveGridIndex(isPicking ? null : cellIdx)}
                          className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center p-1 border transition relative ${
                            isPicking
                              ? 'border-emerald-400 bg-emerald-950/80 ring-2 ring-emerald-500'
                              : currentVal
                              ? 'border-slate-600 bg-slate-800 hover:bg-slate-750 text-slate-200'
                              : 'border-slate-800 bg-slate-950/80 hover:bg-slate-800/50 text-slate-600'
                          }`}
                        >
                          {currentVal ? (
                            <span className="text-[9px] text-center font-mono font-bold leading-tight break-all line-clamp-2">
                              {itemObj ? itemObj.name.replace(/\[.*\]/, '') : currentVal.split(':')[1]}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">+</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Arrow & Output preview */}
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-6 h-6 text-slate-500" />
                    <div className="w-16 h-16 rounded-xl border-2 border-emerald-500/60 bg-emerald-950/40 flex flex-col items-center justify-center p-1.5 shadow-md relative">
                      <span className="text-[10px] text-center font-bold text-emerald-300 line-clamp-2">
                        {selectedRecipe.outputItem.split(':')[1] || selectedRecipe.outputItem}
                      </span>
                      <span className="absolute bottom-1 right-1 text-[11px] font-bold bg-slate-900 text-emerald-400 px-1 rounded">
                        x{selectedRecipe.outputCount || 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ingredient selector modal / popover when cell clicked */}
                {activeGridIndex !== null && (
                  <div className="mt-3 p-3 bg-slate-850 border border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>Выберите предмет для ячейки #{activeGridIndex + 1}:</span>
                      <button
                        onClick={() => handleSetGridCell(activeGridIndex, '')}
                        className="text-[11px] text-red-400 hover:underline"
                      >
                        Очистить ячейку
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                      {allAvailableItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSetGridCell(activeGridIndex, item.id)}
                          className="text-left px-2 py-1.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 truncate"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Furnace Smelting Mode */}
            {selectedRecipe.type === 'furnace' && (
              <div className="p-4 bg-slate-950/70 border border-orange-900/30 rounded-xl space-y-3">
                <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Параметры Переплавки в Печи
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Входной предмет (сырье для переплавки)
                  </label>
                  <select
                    value={selectedRecipe.furnaceInput || ''}
                    onChange={(e) => handleUpdateCurrent({ furnaceInput: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  >
                    {allAvailableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Live Code Preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Сгенерированный JSON (BP/recipes/{selectedRecipe.identifier.split(':')[1]}.json)
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
