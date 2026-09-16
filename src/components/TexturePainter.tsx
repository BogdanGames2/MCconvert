import React, { useState, useRef, useEffect } from 'react';
import { BedrockTexture, BedrockItem, BedrockBlock } from '../types/addon';
import {
  Palette,
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  RotateCcw,
  Download,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Grid,
} from 'lucide-react';
import { renderPixelDataToDataUrl, generateDefaultPixelTexture } from '../utils/bedrockGenerator';

interface TexturePainterProps {
  textures: BedrockTexture[];
  items: BedrockItem[];
  blocks: BedrockBlock[];
  activeTextureId?: string;
  onChange: (textures: BedrockTexture[]) => void;
  onAssignToItem: (itemId: string, textureId: string) => void;
  onAssignToBlock: (blockId: string, textureId: string) => void;
}

const MINECRAFT_PALETTE = [
  // Redstone & Ruby
  '#DC2626', '#EF4444', '#B91C1C', '#991B1B',
  // Diamond & Cyan
  '#06B6D4', '#22D3EE', '#0891B2', '#0E7490',
  // Emerald & Green
  '#10B981', '#34D399', '#059669', '#047857',
  // Gold & Yellow
  '#F59E0B', '#FBBF24', '#D97706', '#B45309',
  // Amethyst & Purple
  '#8B5CF6', '#A78BFA', '#7C3AED', '#6D28D9',
  // Ender & Void
  '#0F766E', '#14B8A6', '#1E1B4B', '#312E81',
  // Netherite & Charcoal
  '#1E293B', '#334155', '#0F172A', '#475569',
  // Wood & Dirt
  '#78350F', '#92400E', '#B45309', '#451A03',
  // Highlight & White
  '#FFFFFF', '#E2E8F0', '#94A3B8', '#64748B',
];

