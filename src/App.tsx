import React, { useState, useEffect, useRef } from 'react';
import { AddonTab, AddonProject, BedrockItem, BedrockBlock, BedrockEntity, BedrockRecipe, BedrockScript, BedrockTexture } from './types/addon';
import { STARTER_TEMPLATES } from './utils/templates';
import { exportMcAddon, exportZip } from './utils/mcaddonExporter';
import { Navbar } from './components/Navbar';
import { ManifestEditor } from './components/ManifestEditor';
import { ItemEditor } from './components/ItemEditor';
import { BlockEditor } from './components/BlockEditor';
import { EntityEditor } from './components/EntityEditor';
import { RecipeEditor } from './components/RecipeEditor';
import { LootTableEditor } from './components/LootTableEditor';
import { ScriptEditor } from './components/ScriptEditor';
import { TexturePainter } from './components/TexturePainter';
import { AiAssistant } from './components/AiAssistant';
import { FilesView } from './components/FilesView';
import { GuideView } from './components/GuideView';
import { ChangelogView } from './components/ChangelogView';
import { ShadersView } from './components/ShadersView';
import { generateStarterCreatorItem, DEFAULT_SHADER_CONFIG } from './utils/bedrockGenerator';
import { CheckCircle2, AlertCircle, Info, Download, Upload, RefreshCw } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'bedrock_addon_project_v1';

