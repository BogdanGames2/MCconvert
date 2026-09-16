import React from 'react';
import { APP_CHANGELOG } from '../data/changelog';
import { Sparkles, CheckCircle2, Bug, Zap, Tag, Calendar, Rocket } from 'lucide-react';

export const ChangelogView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Что нового в приложении</h2>
            <p className="text-xs text-slate-400">
              История версий, добавленные возможности, новые модули и исправленные баги
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-8">
          {APP_CHANGELOG.map((rel, index) => (
            <div
              key={rel.version}
              className={`relative pl-6 border-l-2 ${
                index === 0 ? 'border-emerald-500' : 'border-slate-800'
              } space-y-4`}
            >
              {/* Dot */}
              <div
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
                  index === 0
                    ? 'bg-emerald-500 border-slate-900 ring-4 ring-emerald-500/20'
                    : 'bg-slate-700 border-slate-900'
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold font-mono rounded-full ${
                      index === 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    v{rel.version}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                      АКТУАЛЬНАЯ ВЕРСИЯ
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-white">{rel.title}</h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{rel.date}</span>
                </div>
              </div>

              {/* Added Features */}
              <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Новые функции и модули ({rel.features.length})
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {rel.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bug Fixes */}
              {rel.bugFixes && rel.bugFixes.length > 0 && (
                <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-red-950/40">
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-red-400" />
                    Исправленные ошибки и баги ({rel.bugFixes.length})
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {rel.bugFixes.map((bug, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold shrink-0">•</span>
                        <span className="leading-relaxed">{bug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {rel.improvements && rel.improvements.length > 0 && (
                <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-sky-950/40">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-sky-400" />
                    Оптимизация и улучшения ({rel.improvements.length})
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {rel.improvements.map((imp, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <span className="text-sky-400 font-bold shrink-0">•</span>
                        <span className="leading-relaxed">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