export const TexturePainter: React.FC<TexturePainterProps> = ({
  textures,
  items,
  blocks,
  activeTextureId,
  onChange,
  onAssignToItem,
  onAssignToBlock,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    activeTextureId || textures[0]?.id || ''
  );

  const selectedTexture = textures.find((t) => t.id === selectedId) || textures[0];

  const [tool, setTool] = useState<'pencil' | 'eraser' | 'fill' | 'picker'>('pencil');
  const [selectedColor, setSelectedColor] = useState<string>('#EF4444');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [history, setHistory] = useState<string[][]>([]);

  // Update selected if activeTextureId changes
  useEffect(() => {
    if (activeTextureId && textures.some((t) => t.id === activeTextureId)) {
      setSelectedId(activeTextureId);
    }
  }, [activeTextureId, textures]);

  const handleCreateTexture = (type: 'item' | 'block') => {
    const newId = `tex_${Date.now()}`;
    const newTex: BedrockTexture = {
      id: newId,
      name: `texture_${textures.length + 1}`,
      type,
      width: 16,
      height: 16,
      pixelData: Array(256).fill(''),
    };
    onChange([...textures, newTex]);
    setSelectedId(newId);
  };

  const handleDeleteTexture = (id: string) => {
    if (textures.length <= 1) {
      alert('Нельзя удалить последнюю текстуру');
      return;
    }
    const filtered = textures.filter((t) => t.id !== id);
    onChange(filtered);
    if (selectedId === id) {
      setSelectedId(filtered[0]?.id || '');
    }
  };

  const handleUpdatePixels = (newPixels: string[]) => {
    if (!selectedTexture) return;
    setHistory((prev) => [...prev.slice(-15), selectedTexture.pixelData]);
    onChange(
      textures.map((t) => (t.id === selectedTexture.id ? { ...t, pixelData: newPixels } : t))
    );
  };

  const handleUndo = () => {
    if (history.length === 0 || !selectedTexture) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    onChange(
      textures.map((t) => (t.id === selectedTexture.id ? { ...t, pixelData: previous } : t))
    );
  };

  const handlePixelClick = (x: number, y: number) => {
    if (!selectedTexture) return;
    const width = selectedTexture.width || 16;
    const height = selectedTexture.height || 16;
    const idx = y * width + x;
    const currentPixels = [...selectedTexture.pixelData];

    if (tool === 'pencil') {
      if (currentPixels[idx] === selectedColor) return;
      currentPixels[idx] = selectedColor;
      handleUpdatePixels(currentPixels);
    } else if (tool === 'eraser') {
      if (currentPixels[idx] === '') return;
      currentPixels[idx] = '';
      handleUpdatePixels(currentPixels);
    } else if (tool === 'picker') {
      const col = currentPixels[idx];
      if (col) setSelectedColor(col);
      setTool('pencil');
    } else if (tool === 'fill') {
      const targetColor = currentPixels[idx];
      if (targetColor === selectedColor) return;
      // Flood fill
      const queue: [number, number][] = [[x, y]];
      const visited = new Set<number>();

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        const cIdx = cy * width + cx;
        if (visited.has(cIdx)) continue;
        visited.add(cIdx);

        if (currentPixels[cIdx] === targetColor) {
          currentPixels[cIdx] = selectedColor;
          if (cx > 0) queue.push([cx - 1, cy]);
          if (cx < width - 1) queue.push([cx + 1, cy]);
          if (cy > 0) queue.push([cx, cy - 1]);
          if (cy < height - 1) queue.push([cx, cy + 1]);
        }
      }
      handleUpdatePixels(currentPixels);
    }
  };

  const handlePixelMouseEnter = (x: number, y: number) => {
    if (!isMouseDown) return;
    if (tool === 'pencil' || tool === 'eraser') {
      handlePixelClick(x, y);
    }
  };

  const handlePreset = (preset: 'sword' | 'gem' | 'block') => {
    const pixels = generateDefaultPixelTexture(preset, selectedColor);
    handleUpdatePixels(pixels);
  };

  const previewUrl = selectedTexture
    ? renderPixelDataToDataUrl(selectedTexture.pixelData, selectedTexture.width || 16, selectedTexture.height || 16)
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Column: Texture List */}
      <div className="lg:col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            Текстуры ({textures.length})
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => handleCreateTexture('item')}
              className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
              title="Создать текстуру предмета"
            >
              + Предмет
            </button>
            <button
              onClick={() => handleCreateTexture('block')}
              className="px-2 py-1 text-[11px] font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded transition"
              title="Создать текстуру блока"
            >
              + Блок
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[70vh] overflow-y-auto space-y-1.5 scrollbar-thin">
          {textures.map((t) => {
            const isSelected = t.id === selectedTexture?.id;
            const url = renderPixelDataToDataUrl(t.pixelData, t.width || 16, t.height || 16);
            return (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                    {url ? (
                      <img src={url} alt={t.name} className="w-6 h-6 object-contain image-rendering-pixelated" />
                    ) : (
                      <Palette className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-100 truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{t.type} (16x16)</div>
                  </div>
                </div>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleDeleteTexture(t.id);
                  }}
                  className="p-1 hover:text-red-400 text-slate-500 transition"
                  title="Удалить текстуру"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Column: Canvas & Tools */}
      {selectedTexture ? (
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedTexture.name}
                  onChange={(e) =>
                    onChange(
                      textures.map((t) => (t.id === selectedTexture.id ? { ...t, name: e.target.value } : t))
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
                <span className="text-xs text-slate-400">({selectedTexture.type})</span>
              </div>

              {/* Tools buttons */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTool('pencil')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                    tool === 'pencil' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Карандаш"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                    tool === 'eraser' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ластик"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool('fill')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                    tool === 'fill' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Заливка"
                >
                  <PaintBucket className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool('picker')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                    tool === 'picker' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Пипетка"
                >
                  <Pipette className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-800 mx-1" />
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded transition"
                  title="Отменить шаг (Undo)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1.5 rounded text-xs transition ${
                    showGrid ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'
                  }`}
                  title="Сетка"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* Quick procedural templates */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Шаблоны:</span>
                <button
                  onClick={() => handlePreset('sword')}
                  className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
                >
                  Меч
                </button>
                <button
                  onClick={() => handlePreset('gem')}
                  className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
                >
                  Кристалл
                </button>
                <button
                  onClick={() => handlePreset('block')}
                  className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
                >
                  Руда
                </button>
              </div>
            </div>

            {/* Canvas Area & Palette */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* 16x16 Pixel Art Canvas */}
              <div
                className="md:col-span-8 flex justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner select-none"
                onMouseDown={() => setIsMouseDown(true)}
                onMouseUp={() => setIsMouseDown(false)}
                onMouseLeave={() => setIsMouseDown(false)}
              >
                <div
                  className="grid grid-cols-16 gap-0 bg-[#1e293b] border-2 border-slate-700 rounded shadow-2xl overflow-hidden"
                  style={{ width: '320px', height: '320px' }}
                >
                  {Array.from({ length: 16 }).map((_, y) =>
                    Array.from({ length: 16 }).map((_, x) => {
                      const idx = y * 16 + x;
                      const pixelColor = selectedTexture.pixelData[idx];

                      return (
                        <div
                          key={idx}
                          onClick={() => handlePixelClick(x, y)}
                          onMouseEnter={() => handlePixelMouseEnter(x, y)}
                          style={{
                            backgroundColor: pixelColor || 'transparent',
                            backgroundImage: !pixelColor
                              ? 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)'
                              : 'none',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                          }}
                          className={`w-5 h-5 cursor-crosshair transition-colors duration-75 ${
                            showGrid ? 'border-r border-b border-slate-800/40' : ''
                          }`}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Color Palette & Previews */}
              <div className="md:col-span-4 space-y-4">
                {/* Active Color picker */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Текущий цвет:</span>
                    <span className="font-mono text-emerald-400">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-white"
                    />
                  </div>
                </div>

                {/* Minecraft Palette */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300">Палитра Minecraft:</div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {MINECRAFT_PALETTE.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedColor(col);
                          if (tool === 'eraser') setTool('pencil');
                        }}
                        style={{ backgroundColor: col }}
                        className={`w-6 h-6 rounded-sm border transition ${
                          selectedColor.toLowerCase() === col.toLowerCase()
                            ? 'ring-2 ring-emerald-400 border-white scale-110'
                            : 'border-slate-800 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Live In-Game Scale Previews */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300">Предпросмотр в игре:</div>
                  <div className="flex items-center justify-around py-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded bg-slate-950 border border-slate-750 flex items-center justify-center overflow-hidden">
                        {previewUrl && (
                          <img src={previewUrl} alt="1x" className="w-4 h-4 object-contain image-rendering-pixelated" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">1x (Инвентарь)</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-lg bg-slate-950 border-2 border-emerald-600/40 flex items-center justify-center overflow-hidden shadow-md">
                        {previewUrl && (
                          <img src={previewUrl} alt="4x" className="w-10 h-10 object-contain image-rendering-pixelated" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">4x (В руке)</span>
                    </div>
                  </div>
                </div>

                {/* Assign to Item / Block */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300">Привязать текстуру:</div>
                  {selectedTexture.type === 'item' ? (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 block">Привязать к предмету:</span>
                      <div className="flex gap-2">
                        <select
                          id="assign-item-select"
                          className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white"
                          onChange={(e) => onAssignToItem(e.target.value, selectedTexture.id)}
                        >
                          <option value="">Выберите предмет...</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name} ({it.identifier})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 block">Привязать к блоку:</span>
                      <div className="flex gap-2">
                        <select
                          id="assign-block-select"
                          className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white"
                          onChange={(e) => onAssignToBlock(e.target.value, selectedTexture.id)}
                        >
                          <option value="">Выберите блок...</option>
                          {blocks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.identifier})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