export default function App() {
  const [project, setProject] = useState<AddonProject>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.shaders) {
          parsed.shaders = DEFAULT_SHADER_CONFIG;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not load saved project from localStorage', e);
    }
    return STARTER_TEMPLATES[0].project;
  });

  const [currentTab, setCurrentTab] = useState<AddonTab>('overview');
  const [activePainterTextureId, setActivePainterTextureId] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Auto-save error', e);
    }
  }, [project]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Export handlers
  const handleExport = async (format: 'mcaddon' | 'bp' | 'rp' | 'zip') => {
    setIsExporting(true);
    try {
      if (format === 'mcaddon') {
        showToast('Формирование .mcaddon архива...', 'info');
        await exportMcAddon(project);
        showToast(`Аддон "${project.manifest.name}.mcaddon" успешно скачан! Дважды кликните по нему для запуска в Minecraft.`);
      } else if (format === 'bp') {
        showToast('Экспорт Behavior Pack...', 'info');
        await exportZip(project, 'bp');
        showToast(`Пак поведения "${project.manifest.name}_BP.mcpack" скачан!`);
      } else if (format === 'rp') {
        showToast('Экспорт Resource Pack...', 'info');
        await exportZip(project, 'rp');
        showToast(`Пак текстур "${project.manifest.name}_RP.mcpack" скачан!`);
      } else {
        await exportZip(project, 'both');
        showToast('ZIP архив успешно скачан!');
      }
    } catch (err: any) {
      console.error('Export error', err);
      showToast(`Ошибка экспорта: ${err.message || 'Не удалось собрать архив'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Navigating to texture painter with pre-selected item/block texture
  const handleOpenTexturePainter = (textureIdOrItemId: string) => {
    // Check if texture exists, else create one
    let targetTexture = project.textures.find((t) => t.id === textureIdOrItemId);
    if (!targetTexture) {
      // Find item or block
      const it = project.items.find((i) => i.id === textureIdOrItemId || i.iconTextureId === textureIdOrItemId);
      if (it) {
        const newTexId = `tex_${Date.now()}`;
        const newTex: BedrockTexture = {
          id: newTexId,
          name: it.identifier.split(':')[1] || 'item_texture',
          type: 'item',
          width: 16,
          height: 16,
          pixelData: Array(256).fill(''),
        };
        setProject((prev) => ({
          ...prev,
          textures: [...prev.textures, newTex],
          items: prev.items.map((item) => (item.id === it.id ? { ...item, iconTextureId: newTexId } : item)),
        }));
        setActivePainterTextureId(newTexId);
      } else {
        setActivePainterTextureId(project.textures[0]?.id);
      }
    } else {
      setActivePainterTextureId(targetTexture.id);
    }
    setCurrentTab('textures');
  };

  // Assign texture to item
  const handleAssignTextureToItem = (itemId: string, textureId: string) => {
    if (!itemId || !textureId) return;
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, iconTextureId: textureId } : i)),
    }));
    showToast('Текстура успешно привязана к предмету!');
  };

  // Assign texture to block
  const handleAssignTextureToBlock = (blockId: string, textureId: string) => {
    if (!blockId || !textureId) return;
    setProject((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === blockId ? { ...b, textureId } : b)),
    }));
    showToast('Текстура успешно привязана к блоку!');
  };

  // Load project backup JSON
  const handleImportProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.manifest && Array.isArray(parsed.items)) {
          setProject(parsed);
          showToast(`Проект "${parsed.manifest.name}" успешно загружен!`);
        } else {
          showToast('Неверный формат файла проекта', 'error');
        }
      } catch (err) {
        showToast('Ошибка чтения JSON файла', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Backup download
  const handleExportProjectJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${project.manifest.namespace || 'mod'}_project.json`);
    dlAnchor.click();
    showToast('Файл проекта (.json) сохранен для резервной копии');
  };

  const hasCreatorItem = project.items.some(
    (it) => it.name.includes('СОЗДАТЕЛЬ') || it.identifier.includes('creator_item')
  );

  const handleEnsureCreatorItem = () => {
    const kit = generateStarterCreatorItem(project.manifest.namespace);
    setProject((prev) => {
      const items = prev.items.some((i) => i.id === kit.item.id || i.identifier === kit.item.identifier)
        ? prev.items
        : [kit.item, ...prev.items];
      const scripts = prev.scripts.some((s) => s.id === kit.script.id)
        ? prev.scripts
        : [...prev.scripts, kit.script];
      const textures = prev.textures.some((t) => t.id === kit.texture.id)
        ? prev.textures
        : [...prev.textures, kit.texture];
      return {
        ...prev,
        items,
        scripts,
        textures,
        manifest: {
          ...prev.manifest,
          giveCreatorItemOnStart: true,
          experimentalFeatures: {
            ...prev.manifest.experimentalFeatures,
            betaApis: true,
          },
        },
      };
    });
    showToast('Предмет "СОЗДАТЕЛЬ КАКОЙТА ЧЕЛ" и скрипт выдачи добавлены в проект!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sticky Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        project={project}
        onLoadTemplate={(newProj) => {
          setProject(newProj);
          showToast(`Шаблон "${newProj.manifest.name}" активирован!`);
        }}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {currentTab === 'overview' && (
          <ManifestEditor
            manifest={project.manifest}
            onChange={(manifest) => setProject((p) => ({ ...p, manifest }))}
            hasCreatorItem={hasCreatorItem}
            onEnsureCreatorItem={handleEnsureCreatorItem}
          />
        )}

        {currentTab === 'items' && (
          <ItemEditor
            items={project.items}
            textures={project.textures}
            namespace={project.manifest.namespace}
            onChange={(items) => setProject((p) => ({ ...p, items }))}
            onOpenTexturePainter={handleOpenTexturePainter}
          />
        )}

        {currentTab === 'blocks' && (
          <BlockEditor
            blocks={project.blocks}
            textures={project.textures}
            namespace={project.manifest.namespace}
            onChange={(blocks) => setProject((p) => ({ ...p, blocks }))}
            onOpenTexturePainter={handleOpenTexturePainter}
          />
        )}

        {currentTab === 'entities' && (
          <EntityEditor
            entities={project.entities}
            namespace={project.manifest.namespace}
            onChange={(entities) => setProject((p) => ({ ...p, entities }))}
          />
        )}

        {currentTab === 'recipes' && (
          <RecipeEditor
            recipes={project.recipes}
            items={project.items}
            blocks={project.blocks}
            namespace={project.manifest.namespace}
            onChange={(recipes) => setProject((p) => ({ ...p, recipes }))}
          />
        )}

        {currentTab === 'loot' && (
          <LootTableEditor
            lootTables={project.lootTables}
            items={project.items}
            blocks={project.blocks}
            namespace={project.manifest.namespace}
            onChange={(lootTables) => setProject((p) => ({ ...p, lootTables }))}
          />
        )}

        {currentTab === 'scripts' && (
          <ScriptEditor
            scripts={project.scripts}
            namespace={project.manifest.namespace}
            onChange={(scripts) => setProject((p) => ({ ...p, scripts }))}
          />
        )}

        {currentTab === 'textures' && (
          <TexturePainter
            textures={project.textures}
            items={project.items}
            blocks={project.blocks}
            activeTextureId={activePainterTextureId}
            onChange={(textures) => setProject((p) => ({ ...p, textures }))}
            onAssignToItem={handleAssignTextureToItem}
            onAssignToBlock={handleAssignTextureToBlock}
          />
        )}

        {currentTab === 'shaders' && (
          <ShadersView
            shaders={project.shaders}
            manifest={project.manifest}
            onChangeShaders={(shaders) => setProject((p) => ({ ...p, shaders }))}
            onUpdateManifest={(manifest) => setProject((p) => ({ ...p, manifest }))}
            onNavigateToAi={(presetPrompt) => {
              setCurrentTab('ai_assistant');
            }}
          />
        )}

        {currentTab === 'ai_assistant' && (
          <AiAssistant
            project={project}
            onAddItem={(item) => {
              setProject((p) => ({ ...p, items: [...p.items, item] }));
              showToast(`Предмет "${item.name}" добавлен в проект!`);
            }}
            onAddBlock={(block) => {
              setProject((p) => ({ ...p, blocks: [...p.blocks, block] }));
              showToast(`Блок "${block.name}" добавлен в проект!`);
            }}
            onAddEntity={(entity) => {
              setProject((p) => ({ ...p, entities: [...p.entities, entity] }));
              showToast(`Моб "${entity.name}" добавлен в проект!`);
            }}
            onAddRecipe={(recipe) => {
              setProject((p) => ({ ...p, recipes: [...p.recipes, recipe] }));
              showToast('Рецепт добавлен в проект!');
            }}
            onAddScript={(script) => {
              setProject((p) => ({ ...p, scripts: [...p.scripts, script] }));
              showToast(`Скрипт "${script.filename}" добавлен в проект!`);
            }}
            onUpdateShaders={(shaders) => {
              setProject((p) => ({ ...p, shaders }));
              showToast('Шейдеры успешно применены к проекту!');
            }}
          />
        )}

        {currentTab === 'files' && <FilesView project={project} />}

        {currentTab === 'export' && <GuideView namespace={project.manifest.namespace} />}

        {currentTab === 'changelog' && <ChangelogView />}
      </main>

      {/* Footer bar */}
      <footer className="bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400 py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Проект сохранен локально
          </span>
          <span className="text-slate-600">•</span>
          <span>Minecraft Bedrock v1.21.0+</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportProjectJson}
            className="flex items-center gap-1 hover:text-white transition text-[11px]"
            title="Сохранить резервную копию проекта"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Скачать бэкап (.json)</span>
          </button>

          <label className="flex items-center gap-1 hover:text-white transition cursor-pointer text-[11px]">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Загрузить бэкап</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportProjectJson}
              className="hidden"
            />
          </label>

          <span className="text-slate-600">•</span>

          <button
            onClick={() => setCurrentTab('changelog')}
            className="hover:text-emerald-400 transition"
          >
            Что нового (v1.3.0)
          </button>
        </div>
      </footer>

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-14 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-800 text-red-100'
                : toast.type === 'info'
                ? 'bg-sky-950/90 border-sky-800 text-sky-100'
                : 'bg-emerald-950/90 border-emerald-700 text-emerald-100'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
