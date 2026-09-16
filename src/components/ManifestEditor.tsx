import React from 'react';
import { BedrockManifest } from '../types/addon';
import { RefreshCw, Key, ShieldCheck, Cpu, Sparkles } from 'lucide-react';
import { generateBedrockUuid } from '../utils/uuid';

interface ManifestEditorProps {
  manifest: BedrockManifest;
  onChange: (manifest: BedrockManifest) => void;
  onEnsureCreatorItem?: () => void;
  hasCreatorItem?: boolean;
}

export const ManifestEditor: React.FC<ManifestEditorProps> = ({
  manifest,
  onChange,
  onEnsureCreatorItem,
  hasCreatorItem = true,
}) => {
  const handleRegenerateUuids = () => {
    onChange({
      ...manifest,
      bpUuid: generateBedrockUuid(),
      bpModuleUuid: generateBedrockUuid(),
      rpUuid: generateBedrockUuid(),
      rpModuleUuid: generateBedrockUuid(),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              Манифест Аддона (manifest.json)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Базовые параметры вашего аддона. Minecraft Bedrock использует эти данные для регистрации набора параметров (Behavior Pack) и набора ресурсов (Resource Pack).
            </p>
          </div>
          <button
            id="regen-uuid-btn"
            onClick={handleRegenerateUuids}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            title="Сгенерировать новые UUID если мод конфликтует с существующим"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Обновить UUID</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Название аддона
            </label>
            <input
              type="text"
              value={manifest.name}
              onChange={(e) => onChange({ ...manifest, name: e.target.value })}
              placeholder="Например: Мод на Рубины"
              className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Namespace (Префикс предметов)
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={manifest.namespace}
                onChange={(e) => onChange({ ...manifest, namespace: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="my_mod"
                className="w-full px-3 py-2 text-sm font-mono bg-slate-800/80 border border-slate-700 rounded-lg text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Используется в ID: например, <code className="text-emerald-400">{manifest.namespace}:ruby_sword</code>
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Описание аддона
            </label>
            <textarea
              rows={2}
              value={manifest.description}
              onChange={(e) => onChange({ ...manifest, description: e.target.value })}
              placeholder="Краткое описание того, что добавляет данный аддон..."
              className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Автор / Создатель</label>
            <input
              type="text"
              value={manifest.author}
              onChange={(e) => onChange({ ...manifest, author: e.target.value })}
              placeholder="Ваш никнейм"
              className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Версия аддона</label>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="number"
                    min={0}
                    value={manifest.version[idx]}
                    onChange={(e) => {
                      const newV = [...manifest.version] as [number, number, number];
                      newV[idx] = parseInt(e.target.value) || 0;
                      onChange({ ...manifest, version: newV });
                    }}
                    className="w-full px-2 py-2 text-sm text-center font-mono bg-slate-800/80 border border-slate-700 rounded-lg text-white"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Целевая версия Bedrock</label>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="number"
                    min={0}
                    value={manifest.minEngineVersion[idx]}
                    onChange={(e) => {
                      const newEngine = [...manifest.minEngineVersion] as [number, number, number];
                      newEngine[idx] = parseInt(e.target.value) || 0;
                      onChange({ ...manifest, minEngineVersion: newEngine });
                    }}
                    className="w-full px-2 py-2 text-sm text-center font-mono bg-slate-800/80 border border-slate-700 rounded-lg text-emerald-400"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Starter Item: СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">👑</span>
              <h3 className="text-sm font-bold text-amber-300">
                Стартовый предмет: «СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ»
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                Легендарный
              </span>
            </div>
            <p className="text-xs text-slate-300">
              При входе в мир игроку выдается священный артефакт Создателя (+25 урона, прочность 9999, зачарованное сияние, праздничный салют и баффы).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onEnsureCreatorItem && !hasCreatorItem && (
              <button
                onClick={onEnsureCreatorItem}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition shadow"
              >
                + Создать предмет
              </button>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-500/30">
              <span className="text-xs font-semibold text-slate-200">
                {manifest.giveCreatorItemOnStart !== false ? 'Выдавать при старте' : 'Отключено'}
              </span>
              <input
                type="checkbox"
                checked={manifest.giveCreatorItemOnStart !== false}
                onChange={(e) =>
                  onChange({
                    ...manifest,
                    giveCreatorItemOnStart: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Experimental Toggles Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Экспериментальные функции Minecraft (Experimental Gameplay)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Для работы кастомных блоков, предметов и JavaScript скриптов в настройках мира Minecraft Bedrock необходимо активировать соответствующие переключатели.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: 'betaApis',
              title: 'Beta APIs (Скрипты @minecraft/server)',
              desc: 'Необходимо для кастомных эффектов, команд, слушателей событий и магии.',
            },
            {
              id: 'holidayCreatorFeatures',
              title: 'Праздничные возможности создателя',
              desc: 'Необходимо для кастомных блоков, предметов и рецептов в Bedrock.',
            },
            {
              id: 'renderDragonDeferred',
              title: 'Render Dragon Deferred (Шейдеры и RTX)',
              desc: 'Отложенное техническое превью: освещение, солнечные лучи, Bloom и туман.',
            },
            {
              id: 'upcomingCreatorFeatures',
              title: 'Будущие возможности создателя',
              desc: 'Поддержка новейших компонентов 1.21+ и расширенных сущностей.',
            },
            {
              id: 'customBiomes',
              title: 'Кастомные биомы',
              desc: 'Позволяет генерировать пользовательские биомы и структуры.',
            },
          ].map((item) => {
            const isChecked = manifest.experimentalFeatures[item.id as keyof typeof manifest.experimentalFeatures];
            return (
              <label
                key={item.id}
                className="flex items-start gap-3 p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    onChange({
                      ...manifest,
                      experimentalFeatures: {
                        ...manifest.experimentalFeatures,
                        [item.id]: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-600"
                />
                <div>
                  <div className="text-xs font-semibold text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* UUIDs Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-sky-400" />
          Уникальные идентификаторы (UUIDs)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Minecraft идентифицирует паки по уникальным UUID. Если вы обновляете мод, сохраняйте UUID. Если создаете новый отдельный мод, нажмите "Обновить UUID".
        </p>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Behavior Pack (Header):</span>
            <span className="text-emerald-400 select-all">{manifest.bpUuid}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Behavior Pack (Module):</span>
            <span className="text-emerald-400 select-all">{manifest.bpModuleUuid}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Resource Pack (Header):</span>
            <span className="text-sky-400 select-all">{manifest.rpUuid}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Resource Pack (Module):</span>
            <span className="text-sky-400 select-all">{manifest.rpModuleUuid}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
