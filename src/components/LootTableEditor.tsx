import React, { useState } from 'react';
import { BedrockLootTable, BedrockLootPoolEntry, BedrockItem, BedrockBlock } from '../types/addon';
import { Gift, Plus, Trash2, Code2, Copy, Check } from 'lucide-react';
import { generateLootTableJson } from '../utils/bedrockGenerator';

interface LootTableEditorProps {
  lootTables: BedrockLootTable[];
  items: BedrockItem[];
  blocks: BedrockBlock[];
  namespace: string;
  onChange: (lootTables: BedrockLootTable[]) => void;
}

export const LootTableEditor: React.FC<LootTableEditorProps> = ({
  lootTables,
  items,
  namespace,
  onChange,
}) => {
  const [selectedId, setSelectedId] = useState<string>(lootTables[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedTable = lootTables.find((l) => l.id === selectedId) || lootTables[0];

  const handleCreateTable = () => {
    const newId = `loot_${Date.now()}`;
    const newTable: BedrockLootTable = {
      id: newId,
      identifier: `${namespace}:loot_${Date.now()}`,
      entries: [
        {
          item: items[0]?.identifier || 'minecraft:diamond',
          weight: 1,
          minCount: 1,
          maxCount: 2,
        },
      ],
    };
    onChange([...lootTables, newTable]);
    setSelectedId(newId);
  };

  const handleDeleteTable = (id: string) => {
    if (lootTables.length <= 1) {
      alert('Нельзя удалить последнюю таблицу лута');
      return;
    }
    const filtered = lootTables.filter((l) => l.id !== id);
    onChange(filtered);
    if (selectedId === id) {
      setSelectedId(filtered[0]?.id || '');
    }
  };

  const handleUpdateCurrent = (updates: Partial<BedrockLootTable>) => {
    if (!selectedTable) return;
    onChange(
      lootTables.map((t) => (t.id === selectedTable.id ? { ...t, ...updates } : t))
    );
  };

  const handleAddEntry = () => {
    if (!selectedTable) return;
    const newEntry: BedrockLootPoolEntry = {
      item: items[0]?.identifier || 'minecraft:gold_ingot',
      weight: 1,
      minCount: 1,
      maxCount: 3,
    };
    handleUpdateCurrent({ entries: [...selectedTable.entries, newEntry] });
  };

  const handleUpdateEntry = (index: number, updates: Partial<BedrockLootPoolEntry>) => {
    if (!selectedTable) return;
    const entries = [...selectedTable.entries];
    entries[index] = { ...entries[index], ...updates };
    handleUpdateCurrent({ entries });
  };

  const handleDeleteEntry = (index: number) => {
    if (!selectedTable || selectedTable.entries.length <= 1) return;
    const entries = selectedTable.entries.filter((_, idx) => idx !== index);
    handleUpdateCurrent({ entries });
  };

  const jsonOutput = selectedTable ? JSON.stringify(generateLootTableJson(selectedTable), null, 2) : '{}';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Column: List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-400" />
            Таблицы Лута ({lootTables.length})
          </h2>
          <button
            id="add-loot-btn"
            onClick={handleCreateTable}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[70vh] overflow-y-auto space-y-1.5 scrollbar-thin">
          {lootTables.map((lt) => {
            const isSelected = lt.id === selectedTable?.id;
            return (
              <div
                key={lt.id}
                onClick={() => setSelectedId(lt.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {lt.identifier.split(':')[1] || lt.identifier}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Элементов: {lt.entries.length}
                  </div>
                </div>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleDeleteTable(lt.id);
                  }}
                  className="p-1 hover:text-red-400 text-slate-500 transition"
                  title="Удалить таблицу"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Editor */}
      {selectedTable ? (
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Таблица дропа</h3>
                <span className="text-xs font-mono text-emerald-400">{selectedTable.identifier}</span>
              </div>
              <button
                onClick={handleAddEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить предмет</span>
              </button>
            </div>

            {/* Entries */}
            <div className="space-y-3">
              {selectedTable.entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Предмет (ID)</label>
                    <input
                      type="text"
                      value={entry.item}
                      onChange={(e) => handleUpdateEntry(idx, { item: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Количество (Мин - Макс)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={entry.minCount}
                        onChange={(e) => handleUpdateEntry(idx, { minCount: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-xs text-center bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                      <span className="text-slate-500">-</span>
                      <input
                        type="number"
                        min={1}
                        value={entry.maxCount}
                        onChange={(e) => handleUpdateEntry(idx, { maxCount: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-xs text-center bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 sm:pt-0">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Вес шанса</label>
                      <input
                        type="number"
                        min={1}
                        value={entry.weight}
                        onChange={(e) => handleUpdateEntry(idx, { weight: parseInt(e.target.value) || 1 })}
                        className="w-16 px-2 py-1.5 text-xs text-center bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    {selectedTable.entries.length > 1 && (
                      <button
                        onClick={() => handleDeleteEntry(idx)}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Удалить строку"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Code Preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Сгенерированный JSON (BP/loot_tables/{selectedTable.identifier.split(':')[1]}.json)
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
