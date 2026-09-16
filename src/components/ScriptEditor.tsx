import React, { useState } from 'react';
import { BedrockScript } from '../types/addon';
import { FileCode, Plus, Trash2, Play, Code2, Sparkles, Check, Copy } from 'lucide-react';

interface ScriptEditorProps {
  scripts: BedrockScript[];
  namespace: string;
  onChange: (scripts: BedrockScript[]) => void;
}

const SNIPPETS = [
  {
    title: '⚡ Молния при ударе',
    desc: 'Призывает молнию в цель при ударе кастомным мечом',
    code: `import { world, system } from "@minecraft/server";

world.afterEvents.entityHurt.subscribe((event) => {
  const attacker = event.damageSource.damagingEntity;
  const target = event.hurtEntity;

  if (attacker && attacker.typeId === "minecraft:player") {
    const equippable = attacker.getComponent("minecraft:equippable");
    const mainhand = equippable?.getEquipment("Mainhand");

    // Замените на ваш ID предмета
    if (mainhand && mainhand.typeId.includes("sword")) {
      const loc = target.location;
      system.run(() => {
        target.dimension.spawnEntity("minecraft:lightning_bolt", loc);
      });
    }
  }
});`,
  },
  {
    title: '💥 Магический фаербол при клике',
    desc: 'Запускает фаербол вперед при клике правой кнопкой',
    code: `import { world, system } from "@minecraft/server";

world.beforeEvents.itemUse.subscribe((event) => {
  const item = event.itemStack;
  const player = event.source;

  if (item && item.typeId.includes("staff")) {
    system.run(() => {
      const headLoc = player.getHeadLocation();
      const viewDir = player.getViewDirection();
      const spawnPos = {
        x: headLoc.x + viewDir.x * 2,
        y: headLoc.y + viewDir.y * 2,
        z: headLoc.z + viewDir.z * 2
      };
      
      const fireball = player.dimension.spawnEntity("minecraft:small_fireball", spawnPos);
      player.sendMessage("§c🔥 Запущено заклинание огня!");
    });
  }
});`,
  },
  {
    title: '📢 Приветствие при входе игрока',
    desc: 'Отправляет сообщение в чат и выдает стартовый предмет',
    code: `import { world, system, ItemStack } from "@minecraft/server";

world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  if (event.initialSpawn) {
    player.sendMessage("§aДобро пожаловать в мир с кастомным аддоном!");
    player.sendMessage("§eПриятной игры и крафта новых предметов!");
  }
});`,
  },
  {
    title: '⏱️ Интервальный таймер (каждые 5 сек)',
    desc: 'Запускает повторяющуюся логику через system.runInterval',
    code: `import { world, system } from "@minecraft/server";

// 100 тиков = 5 секунд (20 тиков = 1 секунда)
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    // Ваша периодическая логика здесь
  }
}, 100);`,
  },
];

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  scripts,
  namespace,
  onChange,
}) => {
  const [selectedId, setSelectedId] = useState<string>(scripts[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedScript = scripts.find((s) => s.id === selectedId) || scripts[0];

  const handleCreateScript = () => {
    const newId = `script_${Date.now()}`;
    const newScript: BedrockScript = {
      id: newId,
      filename: `script_${scripts.length + 1}.js`,
      description: 'Пользовательский скрипт Bedrock API',
      enabled: true,
      code: `import { world, system } from "@minecraft/server";

// Ваш Bedrock Scripting код здесь
console.warn("[MyMod] Скрипт запущен!");`,
    };
    onChange([...scripts, newScript]);
    setSelectedId(newId);
  };

  const handleDeleteScript = (id: string) => {
    if (scripts.length <= 1) {
      alert('Нельзя удалить последний скрипт');
      return;
    }
    const filtered = scripts.filter((s) => s.id !== id);
    onChange(filtered);
    if (selectedId === id) {
      setSelectedId(filtered[0]?.id || '');
    }
  };

  const handleUpdateCurrent = (updates: Partial<BedrockScript>) => {
    if (!selectedScript) return;
    onChange(
      scripts.map((s) => (s.id === selectedScript.id ? { ...s, ...updates } : s))
    );
  };

  const handleInsertSnippet = (code: string) => {
    if (!selectedScript) return;
    handleUpdateCurrent({ code: `${selectedScript.code}\n\n${code}` });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Column: Script list & snippets */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            Скрипты ({scripts.length})
          </h2>
          <button
            id="add-script-btn"
            onClick={handleCreateScript}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Создать</span>
          </button>
        </div>

        {/* Script tabs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 space-y-1.5">
          {scripts.map((s) => {
            const isSelected = s.id === selectedScript?.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-100 font-mono truncate">{s.filename}</div>
                  <div className="text-[10px] text-slate-400 truncate">{s.description}</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      onChange(
                        scripts.map((sc) => (sc.id === s.id ? { ...sc, enabled: e.target.checked } : sc))
                      );
                    }}
                    title="Включить в сборку"
                    className="rounded text-emerald-500"
                  />
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDeleteScript(s.id);
                    }}
                    className="p-1 hover:text-red-400 text-slate-500 transition"
                    title="Удалить скрипт"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Snippets library */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Готовые сниппеты кода
          </div>
          <div className="space-y-1.5">
            {SNIPPETS.map((snip, idx) => (
              <div
                key={idx}
                className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <div className="text-[11px] font-semibold text-white truncate">{snip.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{snip.desc}</div>
                </div>
                <button
                  onClick={() => handleInsertSnippet(snip.code)}
                  className="px-2 py-1 text-[10px] font-medium bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded border border-slate-700 transition shrink-0"
                >
                  Вставить
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Code Editor */}
      {selectedScript ? (
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedScript.filename}</h3>
                  <span className="text-[11px] text-slate-400">Модуль: @minecraft/server (Bedrock 1.21+)</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedScript.enabled}
                    onChange={(e) => handleUpdateCurrent({ enabled: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Включен в .mcaddon</span>
                </label>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedScript.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Описание назначения скрипта
              </label>
              <input
                type="text"
                value={selectedScript.description}
                onChange={(e) => handleUpdateCurrent({ description: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  JavaScript / Bedrock Scripting API код (scripts/main.js):
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">ES Modules (@minecraft/server)</span>
              </div>
              <textarea
                rows={16}
                value={selectedScript.code}
                onChange={(e) => handleUpdateCurrent({ code: e.target.value })}
                spellCheck={false}
                className="w-full p-3 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 focus:outline-none focus:border-emerald-500 scrollbar-thin leading-relaxed"
              />
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-amber-300">⚠️ Важное примечание:</span>
              <p>
                Для выполнения скриптов в Minecraft Bedrock Edition в параметрах мира ОБЯЗАТЕЛЬНО должен быть включен переключатель{' '}
                <strong className="text-white">"Бета-версии API" (Beta APIs)</strong> во вкладке "Эксперименты".
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
