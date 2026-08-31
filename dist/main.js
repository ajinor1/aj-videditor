// ============================================================
// AJ Video Editor - エントリーポイント
// フェーズ8: 図形機能（数値入力共通仕様）
// ============================================================
// -------- 定数 --------
const FPS = 30;
const LAYER_COUNT = 5;
const TIMELINE_DURATION = 20;
const TOTAL_FRAMES = TIMELINE_DURATION * FPS;
const DEFAULT_CLIP_DURATION = 3 * FPS;
const DEFAULT_FONT = '"Hiragino Sans", "Microsoft YaHei", sans-serif';
// -------- ★ スライダー拡張段階定義 ★ --------
const SLIDER_STAGES = {
    coord: [500, 1000, 2000, 4000, 8000],
    rotation: [180, 360, 720, 1440],
    size: [100, 200, 400, 800, 1600, 3200],
    stroke: [100, 200, 400, 800, 1600, 3200],
    fontSize: [100, 200, 400, 800, 1600, 3200],
};
// -------- ★ 数値入力の設定（各プロパティごと） ★ --------
const NUMBER_CONFIGS = {
    x: { min: -8000, max: 8000, default: 0, stages: SLIDER_STAGES.coord },
    y: { min: -8000, max: 8000, default: 0, stages: SLIDER_STAGES.coord },
    rotation: { min: -1440, max: 1440, default: 0, stages: SLIDER_STAGES.rotation },
    width: { min: 0, max: 3200, default: 100, stages: SLIDER_STAGES.size },
    height: { min: 0, max: 3200, default: 100, stages: SLIDER_STAGES.size },
    stroke: { min: 0, max: 3200, default: 0, stages: SLIDER_STAGES.stroke },
    fontSize: { min: 0, max: 3200, default: 50, stages: SLIDER_STAGES.fontSize },
    start: { min: 0, max: 600, default: 0, stages: null },
    duration: { min: 1, max: 600, default: 90, stages: null },
};
// -------- ★ 汎用関数 ★ --------
function getSliderMax(value, stages) {
    const abs = Math.abs(value);
    for (const stage of stages) {
        if (abs < stage)
            return stage;
    }
    return stages[stages.length - 1];
}
function updateSliderRange(slider, value, stages, isDragging) {
    if (isDragging)
        return;
    const max = getSliderMax(value, stages);
    slider.min = String(-max);
    slider.max = String(max);
}
function updateSliderRangePositive(slider, value, stages, isDragging) {
    if (isDragging)
        return;
    const max = getSliderMax(value, stages);
    slider.min = '0';
    slider.max = String(max);
}
// -------- ★ 共通数値入力処理 ★ --------
function setupNumberInput(input, slider, config) {
    // クリック / フォーカスで全選択
    input.addEventListener('click', () => input.select());
    input.addEventListener('focus', () => input.select());
    // Enterで確定
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitNumberInput(input, slider, config);
        }
    });
    // フォーカス喪失で確定（change）
    input.addEventListener('change', () => {
        commitNumberInput(input, slider, config);
    });
}
function commitNumberInput(input, slider, config) {
    let val = parseFloat(input.value);
    // 空文字 or NaN → デフォルト値
    if (isNaN(val) || input.value.trim() === '') {
        val = config.default;
    }
    // 範囲制限
    val = Math.max(config.min, Math.min(config.max, val));
    // スライダーと入力欄に反映
    slider.value = String(val);
    input.value = String(val);
    // 拡張（あれば）
    if (config.stages) {
        config.updateSliderRangeFn(val);
    }
    // コールバック（クリップ更新）
    config.onCommit(val);
    // フォーカス解除（入力状態を解除）
    input.blur();
}
// -------- ★ 拡張用ヘルパー ★ --------
function getIsDraggingFlag(dragFlags) {
    if (typeof dragFlags === 'boolean') {
        return () => dragFlags;
    }
    return () => dragFlags.x || dragFlags.y;
}
// -------- 設定 --------
const CONFIG = {
    preventOverlap: true,
    theme: 'white',
};
// -------- テーマ定義 --------
const THEMES = {
    'white': { bg: '#f5f5f5', secondary: '#e8e8e8', card: '#ffffff', text: '#222222', textSecondary: '#666666', border: '#d0d0d0', accent: '#f5576c' },
    'white-red': { bg: '#fff5f5', secondary: '#f5e8e8', card: '#ffffff', text: '#331111', textSecondary: '#884444', border: '#e0c8c8', accent: '#e74c3c' },
    'white-blue': { bg: '#f0f5ff', secondary: '#e8edf5', card: '#ffffff', text: '#111833', textSecondary: '#445588', border: '#c8d8e8', accent: '#3498db' },
    'white-green': { bg: '#f0fff5', secondary: '#e8f5ed', card: '#ffffff', text: '#113311', textSecondary: '#448844', border: '#c8e0d0', accent: '#2ecc71' },
    'white-yellow': { bg: '#fffdf0', secondary: '#f5f0e8', card: '#ffffff', text: '#332b11', textSecondary: '#887744', border: '#e8e0c8', accent: '#f1c40f' },
    'white-purple': { bg: '#f8f0ff', secondary: '#f0e8f5', card: '#ffffff', text: '#1f1133', textSecondary: '#664488', border: '#d8c8e8', accent: '#9b59b6' },
    'black': { bg: '#0d0d0d', secondary: '#161616', card: '#111111', text: '#e0e0e0', textSecondary: '#888888', border: '#2a2a2a', accent: '#f5576c' },
    'black-red': { bg: '#1a0a0a', secondary: '#221111', card: '#1a0d0d', text: '#e8d0d0', textSecondary: '#aa8888', border: '#3a2020', accent: '#e74c3c' },
    'black-blue': { bg: '#0a0d1a', secondary: '#111822', card: '#0d111a', text: '#d0d8e8', textSecondary: '#8899aa', border: '#202a3a', accent: '#3498db' },
    'black-green': { bg: '#0a1a0d', secondary: '#112211', card: '#0d1a0d', text: '#d0e8d0', textSecondary: '#88aa88', border: '#203a2a', accent: '#2ecc71' },
    'black-yellow': { bg: '#1a180a', secondary: '#222211', card: '#1a1a0d', text: '#e8e0d0', textSecondary: '#aa9966', border: '#3a3820', accent: '#f1c40f' },
    'black-purple': { bg: '#120a1a', secondary: '#1f1122', card: '#1a0d1a', text: '#e0d0e8', textSecondary: '#9988aa', border: '#2a203a', accent: '#9b59b6' },
};
// -------- DOM要素 --------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const typeDisplay = document.getElementById('typeDisplay');
const textProperties = document.getElementById('textProperties');
const shapeProperties = document.getElementById('shapeProperties');
const textInput = document.getElementById('textInput');
const fontSelect = document.getElementById('fontSelect');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeLabel = document.getElementById('fontSizeLabel');
const colorPicker = document.getElementById('colorPicker');
const shapeTypeSelect = document.getElementById('shapeTypeSelect');
const fillColorPicker = document.getElementById('fillColorPicker');
const strokeColorPicker = document.getElementById('strokeColorPicker');
const strokeWidthSlider = document.getElementById('strokeWidthSlider');
const strokeWidthLabel = document.getElementById('strokeWidthLabel');
const shapeWidthSlider = document.getElementById('shapeWidthSlider');
const shapeWidthLabel = document.getElementById('shapeWidthLabel');
const shapeHeightSlider = document.getElementById('shapeHeightSlider');
const shapeHeightLabel = document.getElementById('shapeHeightLabel');
const xSlider = document.getElementById('xPos');
const xNumber = document.getElementById('xNumber');
const ySlider = document.getElementById('yPos');
const yNumber = document.getElementById('yNumber');
const rotationSlider = document.getElementById('rotationSlider');
const rotationNumber = document.getElementById('rotationNumber');
const startInput = document.getElementById('startInput');
const durationInput = document.getElementById('durationInput');
const addBtn = document.getElementById('addBtn');
const addDropdownMenu = document.getElementById('addDropdownMenu');
const deleteBtn = document.getElementById('deleteBtn');
const timelineContainer = document.getElementById('timelineContainer');
const playBtn = document.getElementById('playBtn');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const settingsToggle = document.getElementById('settingsToggle');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsClose = document.getElementById('settingsClose');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const themeSelect = document.getElementById('themeSelect');
const overlapToggle = document.getElementById('overlapToggle');
// -------- キャンバスサイズ --------
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;
const MAX_COORD = 8000;
const MAX_ROTATION = 1440;
// -------- 状態 --------
let clips = [];
let selectedId = null;
let idCounter = 0;
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;
let isDraggingX = false;
let isDraggingY = false;
let isDraggingRotation = false;
let isDraggingStroke = false;
let isDraggingWidth = false;
let isDraggingHeight = false;
let isDraggingFontSize = false;
let isSeeking = false;
let isDraggingClip = false;
let dragClipId = null;
let dragStartMouseX = 0;
let dragStartMouseY = 0;
let dragStartFrame = 0;
let dragStartLayer = 0;
let dragClipElement = null;
const TIMELINE_HEIGHT = 32;
const TIMELINE_PADDING_LEFT = 80;
const TIMELINE_PADDING_RIGHT = 20;
const TIMELINE_HEADER_HEIGHT = 28;
let isDropdownOpen = false;
function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    addDropdownMenu.classList.toggle('active', isDropdownOpen);
}
function closeDropdown() {
    isDropdownOpen = false;
    addDropdownMenu.classList.remove('active');
}
// -------- ユーティリティ --------
function generateId() {
    return `clip-${++idCounter}`;
}
function getSelected() {
    return clips.find(c => c.id === selectedId) || null;
}
function setPropertiesEnabled(enabled) {
    const inputs = [
        textInput, fontSelect, fontSizeSlider, colorPicker,
        shapeTypeSelect, fillColorPicker, strokeColorPicker,
        strokeWidthSlider, shapeWidthSlider, shapeHeightSlider,
        xSlider, xNumber, ySlider, yNumber,
        rotationSlider, rotationNumber, startInput, durationInput
    ];
    for (const input of inputs) {
        input.disabled = !enabled;
    }
    const labels = document.querySelectorAll('.control-group label');
    for (const label of labels) {
        if (enabled) {
            label.classList.remove('disabled');
        }
        else {
            label.classList.add('disabled');
        }
    }
    const values = document.querySelectorAll('.value');
    for (const val of values) {
        if (enabled) {
            val.classList.remove('disabled');
        }
        else {
            val.classList.add('disabled');
        }
    }
    const coordInputs = document.querySelectorAll('.coord-input');
    for (const ci of coordInputs) {
        if (enabled) {
            ci.classList.remove('disabled');
        }
        else {
            ci.classList.add('disabled');
        }
    }
}
function getClipsAtFrame(frame) {
    return clips.filter(clip => {
        return frame >= clip.startFrame && frame < clip.startFrame + clip.duration;
    });
}
// -------- 図形描画関数 --------
function drawShape(ctx, clip) {
    const { shapeType, fillColor, strokeColor, strokeWidth, width, height, rotation } = clip;
    if (!shapeType || !width || !height)
        return;
    const w = width;
    const h = height;
    ctx.save();
    ctx.rotate(rotation * Math.PI / 180);
    ctx.beginPath();
    switch (shapeType) {
        case 'rectangle':
            ctx.rect(-w / 2, -h / 2, w, h);
            break;
        case 'triangle':
            ctx.moveTo(0, -h / 2);
            ctx.lineTo(-w / 2, h / 2);
            ctx.lineTo(w / 2, h / 2);
            ctx.closePath();
            break;
        case 'circle':
            ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
            break;
        case 'pie': {
            const radius = Math.min(w, h) / 2;
            const startAngle = 0;
            const endAngle = Math.PI * 1.5;
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            break;
        }
        case 'arrow': {
            const headSize = Math.min(w, h) * 0.35;
            const shaftWidth = h * 0.2;
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w / 2 - headSize, -headSize / 2);
            ctx.lineTo(w / 2 - headSize, -shaftWidth / 2);
            ctx.lineTo(-w / 2, -shaftWidth / 2);
            ctx.lineTo(-w / 2, shaftWidth / 2);
            ctx.lineTo(w / 2 - headSize, shaftWidth / 2);
            ctx.lineTo(w / 2 - headSize, headSize / 2);
            ctx.closePath();
            break;
        }
        default:
            ctx.restore();
            return;
    }
    ctx.clip();
    if (fillColor && fillColor !== 'transparent') {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    if (strokeColor && strokeColor !== 'transparent' && strokeWidth && strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        switch (shapeType) {
            case 'rectangle':
                ctx.rect(-w / 2, -h / 2, w, h);
                break;
            case 'triangle':
                ctx.moveTo(0, -h / 2);
                ctx.lineTo(-w / 2, h / 2);
                ctx.lineTo(w / 2, h / 2);
                ctx.closePath();
                break;
            case 'circle':
                ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
                break;
            case 'pie': {
                const radius = Math.min(w, h) / 2;
                const startAngle = 0;
                const endAngle = Math.PI * 1.5;
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, radius, startAngle, endAngle);
                ctx.closePath();
                break;
            }
            case 'arrow': {
                const headSize = Math.min(w, h) * 0.35;
                const shaftWidth = h * 0.2;
                ctx.moveTo(w / 2, 0);
                ctx.lineTo(w / 2 - headSize, -headSize / 2);
                ctx.lineTo(w / 2 - headSize, -shaftWidth / 2);
                ctx.lineTo(-w / 2, -shaftWidth / 2);
                ctx.lineTo(-w / 2, shaftWidth / 2);
                ctx.lineTo(w / 2 - headSize, shaftWidth / 2);
                ctx.lineTo(w / 2 - headSize, headSize / 2);
                ctx.closePath();
                break;
            }
            default:
                ctx.restore();
                return;
        }
        ctx.stroke();
    }
    ctx.restore();
}
// -------- テーマ適用 --------
function applyTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme)
        return;
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.bg);
    root.style.setProperty('--bg-secondary', theme.secondary);
    root.style.setProperty('--bg-card', theme.card);
    root.style.setProperty('--text-primary', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--accent', theme.accent);
    CONFIG.theme = themeName;
    themeSelect.value = themeName;
}
// -------- プレビュー描画 --------
function drawPreview() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_W; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_H);
        ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_H; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_W, i);
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(CX, 0);
    ctx.lineTo(CX, CANVAS_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, CY);
    ctx.lineTo(CANVAS_W, CY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,50,50,0.5)';
    ctx.beginPath();
    ctx.arc(CX, CY, 4, 0, Math.PI * 2);
    ctx.fill();
    const visibleClips = getClipsAtFrame(currentFrame);
    visibleClips.sort((a, b) => a.layerId - b.layerId);
    for (const clip of visibleClips) {
        const drawX = CX + clip.x;
        const drawY = CY + clip.y;
        if (clip.type === 'text') {
            const lines = clip.text?.split('\n') || [''];
            const lineHeight = (clip.fontSize || 48) * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = drawY - totalHeight / 2 + lineHeight / 2;
            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate(clip.rotation * Math.PI / 180);
            ctx.font = `${clip.fontSize || 48}px ${clip.fontFamily || DEFAULT_FONT}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < lines.length; i++) {
                const yOffset = (i - (lines.length - 1) / 2) * lineHeight;
                ctx.fillStyle = clip.color || '#ffffff';
                ctx.fillText(lines[i], 0, yOffset);
            }
            ctx.restore();
            if (clip.id === selectedId) {
                ctx.save();
                ctx.translate(drawX, drawY);
                ctx.rotate(clip.rotation * Math.PI / 180);
                let maxWidth = 0;
                for (const line of lines) {
                    const metrics = ctx.measureText(line);
                    if (metrics.width > maxWidth)
                        maxWidth = metrics.width;
                }
                const width = maxWidth || 50;
                const height = totalHeight;
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 6]);
                ctx.strokeRect(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20);
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
        else {
            ctx.save();
            ctx.translate(drawX, drawY);
            drawShape(ctx, clip);
            ctx.restore();
            if (clip.id === selectedId) {
                const w = clip.width || 100;
                const h = clip.height || 100;
                ctx.save();
                ctx.translate(drawX, drawY);
                ctx.rotate(clip.rotation * Math.PI / 180);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 6]);
                ctx.strokeRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20);
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    }
}
// -------- タイムライン描画 --------
function drawTimeline() {
    const containerWidth = timelineContainer.clientWidth - 4;
    const usableWidth = containerWidth - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    const pixelsPerSecond = usableWidth / TIMELINE_DURATION;
    let html = '';
    html += `<div class="timeline-ruler" style="height:${TIMELINE_HEADER_HEIGHT}px; padding-left:${TIMELINE_PADDING_LEFT}px; padding-right:${TIMELINE_PADDING_RIGHT}px;">`;
    html += `<div class="timeline-ruler-inner" style="position:relative; height:100%; width:100%;">`;
    for (let s = 0; s <= TIMELINE_DURATION; s++) {
        const x = s * pixelsPerSecond;
        const isMajor = s % 5 === 0;
        html += `<div class="timeline-tick ${isMajor ? 'major' : 'minor'}" style="left:${x}px;">`;
        if (isMajor) {
            html += `<span class="timeline-tick-label">${s}s</span>`;
        }
        html += `</div>`;
    }
    const headX = (currentFrame / FPS) * pixelsPerSecond;
    html += `<div class="timeline-playhead" style="left:${headX}px;"></div>`;
    html += `</div></div>`;
    for (let layerId = 1; layerId <= LAYER_COUNT; layerId++) {
        const layerLabel = String(layerId).padStart(2, '0');
        html += `<div class="timeline-track" style="height:${TIMELINE_HEIGHT}px;">`;
        html += `<div class="timeline-track-label">LAYER ${layerLabel}</div>`;
        html += `<div class="timeline-track-area" style="position:relative; flex:1; height:100%;">`;
        const layerClips = clips.filter(c => c.layerId === layerId);
        for (const clip of layerClips) {
            const left = (clip.startFrame / FPS) * pixelsPerSecond;
            const width = (clip.duration / FPS) * pixelsPerSecond;
            const isSelected = clip.id === selectedId;
            const colors = ['#f5576c', '#f9ca24', '#4ecdc4', '#45b7d1', '#a29bfe'];
            const color = colors[(layerId - 1) % colors.length];
            const isDragging = isDraggingClip && dragClipId === clip.id;
            const opacity = isDragging ? '0.5' : '0.8';
            const label = clip.type === 'text'
                ? (clip.text || 'Text').replace(/\n/g, ' ')
                : (clip.shapeType || 'shape');
            html += `<div class="timeline-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}" 
                          data-clip-id="${clip.id}"
                          style="left:${left}px; width:${Math.max(width, 4)}px; background:${color}; opacity:${opacity};">
                        <span class="timeline-clip-label">${label}</span>
                     </div>`;
        }
        html += `</div></div>`;
    }
    timelineContainer.innerHTML = html;
    document.querySelectorAll('.timeline-clip').forEach(el => {
        el.addEventListener('click', (e) => {
            if (isDraggingClip)
                return;
            const id = el.getAttribute('data-clip-id');
            if (id) {
                selectedId = id;
                syncUI();
            }
        });
    });
    document.querySelectorAll('.timeline-clip').forEach(el => {
        el.addEventListener('mousedown', (e) => {
            const id = el.getAttribute('data-clip-id');
            if (id) {
                startClipDrag(e, id);
            }
        });
    });
    const trackAreas = timelineContainer.querySelectorAll('.timeline-track-area');
    for (const area of trackAreas) {
        area.addEventListener('mousedown', (e) => {
            const target = e.target;
            if (target.closest('.timeline-clip'))
                return;
            startSeek(e);
        });
    }
    const ruler = timelineContainer.querySelector('.timeline-ruler-inner');
    if (ruler) {
        ruler.addEventListener('mousedown', (e) => {
            startSeek(e);
        });
    }
    currentTimeDisplay.textContent = formatTime(currentFrame);
    totalTimeDisplay.textContent = formatTime(TOTAL_FRAMES);
}
// -------- タイムライン操作 --------
function startClipDrag(e, clipId) {
    if (isDraggingClip)
        return;
    const clip = clips.find(c => c.id === clipId);
    if (!clip)
        return;
    if (isPlaying)
        stopPlayback();
    isDraggingClip = true;
    dragClipId = clipId;
    dragStartFrame = clip.startFrame;
    dragStartLayer = clip.layerId;
    dragStartMouseX = e.clientX;
    dragStartMouseY = e.clientY;
    dragClipElement = e.target;
    selectedId = clipId;
    document.addEventListener('mousemove', onClipDragMove);
    document.addEventListener('mouseup', onClipDragEnd);
    document.addEventListener('mouseleave', onClipDragEnd);
    document.body.style.cursor = 'grabbing';
    drawTimeline();
}
function onClipDragMove(e) {
    if (!isDraggingClip || !dragClipId)
        return;
    const clip = clips.find(c => c.id === dragClipId);
    if (!clip)
        return;
    const container = timelineContainer;
    const rect = container.getBoundingClientRect();
    const containerWidth = container.clientWidth - 4;
    const usableWidth = containerWidth - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    const pixelsPerSecond = usableWidth / TIMELINE_DURATION;
    const deltaX = (e.clientX - dragStartMouseX) / pixelsPerSecond;
    let newStartFrame = Math.round(dragStartFrame + deltaX * FPS);
    const maxStart = TOTAL_FRAMES - clip.duration;
    newStartFrame = Math.max(0, Math.min(maxStart, newStartFrame));
    clip.startFrame = newStartFrame;
    const trackY = e.clientY - rect.top - TIMELINE_HEADER_HEIGHT;
    const layerIndex = Math.floor(trackY / TIMELINE_HEIGHT);
    let newLayerId = layerIndex + 1;
    newLayerId = Math.max(1, Math.min(LAYER_COUNT, newLayerId));
    const oldLayer = clip.layerId;
    clip.layerId = newLayerId;
    if (CONFIG.preventOverlap) {
        if (isOverlapping(clip, clip.id)) {
            clip.layerId = oldLayer;
        }
    }
    drawTimeline();
    drawPreview();
    if (selectedId === dragClipId)
        updatePropertyUI(clip);
}
function onClipDragEnd(e) {
    if (!isDraggingClip)
        return;
    isDraggingClip = false;
    dragClipId = null;
    dragClipElement = null;
    document.removeEventListener('mousemove', onClipDragMove);
    document.removeEventListener('mouseup', onClipDragEnd);
    document.removeEventListener('mouseleave', onClipDragEnd);
    document.body.style.cursor = '';
    drawTimeline();
    drawPreview();
    syncUI();
}
function updatePropertyUI(clip) {
    if (selectedId !== clip.id)
        return;
    startInput.value = String(clip.startFrame);
    durationInput.value = String(clip.duration);
}
// -------- シーク --------
function getFrameFromMouseEvent(e) {
    const container = timelineContainer;
    const rect = container.getBoundingClientRect();
    const containerWidth = container.clientWidth - 4;
    const usableWidth = containerWidth - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    const pixelsPerSecond = usableWidth / TIMELINE_DURATION;
    const x = e.clientX - rect.left - TIMELINE_PADDING_LEFT;
    const seconds = Math.max(0, Math.min(TIMELINE_DURATION, x / pixelsPerSecond));
    return Math.round(seconds * FPS);
}
function startSeek(e) {
    const target = e.target;
    if (target.closest('.timeline-clip'))
        return;
    if (isPlaying)
        stopPlayback();
    isSeeking = true;
    currentFrame = getFrameFromMouseEvent(e);
    drawTimeline();
    drawPreview();
    document.addEventListener('mousemove', onSeekMove);
    document.addEventListener('mouseup', onSeekEnd);
    document.addEventListener('mouseleave', onSeekEnd);
}
function onSeekMove(e) {
    if (!isSeeking)
        return;
    currentFrame = getFrameFromMouseEvent(e);
    drawTimeline();
    drawPreview();
}
function onSeekEnd(e) {
    if (!isSeeking)
        return;
    isSeeking = false;
    document.removeEventListener('mousemove', onSeekMove);
    document.removeEventListener('mouseup', onSeekEnd);
    document.removeEventListener('mouseleave', onSeekEnd);
}
// -------- 再生制御 --------
function togglePlay() {
    if (isPlaying)
        stopPlayback();
    else
        startPlayback();
}
function startPlayback() {
    if (isPlaying)
        return;
    if (currentFrame >= TOTAL_FRAMES)
        currentFrame = 0;
    isPlaying = true;
    playBtn.textContent = '⏸';
    playBtn.classList.add('playing');
    playInterval = window.setInterval(() => {
        currentFrame++;
        if (currentFrame >= TOTAL_FRAMES) {
            currentFrame = TOTAL_FRAMES;
            stopPlayback();
            drawTimeline();
            drawPreview();
            return;
        }
        drawTimeline();
        drawPreview();
    }, 1000 / FPS);
}
function stopPlayback() {
    isPlaying = false;
    playBtn.textContent = '▶';
    playBtn.classList.remove('playing');
    if (playInterval !== null) {
        clearInterval(playInterval);
        playInterval = null;
    }
}
// -------- 重なり関連 --------
function isOverlapping(clip, ignoreId) {
    return clips.some(other => {
        if (other.id === clip.id)
            return false;
        if (ignoreId && other.id === ignoreId)
            return false;
        if (other.layerId !== clip.layerId)
            return false;
        const aStart = clip.startFrame;
        const aEnd = clip.startFrame + clip.duration;
        const bStart = other.startFrame;
        const bEnd = other.startFrame + other.duration;
        return aStart < bEnd && bStart < aEnd;
    });
}
function resolveOverlap(clip, ignoreId) {
    if (!CONFIG.preventOverlap)
        return;
    let attempts = 0;
    while (isOverlapping(clip, ignoreId) && attempts < 100) {
        attempts++;
        clip.startFrame++;
        if (clip.startFrame + clip.duration > TOTAL_FRAMES) {
            clip.startFrame = TOTAL_FRAMES - clip.duration;
            if (clip.startFrame < 0) {
                clip.startFrame = 0;
                clip.duration = TOTAL_FRAMES;
            }
            break;
        }
    }
}
function applyOverlapPrevention(clip, ignoreId) {
    if (!CONFIG.preventOverlap)
        return;
    resolveOverlap(clip, ignoreId);
}
function findAvailableLayer(startFrame, duration) {
    for (let layerId = 1; layerId <= LAYER_COUNT; layerId++) {
        const hasOverlap = clips.some(clip => {
            if (clip.layerId !== layerId)
                return false;
            const aStart = startFrame;
            const aEnd = startFrame + duration;
            const bStart = clip.startFrame;
            const bEnd = clip.startFrame + clip.duration;
            return aStart < bEnd && bStart < aEnd;
        });
        if (!hasOverlap)
            return layerId;
    }
    return null;
}
// -------- 時間表示 --------
function formatTime(frame) {
    const seconds = frame / FPS;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}
// -------- UI同期 --------
function syncUI() {
    const selected = getSelected();
    const hasClips = clips.length > 0;
    if (selected && hasClips) {
        typeDisplay.textContent = selected.type === 'text' ? 'テキスト' : '図形';
        if (selected.type === 'text') {
            textProperties.style.display = '';
            shapeProperties.style.display = 'none';
            textInput.value = selected.text || '';
            fontSelect.value = selected.fontFamily || DEFAULT_FONT;
            fontSizeSlider.value = String(selected.fontSize || 50);
            fontSizeLabel.textContent = `${selected.fontSize || 50}px`;
            colorPicker.value = selected.color || '#ffffff';
        }
        else {
            textProperties.style.display = 'none';
            shapeProperties.style.display = '';
            shapeTypeSelect.value = selected.shapeType || 'rectangle';
            fillColorPicker.value = selected.fillColor || '#ffffff';
            strokeColorPicker.value = selected.strokeColor || '#ffffff';
            strokeWidthSlider.value = String(selected.strokeWidth || 0);
            strokeWidthLabel.textContent = `${selected.strokeWidth || 0}px`;
            shapeWidthSlider.value = String(selected.width || 100);
            shapeWidthLabel.textContent = `${selected.width || 100}px`;
            shapeHeightSlider.value = String(selected.height || 100);
            shapeHeightLabel.textContent = `${selected.height || 100}px`;
        }
        xSlider.value = String(selected.x);
        xNumber.value = String(selected.x);
        ySlider.value = String(selected.y);
        yNumber.value = String(selected.y);
        rotationSlider.value = String(selected.rotation);
        rotationNumber.value = String(selected.rotation);
        startInput.value = String(selected.startFrame);
        durationInput.value = String(selected.duration);
        updateSliderRange(xSlider, selected.x, SLIDER_STAGES.coord, isDraggingX);
        updateSliderRange(ySlider, selected.y, SLIDER_STAGES.coord, isDraggingY);
        updateSliderRange(rotationSlider, selected.rotation, SLIDER_STAGES.rotation, isDraggingRotation);
        updateSliderRangePositive(strokeWidthSlider, selected.strokeWidth || 0, SLIDER_STAGES.stroke, isDraggingStroke);
        updateSliderRangePositive(shapeWidthSlider, selected.width || 100, SLIDER_STAGES.size, isDraggingWidth);
        updateSliderRangePositive(shapeHeightSlider, selected.height || 100, SLIDER_STAGES.size, isDraggingHeight);
        updateSliderRangePositive(fontSizeSlider, selected.fontSize || 50, SLIDER_STAGES.fontSize, isDraggingFontSize);
        setPropertiesEnabled(true);
        autoResizeTextarea();
    }
    else {
        typeDisplay.textContent = '-';
        textProperties.style.display = '';
        shapeProperties.style.display = 'none';
        textInput.value = '';
        fontSizeLabel.textContent = '--';
        fontSelect.value = DEFAULT_FONT;
        setPropertiesEnabled(false);
    }
    drawTimeline();
    drawPreview();
}
function autoResizeTextarea() {
    textInput.style.height = 'auto';
    textInput.style.height = `${Math.min(textInput.scrollHeight, 120)}px`;
}
// -------- クリップ追加 --------
function addClip(type) {
    closeDropdown();
    const startFrame = currentFrame;
    const duration = DEFAULT_CLIP_DURATION;
    const layerId = findAvailableLayer(startFrame, duration);
    if (layerId === null) {
        alert('All layers are full at this time position. Please move or delete existing clips.');
        return;
    }
    let newClip;
    if (type === 'text') {
        newClip = {
            id: generateId(),
            type: 'text',
            layerId: layerId,
            startFrame: startFrame,
            duration: duration,
            x: 0,
            y: 0,
            rotation: 0,
            text: 'New Text',
            fontSize: 50,
            color: '#ffffff',
            fontFamily: DEFAULT_FONT,
        };
    }
    else {
        newClip = {
            id: generateId(),
            type: 'shape',
            layerId: layerId,
            startFrame: startFrame,
            duration: duration,
            x: 0,
            y: 0,
            rotation: 0,
            shapeType: 'rectangle',
            fillColor: '#ffffff',
            strokeColor: 'transparent',
            strokeWidth: 0,
            width: 100,
            height: 100,
        };
    }
    applyOverlapPrevention(newClip);
    clips.push(newClip);
    selectedId = newClip.id;
    syncUI();
}
// -------- テキスト削除 --------
function deleteSelected() {
    if (!selectedId)
        return;
    clips = clips.filter(c => c.id !== selectedId);
    selectedId = clips.length > 0 ? clips[0].id : null;
    syncUI();
}
// -------- 選択中のプロパティ更新 --------
function updateSelected() {
    const selected = getSelected();
    if (!selected)
        return;
    if (selected.type === 'text') {
        selected.text = textInput.value || ' ';
        selected.fontFamily = fontSelect.value;
        selected.fontSize = parseFloat(fontSizeSlider.value) || 50;
        selected.color = colorPicker.value;
    }
    else {
        selected.shapeType = shapeTypeSelect.value;
        selected.fillColor = fillColorPicker.value;
        selected.strokeColor = strokeColorPicker.value;
        selected.strokeWidth = parseFloat(strokeWidthSlider.value) || 0;
        selected.width = parseFloat(shapeWidthSlider.value) || 100;
        selected.height = parseFloat(shapeHeightSlider.value) || 100;
    }
    selected.x = parseFloat(xSlider.value) || 0;
    selected.y = parseFloat(ySlider.value) || 0;
    selected.rotation = parseFloat(rotationSlider.value) || 0;
    xNumber.value = String(selected.x);
    yNumber.value = String(selected.y);
    rotationNumber.value = String(selected.rotation);
    fontSizeLabel.textContent = `${selected.fontSize || 50}px`;
    strokeWidthLabel.textContent = `${selected.strokeWidth || 0}px`;
    shapeWidthLabel.textContent = `${selected.width || 100}px`;
    shapeHeightLabel.textContent = `${selected.height || 100}px`;
    autoResizeTextarea();
    drawPreview();
    drawTimeline();
}
// -------- Start / Duration 更新 --------
function updateStart() {
    const selected = getSelected();
    if (!selected)
        return;
    let val = parseInt(startInput.value, 10);
    if (isNaN(val) || val < 0)
        val = 0;
    const maxStart = TOTAL_FRAMES - selected.duration;
    if (val > maxStart)
        val = maxStart;
    const oldStart = selected.startFrame;
    selected.startFrame = val;
    if (CONFIG.preventOverlap && isOverlapping(selected, selected.id)) {
        selected.startFrame = oldStart;
        resolveOverlap(selected, selected.id);
    }
    startInput.value = String(selected.startFrame);
    drawTimeline();
    drawPreview();
}
function updateDuration() {
    const selected = getSelected();
    if (!selected)
        return;
    let val = parseInt(durationInput.value, 10);
    if (isNaN(val) || val < 1)
        val = 1;
    const maxStart = TOTAL_FRAMES - val;
    if (selected.startFrame > maxStart)
        selected.startFrame = Math.max(0, maxStart);
    const oldDuration = selected.duration;
    selected.duration = val;
    if (CONFIG.preventOverlap && isOverlapping(selected, selected.id)) {
        selected.duration = oldDuration;
        resolveOverlap(selected, selected.id);
    }
    durationInput.value = String(selected.duration);
    drawTimeline();
    drawPreview();
}
// -------- ★ 数値入力の共通設定 ★ --------
function setupAllNumberInputs() {
    // X
    setupNumberInput(xNumber, xSlider, {
        min: NUMBER_CONFIGS.x.min,
        max: NUMBER_CONFIGS.x.max,
        default: NUMBER_CONFIGS.x.default,
        stages: NUMBER_CONFIGS.x.stages,
        getIsDragging: () => isDraggingX || isDraggingY,
        updateSliderRangeFn: (val) => updateSliderRange(xSlider, val, SLIDER_STAGES.coord, false),
        onCommit: (val) => {
            const selected = getSelected();
            if (!selected)
                return;
            selected.x = val;
            xSlider.value = String(val);
            xNumber.value = String(val);
            if (!isDraggingX && !isDraggingY)
                updateSliderRange(xSlider, val, SLIDER_STAGES.coord, false);
            drawPreview();
        }
    });
    // Y
    setupNumberInput(yNumber, ySlider, {
        min: NUMBER_CONFIGS.y.min,
        max: NUMBER_CONFIGS.y.max,
        default: NUMBER_CONFIGS.y.default,
        stages: NUMBER_CONFIGS.y.stages,
        getIsDragging: () => isDraggingX || isDraggingY,
        updateSliderRangeFn: (val) => updateSliderRange(ySlider, val, SLIDER_STAGES.coord, false),
        onCommit: (val) => {
            const selected = getSelected();
            if (!selected)
                return;
            selected.y = val;
            ySlider.value = String(val);
            yNumber.value = String(val);
            if (!isDraggingX && !isDraggingY)
                updateSliderRange(ySlider, val, SLIDER_STAGES.coord, false);
            drawPreview();
        }
    });
    // Rotation
    setupNumberInput(rotationNumber, rotationSlider, {
        min: NUMBER_CONFIGS.rotation.min,
        max: NUMBER_CONFIGS.rotation.max,
        default: NUMBER_CONFIGS.rotation.default,
        stages: NUMBER_CONFIGS.rotation.stages,
        getIsDragging: () => isDraggingRotation,
        updateSliderRangeFn: (val) => updateSliderRange(rotationSlider, val, SLIDER_STAGES.rotation, false),
        onCommit: (val) => {
            const selected = getSelected();
            if (!selected)
                return;
            selected.rotation = val;
            rotationSlider.value = String(val);
            rotationNumber.value = String(val);
            if (!isDraggingRotation)
                updateSliderRange(rotationSlider, val, SLIDER_STAGES.rotation, false);
            drawPreview();
        }
    });
    // Start
    setupNumberInput(startInput, startInput, {
        min: NUMBER_CONFIGS.start.min,
        max: NUMBER_CONFIGS.start.max,
        default: NUMBER_CONFIGS.start.default,
        stages: null,
        getIsDragging: () => false,
        updateSliderRangeFn: () => { },
        onCommit: (val) => {
            const selected = getSelected();
            if (!selected)
                return;
            const oldStart = selected.startFrame;
            selected.startFrame = val;
            if (CONFIG.preventOverlap && isOverlapping(selected, selected.id)) {
                selected.startFrame = oldStart;
                resolveOverlap(selected, selected.id);
            }
            startInput.value = String(selected.startFrame);
            drawTimeline();
            drawPreview();
        }
    });
    // Duration
    setupNumberInput(durationInput, durationInput, {
        min: NUMBER_CONFIGS.duration.min,
        max: NUMBER_CONFIGS.duration.max,
        default: NUMBER_CONFIGS.duration.default,
        stages: null,
        getIsDragging: () => false,
        updateSliderRangeFn: () => { },
        onCommit: (val) => {
            const selected = getSelected();
            if (!selected)
                return;
            const maxStart = TOTAL_FRAMES - val;
            if (selected.startFrame > maxStart)
                selected.startFrame = Math.max(0, maxStart);
            const oldDuration = selected.duration;
            selected.duration = val;
            if (CONFIG.preventOverlap && isOverlapping(selected, selected.id)) {
                selected.duration = oldDuration;
                resolveOverlap(selected, selected.id);
            }
            durationInput.value = String(selected.duration);
            drawTimeline();
            drawPreview();
        }
    });
}
// -------- キーボードショートカット --------
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
            return;
        if (e.key === ' ') {
            e.preventDefault();
            togglePlay();
            return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            deleteSelected();
            return;
        }
        if (e.key === 'Escape' && settingsOverlay.classList.contains('active'))
            closeSettings();
    });
}
// -------- 設定UI --------
function openSettings() { settingsOverlay.classList.add('active'); }
function closeSettings() { settingsOverlay.classList.remove('active'); }
settingsToggle.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsCloseBtn.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay)
    closeSettings(); });
themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
overlapToggle.addEventListener('change', () => { CONFIG.preventOverlap = overlapToggle.checked; });
// -------- ドロップダウンメニュー --------
addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
});
document.addEventListener('click', () => {
    if (isDropdownOpen)
        closeDropdown();
});
addDropdownMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const target = e.target;
    if (target.dataset.type) {
        addClip(target.dataset.type);
    }
});
// -------- イベント登録 --------
deleteBtn.addEventListener('click', deleteSelected);
playBtn.addEventListener('click', togglePlay);
fontSizeSlider.addEventListener('input', updateSelected);
colorPicker.addEventListener('input', updateSelected);
shapeTypeSelect.addEventListener('change', updateSelected);
fillColorPicker.addEventListener('input', updateSelected);
strokeColorPicker.addEventListener('input', updateSelected);
strokeWidthSlider.addEventListener('input', updateSelected);
shapeWidthSlider.addEventListener('input', updateSelected);
shapeHeightSlider.addEventListener('input', updateSelected);
xSlider.addEventListener('input', updateSelected);
ySlider.addEventListener('input', updateSelected);
rotationSlider.addEventListener('input', updateSelected);
// スライダードラッグ制御
xSlider.addEventListener('mousedown', () => { isDraggingX = true; });
xSlider.addEventListener('mouseup', () => {
    isDraggingX = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(xSlider, selected.x, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
xSlider.addEventListener('mouseleave', () => {
    if (isDraggingX) {
        isDraggingX = false;
        const selected = getSelected();
        if (selected) {
            updateSliderRange(xSlider, selected.x, SLIDER_STAGES.coord, false);
            drawPreview();
        }
    }
});
xSlider.addEventListener('touchstart', () => { isDraggingX = true; });
xSlider.addEventListener('touchend', () => {
    isDraggingX = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(xSlider, selected.x, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
xSlider.addEventListener('touchcancel', () => {
    isDraggingX = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(xSlider, selected.x, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
ySlider.addEventListener('mousedown', () => { isDraggingY = true; });
ySlider.addEventListener('mouseup', () => {
    isDraggingY = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(ySlider, selected.y, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
ySlider.addEventListener('mouseleave', () => {
    if (isDraggingY) {
        isDraggingY = false;
        const selected = getSelected();
        if (selected) {
            updateSliderRange(ySlider, selected.y, SLIDER_STAGES.coord, false);
            drawPreview();
        }
    }
});
ySlider.addEventListener('touchstart', () => { isDraggingY = true; });
ySlider.addEventListener('touchend', () => {
    isDraggingY = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(ySlider, selected.y, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
ySlider.addEventListener('touchcancel', () => {
    isDraggingY = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(ySlider, selected.y, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
rotationSlider.addEventListener('mousedown', () => { isDraggingRotation = true; });
rotationSlider.addEventListener('mouseup', () => {
    isDraggingRotation = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(rotationSlider, selected.rotation, SLIDER_STAGES.rotation, false);
        drawPreview();
    }
});
rotationSlider.addEventListener('mouseleave', () => {
    if (isDraggingRotation) {
        isDraggingRotation = false;
        const selected = getSelected();
        if (selected) {
            updateSliderRange(rotationSlider, selected.rotation, SLIDER_STAGES.rotation, false);
            drawPreview();
        }
    }
});
rotationSlider.addEventListener('touchstart', () => { isDraggingRotation = true; });
rotationSlider.addEventListener('touchend', () => {
    isDraggingRotation = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(rotationSlider, selected.rotation, SLIDER_STAGES.rotation, false);
        drawPreview();
    }
});
rotationSlider.addEventListener('touchcancel', () => {
    isDraggingRotation = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(rotationSlider, selected.rotation, SLIDER_STAGES.rotation, false);
        drawPreview();
    }
});
strokeWidthSlider.addEventListener('mousedown', () => { isDraggingStroke = true; });
strokeWidthSlider.addEventListener('mouseup', () => {
    isDraggingStroke = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(strokeWidthSlider, selected.strokeWidth || 0, SLIDER_STAGES.stroke, false);
        drawPreview();
    }
});
strokeWidthSlider.addEventListener('mouseleave', () => {
    if (isDraggingStroke) {
        isDraggingStroke = false;
        const selected = getSelected();
        if (selected) {
            updateSliderRangePositive(strokeWidthSlider, selected.strokeWidth || 0, SLIDER_STAGES.stroke, false);
            drawPreview();
        }
    }
});
strokeWidthSlider.addEventListener('touchstart', () => { isDraggingStroke = true; });
strokeWidthSlider.addEventListener('touchend', () => {
    isDraggingStroke = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(strokeWidthSlider, selected.strokeWidth || 0, SLIDER_STAGES.stroke, false);
        drawPreview();
    }
});
strokeWidthSlider.addEventListener('touchcancel', () => {
    isDraggingStroke = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(strokeWidthSlider, selected.strokeWidth || 0, SLIDER_STAGES.stroke, false);
        drawPreview();
    }
});
shapeWidthSlider.addEventListener('mousedown', () => { isDraggingWidth = true; });
shapeWidthSlider.addEventListener('mouseup', () => {
    isDraggingWidth = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeWidthSlider, selected.width || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
shapeWidthSlider.addEventListener('mouseleave', () => {
    if (isDraggingWidth) {
        isDraggingWidth = false;
        const selected = getSelected();
        if (selected) {
            updateSliderRangePositive(shapeWidthSlider, selected.width || 100, SLIDER_STAGES.size, false);
            drawPreview();
        }
    }
});
shapeWidthSlider.addEventListener('touchstart', () => { isDraggingWidth = true; });
shapeWidthSlider.addEventListener('touchend', () => {
    isDraggingWidth = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeWidthSlider, selected.width || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
shapeWidthSlider.addEventListener('touchcancel', () => {
    isDraggingWidth = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeWidthSlider, selected.width || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
shapeHeightSlider.addEventListener('mousedown', () => { isDraggingHeight = true; });
shapeHeightSlider.addEventListener('mouseup', () => {
    isDraggingHeight = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeHeightSlider, selected.height || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
shapeHeightSlider.addEventListener('mouseleave', () => {
    if (isDraggingHeight) {
        isDraggingHeight = false;
        const selected = getSelected();
        if (selected) {
            updateSliderRangePositive(shapeHeightSlider, selected.height || 100, SLIDER_STAGES.size, false);
            drawPreview();
        }
    }
});
shapeHeightSlider.addEventListener('touchstart', () => { isDraggingHeight = true; });
shapeHeightSlider.addEventListener('touchend', () => {
    isDraggingHeight = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeHeightSlider, selected.height || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
shapeHeightSlider.addEventListener('touchcancel', () => {
    isDraggingHeight = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeHeightSlider, selected.height || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
fontSizeSlider.addEventListener('mousedown', () => { isDraggingFontSize = true; });
fontSizeSlider.addEventListener('mouseup', () => {
    isDraggingFontSize = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(fontSizeSlider, selected.fontSize || 50, SLIDER_STAGES.fontSize, false);
        drawPreview();
    }
});
fontSizeSlider.addEventListener('mouseleave', () => {
    if (isDraggingFontSize) {
        isDraggingFontSize = false;
        const selected = getSelected();
        if (selected) {
            updateSliderRangePositive(fontSizeSlider, selected.fontSize || 50, SLIDER_STAGES.fontSize, false);
            drawPreview();
        }
    }
});
fontSizeSlider.addEventListener('touchstart', () => { isDraggingFontSize = true; });
fontSizeSlider.addEventListener('touchend', () => {
    isDraggingFontSize = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(fontSizeSlider, selected.fontSize || 50, SLIDER_STAGES.fontSize, false);
        drawPreview();
    }
});
fontSizeSlider.addEventListener('touchcancel', () => {
    isDraggingFontSize = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(fontSizeSlider, selected.fontSize || 50, SLIDER_STAGES.fontSize, false);
        drawPreview();
    }
});
fontSelect.addEventListener('change', updateSelected);
setupAllNumberInputs();
setupKeyboardShortcuts();
// -------- 設定切り替え用関数 --------
function setOverlapPrevention(enabled) {
    CONFIG.preventOverlap = enabled;
    overlapToggle.checked = enabled;
    if (enabled) {
        for (const clip of clips)
            resolveOverlap(clip, clip.id);
        syncUI();
    }
}
// -------- デバッグ用グローバル公開 --------
window.__editor = {
    currentFrame,
    clips,
    drawPreview,
    drawTimeline,
    setFrame: (frame) => {
        currentFrame = Math.max(0, Math.min(TOTAL_FRAMES, frame));
        drawPreview();
        drawTimeline();
        console.log(`Frame set to ${currentFrame} (${(currentFrame / FPS).toFixed(2)}s)`);
    },
    getFrame: () => currentFrame,
    getClips: () => clips,
    togglePlay,
    play: startPlayback,
    stop: stopPlayback,
    reset: () => { stopPlayback(); currentFrame = 0; drawTimeline(); drawPreview(); },
    setOverlapPrevention,
    config: CONFIG,
    applyTheme,
    themes: THEMES,
};
// -------- 初期化 --------
function init() {
    selectedId = null;
    totalTimeDisplay.textContent = formatTime(TOTAL_FRAMES);
    applyTheme(CONFIG.theme);
    syncUI();
}
init();
// -------- リサイズ --------
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 32;
    const aspectRatio = 16 / 9;
    let w = Math.min(containerWidth, 960);
    let h = w / aspectRatio;
    if (h > window.innerHeight * 0.6) {
        h = window.innerHeight * 0.6;
        w = h * aspectRatio;
    }
    canvas.style.width = `${Math.floor(w)}px`;
    canvas.style.height = `${Math.floor(h)}px`;
}
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);
