import React from 'react';
import { BookOpen, CheckCircle, Smartphone, Monitor, AlertTriangle, Terminal, Sparkles } from 'lucide-react';

interface GuideViewProps {
  namespace: string;
}

export const GuideView: React.FC<GuideViewProps> = ({ namespace }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Инструкция по установке мода в Minecraft Bedrock</h2>
            <p className="text-xs text-slate-400">
              Пошаговый гайд по импорту .mcaddon на Windows, Android, iOS и настройке мира
            </p>
          </div>
        </div>

        {/* Step 1: Export */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            Скачайте аддон в формате .mcaddon
          </h3>
          <p className="text-xs text-slate-300 pl-8 leading-relaxed">
            Нажмите зелёную кнопку <strong className="text-emerald-400">«Экспорт .mcaddon»</strong> в правом верхнем углу приложения. Наш генератор мгновенно запакует Behavior Pack и Resource Pack в единый установщик.
          </p>
        </div>

        {/* Step 2: Open and Import */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            Импорт в игру на вашем устройстве
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                Windows 10 / 11 (ПК)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Просто дважды кликните левой кнопкой мыши по скачанному файлу <strong className="text-white">.mcaddon</strong>. Minecraft запустится автоматически, и вверху экрана появится уведомление: <span className="text-emerald-400">«Импорт запущен... Успешный импорт»</span>.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                Android / iOS (Телефон и Планшет)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Откройте любой проводник (Total Commander, ZArchiver или стандартные "Файлы"), нажмите на скачанный файл <strong className="text-white">.mcaddon</strong> и выберите пункт <strong className="text-white">«Открыть с помощью Minecraft»</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: World Settings and Experiments */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            Активация в настройках мира (Критически важно!)
          </h3>
          <div className="pl-8 space-y-3">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-200">
                1. В настройках создания или редактирования мира откройте разделы:
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside pl-2">
                <li><strong className="text-white">Наборы параметров (Behavior Packs)</strong> → Мои наборы → Нажмите «Активировать».</li>
                <li><strong className="text-white">Наборы ресурсов (Resource Packs)</strong> → Мои наборы → Нажмите «Активировать».</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Обязательно включите Эксперименты (Experiments)!
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Во вкладке <strong className="text-white">«Эксперименты»</strong> мира включите следующие тумблеры:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center gap-2 text-white">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Бета-версии API (Beta APIs)</span>
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center gap-2 text-white">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Holiday Creator Features</span>
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center gap-2 text-white">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Пользовательские биомы / блоки</span>
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center gap-2 text-white">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Предстоящие функции создателя</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: In Game Usage */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            Как получить предметы и мобов в игре
          </h3>
          <div className="pl-8 space-y-3">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300">
                Вы можете найти созданные предметы и блоки в инвентаре <strong className="text-white">Творческого режима (Creative Mode)</strong> во вкладках "Оружие", "Предметы" или "Строительство", либо выдать через чат командой:
              </p>
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded font-mono text-xs text-emerald-400 border border-slate-800">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span>/give @s {namespace}:ruby_sword</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded font-mono text-xs text-emerald-400 border border-slate-800">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span>/summon {namespace}:ruby_golem</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
