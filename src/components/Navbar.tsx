import React, { useState } from 'react';
import {
  Package,
  Sparkles,
  Sword,
  Box,
  Bot,
  ScrollText,
  FileCode,
  Palette,
  Download,
  HelpCircle,
  History,
  Layers,
  ChevronDown,
  Hammer,
  Gift,
  Sun,
} from 'lucide-react';
import { AddonTab, AddonProject } from '../types/addon';
import { STARTER_TEMPLATES } from '../utils/templates';

interface NavbarProps {
  currentTab: AddonTab;
  onTabChange: (tab: AddonTab) => void;
  project: AddonProject;
  onLoadTemplate: (templateProject: AddonProject) => void;
  onExport: (format: 'mcaddon' | 'bp' | 'rp' | 'zip') => void;
  isExporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  project,
  onLoadTemplate,
  onExport,
  isExporting,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const tabs: { id: AddonTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Манифест', icon: <Package className="w-4 h-4" /> },
    { id: 'items', label: 'Предметы', icon: <Sword className="w-4 h-4" />, badge: project.items.length },
    { id: 'blocks', label: 'Блоки', icon: <Box className="w-4 h-4" />, badge: project.blocks.length },
    { id: 'entities', label: 'Мобы', icon: <Bot className="w-4 h-4" />, badge: project.entities.length },
    { id: 'recipes', label: 'Крафты', icon: <Hammer className="w-4 h-4" />, badge: project.recipes.length },
    { id: 'loot', label: 'Лут', icon: <Gift className="w-4 h-4" />, badge: project.lootTables.length },
    { id: 'scripts', label: 'Скрипты', icon: <FileCode className="w-4 h-4" />, badge: project.scripts.length },
    { id: 'textures', label: 'Текстуры', icon: <Palette className="w-4 h-4" />, badge: project.textures.length },
    { id: 'shaders', label: 'Шейдеры', icon: <Sun className="w-4 h-4 text-amber-400" />, badge: project.shaders?.enabled ? 1 : undefined },
    { id: 'ai_assistant', label: 'AI Создатель', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { id: 'files', label: 'Файлы', icon: <Layers className="w-4 h-4" /> },
    { id: 'export', label: 'Установка', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'changelog', label: 'Что нового', icon: <History className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white shadow-md">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80">
        {/* Logo and Project Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-inner border border-emerald-400/30">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Bedrock Addon Creator
                <span className="text-[11px] font-medium bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  MCPE 1.21+
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-200 font-medium truncate max-w-[140px] sm:max-w-xs">{project.manifest.name}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{project.manifest.namespace}:*</span>
              <span>•</span>
              <span>v{project.manifest.version.join('.')}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Export */}
        <div className="flex items-center gap-2 relative">
          {/* Templates Dropdown */}
          <div className="relative">
            <button
              id="template-select-btn"
              onClick={() => {
                setShowTemplates(!showTemplates);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Шаблоны</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showTemplates && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 z-50 animate-in fade-in">
                <div className="text-xs font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Готовые шаблоны модов
                </div>
                {STARTER_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      if (confirm(`Загрузить шаблон "${tmpl.name}"? Текущий проект будет заменен.`)) {
                        onLoadTemplate(tmpl.project);
                        setShowTemplates(false);
                      }
                    }}
                    className="w-full text-left p-2 hover:bg-slate-700/70 rounded-lg transition group flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                        {tmpl.name}
                      </span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                        {tmpl.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button & Dropdown */}
          <div className="relative">
            <button
              id="export-mcaddon-btn"
              onClick={() => onExport('mcaddon')}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg shadow-sm transition border border-emerald-400/40"
              title="Скачать .mcaddon (один файл для импорта в Minecraft)"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Сборка...' : 'Скачать .mcaddon'}</span>
            </button>
          </div>

          <button
            id="more-export-opts-btn"
            onClick={() => {
              setShowExportMenu(!showExportMenu);
              setShowTemplates(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
            title="Другие форматы экспорта"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-10 mt-1 w-60 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 z-50">
              <div className="text-xs font-semibold text-slate-400 px-2 py-1">Форматы экспорта:</div>
              <button
                onClick={() => {
                  onExport('mcaddon');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-2 text-xs text-white hover:bg-slate-700 rounded-lg flex items-center justify-between"
              >
                <span>📦 .mcaddon (BP + RP вместе)</span>
                <span className="text-[10px] text-emerald-400">Рекомендуется</span>
              </button>
              <button
                onClick={() => {
                  onExport('bp');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded-lg"
              >
                ⚙️ .mcpack только Behavior Pack
              </button>
              <button
                onClick={() => {
                  onExport('rp');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded-lg"
              >
                🎨 .mcpack только Resource Pack
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="px-2 sm:px-4 flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-thin scrollbar-thumb-slate-700">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => {
                onTabChange(tab.id);
                setShowTemplates(false);
                setShowExportMenu(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
