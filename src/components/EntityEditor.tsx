import React, { useState } from 'react';
import { BedrockEntity } from '../types/addon';
import { Bot, Plus, Trash2, Heart, Footprints, Flame, Code2, Copy, Check, Crown } from 'lucide-react';
import { generateEntityJson } from '../utils/bedrockGenerator';

interface EntityEditorProps {
  entities: BedrockEntity[];
  namespace: string;
  onChange: (entities: BedrockEntity[]) => void;
}

export const EntityEditor: React.FC<EntityEditorProps> = ({
  entities,
  namespace,
  onChange,
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || entities[0];

  const handleCreateEntity = () => {
    const newId = `entity_${Date.now()}`;
    const newEntity: BedrockEntity = {
      id: newId,
      name: 'Новый Моб',
      identifier: `${namespace}:custom_mob`,
      health: 30,
      speed: 0.28,
      attackDamage: 6,
      isBoss: false,
      behaviorMelee: true,
      behaviorWander: true,
      behaviorPanic: false,
      behaviorLookAtPlayer: true,
    };
    onChange([...entities, newEntity]);
    setSelectedEntityId(newId);
  };

  const handleDeleteEntity = (id: string) => {
    if (entities.length <= 1) {
      alert('Нельзя удалить последнюю сущность');
      return;
    }
    const filtered = entities.filter((e) => e.id !== id);
    onChange(filtered);
    if (selectedEntityId === id) {
      setSelectedEntityId(filtered[0]?.id || '');
    }
  };

  const handleUpdateCurrent = (updates: Partial<BedrockEntity>) => {
    if (!selectedEntity) return;
    onChange(
      entities.map((e) => (e.id === selectedEntity.id ? { ...e, ...updates } : e))
    );
  };

  const jsonOutput = selectedEntity ? JSON.stringify(generateEntityJson(selectedEntity), null, 2) : '{}';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Column: Entity List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            Сущности и Мобы ({entities.length})
          </h2>
          <button
            id="add-entity-btn"
            onClick={handleCreateEntity}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[70vh] overflow-y-auto space-y-1.5 scrollbar-thin">
          {entities.map((e) => {
            const isSelected = e.id === selectedEntity?.id;

            return (
              <div
                key={e.id}
                onClick={() => setSelectedEntityId(e.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate text-slate-100 flex items-center gap-1">
                      {e.name}
                      {e.isBoss && <Crown className="w-3 h-3 text-amber-400 inline" />}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 truncate">{e.identifier}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded border border-red-800/40">
                    ❤️ {e.health}
                  </span>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDeleteEntity(e.id);
                    }}
                    className="p-1 hover:text-red-400 text-slate-500 transition"
                    title="Удалить моба"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Entity Details */}
      {selectedEntity ? (
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {selectedEntity.name}
                    {selectedEntity.isBoss && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                        БОСС
                      </span>
                    )}
                  </h3>
                  <span className="text-xs font-mono text-emerald-400">{selectedEntity.identifier}</span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Имя моба
                </label>
                <input
                  type="text"
                  value={selectedEntity.name}
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
                  value={selectedEntity.identifier}
                  onChange={(e) => handleUpdateCurrent({ identifier: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-emerald-300"
                />
              </div>
            </div>

            {/* Combat and Health */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    Здоровье (HP)
                  </label>
                  <span className="text-xs font-mono text-red-400">{selectedEntity.health} HP</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={selectedEntity.health}
                  onChange={(e) => handleUpdateCurrent({ health: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <span className="text-[10px] text-slate-500">20 = игрок, 100 = железный голем, 300 = визер</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    Урон от атаки
                  </label>
                  <span className="text-xs font-mono text-orange-400">{selectedEntity.attackDamage}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedEntity.attackDamage}
                  onChange={(e) => handleUpdateCurrent({ attackDamage: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <span className="text-[10px] text-slate-500">0 = мирный, 3 = зомби, 12 = опустошитель</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5 text-sky-400" />
                    Скорость передвижения
                  </label>
                  <span className="text-xs font-mono text-sky-400">{selectedEntity.speed}</span>
                </div>
                <input
                  type="number"
                  step="0.02"
                  min="0.05"
                  max="1.0"
                  value={selectedEntity.speed}
                  onChange={(e) => handleUpdateCurrent({ speed: parseFloat(e.target.value) || 0.25 })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <span className="text-[10px] text-slate-500">0.23 = зомби, 0.28 = игрок, 0.35 = паук</span>
              </div>
            </div>

            {/* AI Behaviors */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">Поведение ИИ (AI Behaviors):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={selectedEntity.behaviorMelee}
                    onChange={(e) => handleUpdateCurrent({ behaviorMelee: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Атаковать игрока в ближнем бою</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={selectedEntity.behaviorWander}
                    onChange={(e) => handleUpdateCurrent({ behaviorWander: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Случайное блуждание (Wander)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={selectedEntity.behaviorPanic}
                    onChange={(e) => handleUpdateCurrent({ behaviorPanic: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Паниковать и убегать при ударе</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={selectedEntity.behaviorLookAtPlayer}
                    onChange={(e) => handleUpdateCurrent({ behaviorLookAtPlayer: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Смотреть на игрока рядом</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-800/70 rounded-lg cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={selectedEntity.isBoss}
                    onChange={(e) => handleUpdateCurrent({ isBoss: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>Является боссом (увеличенная модель)</span>
                </label>
              </div>
            </div>

            {/* Live Code Preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Сгенерированный JSON (BP/entities/{selectedEntity.identifier.split(':')[1]}.json)
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
