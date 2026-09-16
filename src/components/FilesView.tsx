import React, { useState } from 'react';
import { AddonProject } from '../types/addon';
import {
  Folder,
  FileCode,
  Copy,
  Check,
  Code2,
  ChevronRight,
  ChevronDown,
  Layers,
  FileText,
  Eye,
} from 'lucide-react';
import {
  generateManifestJson,
  generateItemJson,
  generateBlockJson,
  generateEntityJson,
  generateRecipeJson,
  generateLootTableJson,
  generateItemTextureJson,
  generateTerrainTextureJson,
  generateLangFile,
} from '../utils/bedrockGenerator';

interface FilesViewProps {
  project: AddonProject;
}

export const FilesView: React.FC<FilesViewProps> = ({ project }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('BP/manifest.json');
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    BP: true,
    RP: true,
    'BP/items': true,
    'BP/blocks': true,
    'BP/entities': true,
    'BP/recipes': true,
    'BP/loot_tables': true,
    'BP/scripts': true,
    'RP/textures': true,
    'RP/texts': true,
  });

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  // Build map of virtual files
  const virtualFiles: Record<string, { content: string; language: string }> = {};

  // Manifests
  virtualFiles['BP/manifest.json'] = {
    content: JSON.stringify(generateManifestJson(project, 'data'), null, 2),
    language: 'json',
  };
  virtualFiles['RP/manifest.json'] = {
    content: JSON.stringify(generateManifestJson(project, 'resources'), null, 2),
    language: 'json',
  };

  // Items
  project.items.forEach((item) => {
    const itemName = item.identifier.split(':')[1] || item.id;
    virtualFiles[`BP/items/${itemName}.json`] = {
      content: JSON.stringify(generateItemJson(item), null, 2),
      language: 'json',
    };
  });

  // Blocks
  project.blocks.forEach((block) => {
    const blockName = block.identifier.split(':')[1] || block.id;
    virtualFiles[`BP/blocks/${blockName}.json`] = {
      content: JSON.stringify(generateBlockJson(block), null, 2),
      language: 'json',
    };
  });

  // Entities
  project.entities.forEach((entity) => {
    const entityName = entity.identifier.split(':')[1] || entity.id;
    virtualFiles[`BP/entities/${entityName}.json`] = {
      content: JSON.stringify(generateEntityJson(entity), null, 2),
      language: 'json',
    };
  });

  // Recipes
  project.recipes.forEach((recipe) => {
    const recipeName = recipe.identifier.split(':')[1] || recipe.id;
    virtualFiles[`BP/recipes/${recipeName}.json`] = {
      content: JSON.stringify(generateRecipeJson(recipe), null, 2),
      language: 'json',
    };
  });

  // Loot tables
  project.lootTables.forEach((lt) => {
    const ltName = lt.identifier.split(':')[1] || lt.id;
    virtualFiles[`BP/loot_tables/${ltName}.json`] = {
      content: JSON.stringify(generateLootTableJson(lt), null, 2),
      language: 'json',
    };
  });

  // Scripts
  project.scripts.forEach((sc) => {
    virtualFiles[`BP/scripts/${sc.filename}`] = {
      content: sc.code,
      language: 'javascript',
    };
  });

  // Resource Pack textures & texts
  virtualFiles['RP/textures/item_texture.json'] = {
    content: JSON.stringify(generateItemTextureJson(project), null, 2),
    language: 'json',
  };
  virtualFiles['RP/textures/terrain_texture.json'] = {
    content: JSON.stringify(generateTerrainTextureJson(project), null, 2),
    language: 'json',
  };
  virtualFiles['RP/texts/en_US.lang'] = {
    content: generateLangFile(project),
    language: 'properties',
  };
  virtualFiles['RP/texts/ru_RU.lang'] = {
    content: generateLangFile(project),
    language: 'properties',
  };

  const currentFile = virtualFiles[selectedFilePath] || {
    content: 'Файл не найден',
    language: 'text',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* File Tree Left */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Структура аддона (.mcaddon)</span>
        </div>

        <div className="text-xs space-y-1 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* BP Folder */}
          <div>
            <div
              onClick={() => toggleFolder('BP')}
              className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800 text-emerald-400 font-bold cursor-pointer select-none"
            >
              {expandedFolders['BP'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Folder className="w-3.5 h-3.5 fill-emerald-400/20" />
              <span>{project.manifest.name}_BP (Behavior Pack)</span>
            </div>

            {expandedFolders['BP'] && (
              <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                <div
                  onClick={() => setSelectedFilePath('BP/manifest.json')}
                  className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer ${
                    selectedFilePath === 'BP/manifest.json'
                      ? 'bg-emerald-950/80 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>manifest.json</span>
                </div>

                {/* Subfolders */}
                {['items', 'blocks', 'entities', 'recipes', 'loot_tables', 'scripts'].map((folder) => {
                  const key = `BP/${folder}`;
                  const fileList = Object.keys(virtualFiles).filter((f) => f.startsWith(`${key}/`));
                  if (fileList.length === 0) return null;

                  return (
                    <div key={folder}>
                      <div
                        onClick={() => toggleFolder(key)}
                        className="flex items-center gap-1 py-1 px-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer select-none font-medium"
                      >
                        {expandedFolders[key] ? (
                          <ChevronDown className="w-3 h-3 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        )}
                        <Folder className="w-3 h-3 text-slate-400" />
                        <span>{folder}/</span>
                      </div>

                      {expandedFolders[key] && (
                        <div className="pl-4 space-y-0.5 border-l border-slate-800/60 ml-2 mt-0.5">
                          {fileList.map((filePath) => {
                            const filename = filePath.replace(`${key}/`, '');
                            return (
                              <div
                                key={filePath}
                                onClick={() => setSelectedFilePath(filePath)}
                                className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer text-[11px] truncate ${
                                  selectedFilePath === filePath
                                    ? 'bg-emerald-950/80 text-white font-semibold'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                              >
                                <FileCode className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{filename}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RP Folder */}
          <div className="pt-2">
            <div
              onClick={() => toggleFolder('RP')}
              className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800 text-sky-400 font-bold cursor-pointer select-none"
            >
              {expandedFolders['RP'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Folder className="w-3.5 h-3.5 fill-sky-400/20" />
              <span>{project.manifest.name}_RP (Resource Pack)</span>
            </div>

            {expandedFolders['RP'] && (
              <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                <div
                  onClick={() => setSelectedFilePath('RP/manifest.json')}
                  className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer ${
                    selectedFilePath === 'RP/manifest.json'
                      ? 'bg-sky-950/80 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>manifest.json</span>
                </div>

                {/* RP Subfolders */}
                {['textures', 'texts'].map((folder) => {
                  const key = `RP/${folder}`;
                  const fileList = Object.keys(virtualFiles).filter((f) => f.startsWith(`${key}/`));
                  if (fileList.length === 0) return null;

                  return (
                    <div key={folder}>
                      <div
                        onClick={() => toggleFolder(key)}
                        className="flex items-center gap-1 py-1 px-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer select-none font-medium"
                      >
                        {expandedFolders[key] ? (
                          <ChevronDown className="w-3 h-3 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        )}
                        <Folder className="w-3 h-3 text-slate-400" />
                        <span>{folder}/</span>
                      </div>

                      {expandedFolders[key] && (
                        <div className="pl-4 space-y-0.5 border-l border-slate-800/60 ml-2 mt-0.5">
                          {fileList.map((filePath) => {
                            const filename = filePath.replace(`${key}/`, '');
                            return (
                              <div
                                key={filePath}
                                onClick={() => setSelectedFilePath(filePath)}
                                className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer text-[11px] truncate ${
                                  selectedFilePath === filePath
                                    ? 'bg-sky-950/80 text-white font-semibold'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                              >
                                <FileText className="w-3 h-3 text-sky-400 shrink-0" />
                                <span className="truncate">{filename}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Viewer Right */}
      <div className="lg:col-span-8 space-y-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-200 truncate">
            <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{selectedFilePath}</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано' : 'Копировать'}</span>
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-hidden shadow-inner">
          <pre className="font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto max-h-[70vh] scrollbar-thin">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
