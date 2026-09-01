// ============================================================
// AJ Video Editor - エントリーポイント
// フェーズ12: プレビュー上でクリップをドラッグ移動
// ============================================================
// -------- 定数 --------
const TIMELINE_DURATION = 20;
const DEFAULT_FONT = '"Hiragino Sans", "Microsoft YaHei", sans-serif';
const TIMELINE_HEIGHT = 32;
const TIMELINE_PADDING_LEFT = 80;
const TIMELINE_PADDING_RIGHT = 20;
const TIMELINE_HEADER_HEIGHT = 28;
const MAX_LAYERS = 99;
const DEFAULT_LAYER_COUNT = 10;
// -------- 初期設定 --------
const CONFIG = {
    preventOverlap: true,
    theme: 'white',
    bgColor: '#000000',
    layerCount: DEFAULT_LAYER_COUNT,
    resolution: { width: 1920, height: 1080 },
    fps: 60,
};
// -------- configを参照する定数 --------
const totalFrames = TIMELINE_DURATION * CONFIG.fps;
const DEFAULT_CLIP_DURATION = 3 * CONFIG.fps;
// -------- クリップタイプごとの色 --------
const CLIP_COLORS = {
    text: '#0077ff', // 青
    shape: '#ff0055', // ピンク
    // 今後追加: video: '#...', image: '#...'
};
// 色の取得関数（後で拡張しやすいように）
function getClipColor(type) {
    return CLIP_COLORS[type] || '#888888'; // 未定義の場合はグレー
}
// -------- スライダー拡張段階定義 --------
const SLIDER_STAGES = {
    coord: [500, 1000, 2000, 4000, 8000],
    rotation: [180, 360, 720, 1440],
    size: [100, 200, 400, 800, 1600, 3200],
    stroke: [100, 200, 400, 800, 1600, 3200],
    fontSize: [100, 200, 400, 800, 1600, 3200],
};
// -------- 数値入力の設定 --------
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
// -------- 汎用関数 --------
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
// -------- 共通数値入力処理 --------
function setupNumberInput(input, slider, config) {
    input.addEventListener('click', () => input.select());
    input.addEventListener('focus', () => input.select());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitNumberInput(input, slider, config);
        }
    });
    input.addEventListener('change', () => {
        commitNumberInput(input, slider, config);
    });
}
function commitNumberInput(input, slider, config) {
    let val = parseFloat(input.value);
    if (isNaN(val) || input.value.trim() === '') {
        val = config.default;
    }
    val = Math.max(config.min, Math.min(config.max, val));
    slider.value = String(val);
    input.value = String(val);
    if (config.stages) {
        config.updateSliderRangeFn(val);
    }
    config.onCommit(val);
    input.blur();
}
// -------- スライダードラッグ制御（共通化） --------
function setupSliderDrag(slider, onStart, onEnd) {
    const start = () => { onStart(); };
    const end = () => { onEnd(); };
    slider.addEventListener('mousedown', start);
    slider.addEventListener('mouseup', end);
    slider.addEventListener('mouseleave', end);
    slider.addEventListener('touchstart', start);
    slider.addEventListener('touchend', end);
    slider.addEventListener('touchcancel', end);
}
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
const layerCountInput = document.getElementById('layerCountInput');
const applyLayerCountBtn = document.getElementById('applyLayerCountBtn');
const bgColorPicker = document.getElementById('bgColorPicker');
const resolutionSelect = document.getElementById('resolutionSelect');
const fpsSelect = document.getElementById('fpsSelect');
// ★ ズーム関連DOM（後で生成するので変数だけ先に宣言）
let zoomInBtn;
let zoomOutBtn;
let zoomLevelDisplay;
// タブ用DOM
const settingsTabs = document.getElementById('settingsTabs');
const tabProject = document.getElementById('tabProject');
const tabEditor = document.getElementById('tabEditor');
// リサイズ用DOM
const resizeHandleHorizontal = document.getElementById('resizeHandleHorizontal');
const resizeHandleVertical = document.getElementById('resizeHandleVertical');
const canvasWrapper = document.getElementById('canvasWrapper');
const propertiesPanel = document.getElementById('propertiesPanel');
const bottomSection = document.getElementById('bottomSection');
// -------- キャンバスサイズ --------
const MAX_COORD = 8000;
const MAX_ROTATION = 1440;
// -------- 状態 --------
let clips = [];
let selectedId = null;
let idCounter = 0;
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;
let currentLayerCount = CONFIG.layerCount;
// ★ ズーム関連
let timelineZoom = 1.0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8.0;
// ドラッグ中フラグ
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
// プレビュードラッグ用
let isDraggingPreview = false;
let dragPreviewClipId = null;
let dragPreviewStartX = 0;
let dragPreviewStartY = 0;
let dragPreviewOffsetX = 0;
let dragPreviewOffsetY = 0;
// リサイズ用状態
let isResizingHorizontal = false;
let isResizingVertical = false;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
const MIN_PANEL_WIDTH = 200;
const MIN_TIMELINE_HEIGHT = 80;
let isDropdownOpen = false;
function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    addDropdownMenu.classList.toggle('active', isDropdownOpen);
}
function closeDropdown() {
    isDropdownOpen = false;
    addDropdownMenu.classList.remove('active');
}
// -------- タブ切り替え --------
function setupSettingsTabs() {
    const tabs = settingsTabs.querySelectorAll('button');
    const contents = {
        project: tabProject,
        editor: tabEditor,
    };
    tabs.forEach(button => {
        button.addEventListener('click', () => {
            // タブのアクティブ状態を切り替え
            tabs.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            // コンテンツの表示を切り替え
            const tabName = button.dataset.tab;
            Object.entries(contents).forEach(([key, content]) => {
                content.classList.toggle('active', key === tabName);
            });
        });
    });
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
// -------- レイヤー数変更 --------
function setLayerCount(newCount) {
    newCount = Math.max(1, Math.min(MAX_LAYERS, newCount));
    if (newCount === currentLayerCount)
        return;
    if (newCount < currentLayerCount) {
        for (const clip of clips) {
            if (clip.layerId > newCount) {
                clip.layerId = newCount;
            }
        }
    }
    currentLayerCount = newCount;
    CONFIG.layerCount = newCount;
    layerCountInput.value = String(newCount);
    drawTimeline();
    drawPreview();
}
// -------- 図形描画 --------
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
    ctx.fillStyle = CONFIG.bgColor;
    const { width, height } = CONFIG.resolution;
    const cx = width / 2;
    const cy = height / 2;
    ctx.fillRect(0, 0, width, height);
    // グリッド線は width, height を使う
    // 原点は cx, cy を使う
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CONFIG.resolution.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CONFIG.resolution.height);
        ctx.stroke();
    }
    for (let i = 0; i <= CONFIG.resolution.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CONFIG.resolution.width, i);
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(CONFIG.resolution.width / 2, 0);
    ctx.lineTo(CONFIG.resolution.width / 2, CONFIG.resolution.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.resolution.height / 2);
    ctx.lineTo(CONFIG.resolution.width, CONFIG.resolution.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,50,50,0.5)';
    ctx.beginPath();
    ctx.arc(CONFIG.resolution.width / 2, CONFIG.resolution.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    const visibleClips = getClipsAtFrame(currentFrame);
    visibleClips.sort((a, b) => a.layerId - b.layerId);
    for (const clip of visibleClips) {
        const drawX = CONFIG.resolution.width / 2 + clip.x;
        const drawY = CONFIG.resolution.height / 2 + clip.y;
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
// -------- プレビュードラッグ --------
function getClipAtPosition(cx, cy) {
    const visibleClips = getClipsAtFrame(currentFrame);
    for (let i = visibleClips.length - 1; i >= 0; i--) {
        const clip = visibleClips[i];
        const drawX = CONFIG.resolution.width / 2 + clip.x;
        const drawY = CONFIG.resolution.height / 2 + clip.y;
        let width = 100;
        let height = 60;
        if (clip.type === 'text') {
            const lines = clip.text?.split('\n') || [''];
            const fontSize = clip.fontSize || 48;
            const lineHeight = fontSize * 1.2;
            height = lines.length * lineHeight;
            let maxWidth = 0;
            ctx.font = `${fontSize}px ${clip.fontFamily || DEFAULT_FONT}`;
            for (const line of lines) {
                const metrics = ctx.measureText(line);
                if (metrics.width > maxWidth)
                    maxWidth = metrics.width;
            }
            width = maxWidth || 100;
            width += 20;
            height += 20;
        }
        else if (clip.type === 'shape') {
            width = clip.width || 100;
            height = clip.height || 100;
        }
        const halfW = width / 2;
        const halfH = height / 2;
        if (cx >= drawX - halfW && cx <= drawX + halfW &&
            cy >= drawY - halfH && cy <= drawY + halfH) {
            return clip;
        }
    }
    return null;
}
function setupPreviewDrag() {
    let isPointerDown = false;
    let pointerDownClip = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let clipStartX = 0;
    let clipStartY = 0;
    const onPointerDown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        const clip = getClipAtPosition(canvasX, canvasY);
        if (!clip)
            return;
        selectedId = clip.id;
        syncUI();
        isPointerDown = true;
        pointerDownClip = clip;
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        clipStartX = clip.x;
        clipStartY = clip.y;
        canvas.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);
    };
    const onPointerMove = (e) => {
        if (!isPointerDown || !pointerDownClip)
            return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const deltaX = (e.clientX - pointerStartX) * scaleX;
        const deltaY = (e.clientY - pointerStartY) * scaleY;
        if (!isDraggingPreview && (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3))
            return;
        isDraggingPreview = true;
        const newX = Math.round(clipStartX + deltaX);
        const newY = Math.round(clipStartY + deltaY);
        pointerDownClip.x = newX;
        pointerDownClip.y = newY;
        if (selectedId === pointerDownClip.id) {
            xNumber.value = String(newX);
            xSlider.value = String(newX);
            yNumber.value = String(newY);
            ySlider.value = String(newY);
        }
        drawPreview();
    };
    const onPointerUp = (e) => {
        if (isDraggingPreview && pointerDownClip) {
            if (selectedId === pointerDownClip.id) {
                syncUI();
            }
        }
        isPointerDown = false;
        isDraggingPreview = false;
        pointerDownClip = null;
        canvas.style.cursor = 'default';
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
    };
    canvas.addEventListener('mousedown', onPointerDown);
}
// -------- タイムライン描画 --------
// ☆
function drawTimeline() {
    const containerWidth = timelineContainer.clientWidth - 4;
    const visibleDuration = getVisibleDuration();
    const pixelsPerSecond = getPixelsPerSecond(containerWidth);
    const totalWidth = getTotalTimelineWidth(containerWidth);
    const totalTrackHeight = currentLayerCount * TIMELINE_HEIGHT;
    const totalHeight = TIMELINE_HEADER_HEIGHT + totalTrackHeight;
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
    const headX = (currentFrame / CONFIG.fps) * pixelsPerSecond;
    html += `<div class="timeline-playhead" style="left:${headX}px;"></div>`;
    html += `</div></div>`;
    for (let layerId = 1; layerId <= currentLayerCount; layerId++) {
        const layerLabel = String(layerId).padStart(2, '0');
        html += `<div class="timeline-track" style="height:${TIMELINE_HEIGHT}px;">`;
        html += `<div class="timeline-track-label">LAYER ${layerLabel}</div>`;
        html += `<div class="timeline-track-area" style="position:relative; flex:1; height:100%;">`;
        const layerClips = clips.filter(c => c.layerId === layerId);
        for (const clip of layerClips) {
            const left = (clip.startFrame / CONFIG.fps) * pixelsPerSecond;
            const width = (clip.duration / CONFIG.fps) * pixelsPerSecond;
            const isSelected = clip.id === selectedId;
            const color = getClipColor(clip.type);
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
    html += `<div class="timeline-add-layer">`;
    html += `<button class="btn-primary btn-sm" id="addLayerBtn" style="width:100%; max-width:200px;">+ Add Layer</button>`;
    html += `<div id="addLayerInputContainer">`;
    html += `<input type="number" id="addLayerCountInput" value="1" min="1" max="99" />`;
    html += `<span class="hint">layers</span>`;
    html += `<button class="btn-primary btn-sm" id="confirmAddLayerBtn">Add</button>`;
    html += `<button class="btn-primary btn-sm btn-danger" id="cancelAddLayerBtn">Cancel</button>`;
    html += `</div></div>`;
    const containerHeight = timelineContainer.clientHeight || Math.min(totalHeight + 8 + 32, 500);
    timelineContainer.style.height = `${Math.max(80, containerHeight)}px`;
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
    const addLayerBtn = document.getElementById('addLayerBtn');
    const addLayerInputContainer = document.getElementById('addLayerInputContainer');
    const addLayerCountInput = document.getElementById('addLayerCountInput');
    const confirmAddLayerBtn = document.getElementById('confirmAddLayerBtn');
    const cancelAddLayerBtn = document.getElementById('cancelAddLayerBtn');
    if (addLayerBtn) {
        addLayerBtn.addEventListener('click', () => {
            addLayerBtn.style.display = 'none';
            if (addLayerInputContainer) {
                addLayerInputContainer.style.display = 'flex';
                addLayerCountInput?.focus();
                addLayerCountInput?.select();
            }
        });
    }
    if (confirmAddLayerBtn) {
        confirmAddLayerBtn.addEventListener('click', () => {
            const val = parseInt(addLayerCountInput?.value || '1', 10);
            if (!isNaN(val) && val > 0) {
                const newCount = Math.min(currentLayerCount + val, MAX_LAYERS);
                setLayerCount(newCount);
            }
            if (addLayerInputContainer) {
                addLayerInputContainer.style.display = 'none';
            }
            if (addLayerBtn) {
                addLayerBtn.style.display = '';
            }
        });
    }
    if (cancelAddLayerBtn) {
        cancelAddLayerBtn.addEventListener('click', () => {
            if (addLayerInputContainer) {
                addLayerInputContainer.style.display = 'none';
            }
            if (addLayerBtn) {
                addLayerBtn.style.display = '';
            }
        });
    }
    if (addLayerCountInput) {
        addLayerCountInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmAddLayerBtn?.click();
            }
            if (e.key === 'Escape') {
                cancelAddLayerBtn?.click();
            }
        });
    }
    currentTimeDisplay.textContent = formatTime(currentFrame);
    totalTimeDisplay.textContent = formatTime(TIMELINE_DURATION * CONFIG.fps);
    // ☆ -------- ズームコントロールを追加 --------
    const timelineControls = document.querySelector('.timeline-controls');
    if (timelineControls && !document.getElementById('zoomControls')) {
        const zoomControls = document.createElement('div');
        zoomControls.id = 'zoomControls';
        zoomControls.style.cssText = 'display:flex; align-items:center; gap:6px; margin-left:12px;';
        zoomOutBtn = document.createElement('button');
        zoomOutBtn.id = 'zoomOutBtn';
        zoomOutBtn.className = 'btn-primary btn-sm';
        zoomOutBtn.textContent = '−';
        zoomOutBtn.style.cssText = 'padding:2px 10px; font-size:16px;';
        zoomLevelDisplay = document.createElement('span');
        zoomLevelDisplay.id = 'zoomLevel';
        zoomLevelDisplay.style.cssText = 'font-size:12px; color:var(--text-secondary); min-width:44px; text-align:center;';
        updateZoomDisplay();
        zoomInBtn = document.createElement('button');
        zoomInBtn.id = 'zoomInBtn';
        zoomInBtn.className = 'btn-primary btn-sm';
        zoomInBtn.textContent = '＋';
        zoomInBtn.style.cssText = 'padding:2px 10px; font-size:16px;';
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(zoomLevelDisplay);
        zoomControls.appendChild(zoomInBtn);
        timelineControls.appendChild(zoomControls);
    }
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
    // ☆
    const pixelsPerSecond = getPixelsPerSecond(containerWidth);
    // 横方向のドラッグでフレームを変更
    const deltaX = (e.clientX - dragStartMouseX) / pixelsPerSecond;
    let newStartFrame = Math.round(dragStartFrame + deltaX * CONFIG.fps);
    const maxStart = TIMELINE_DURATION * CONFIG.fps - clip.duration;
    newStartFrame = Math.max(0, Math.min(maxStart, newStartFrame));
    // 縦方向のドラッグでレイヤーを変更
    const trackY = e.clientY - rect.top - TIMELINE_HEADER_HEIGHT;
    const layerIndex = Math.floor(trackY / TIMELINE_HEIGHT);
    let newLayerId = layerIndex + 1;
    newLayerId = Math.max(1, Math.min(currentLayerCount, newLayerId));
    // ★ 横移動を先に試す（同じレイヤーのまま）
    const oldStartFrame = clip.startFrame;
    const oldLayerId = clip.layerId;
    clip.startFrame = newStartFrame;
    // 横移動だけで重なる場合 → 調整
    if (CONFIG.preventOverlap && isOverlapping(clip, clip.id)) {
        const direction = newStartFrame > oldStartFrame ? 1 : -1;
        let testFrame = oldStartFrame + direction;
        let found = false;
        let attempts = 0;
        while (attempts < 100 && !found) {
            attempts++;
            clip.startFrame = testFrame;
            if (!isOverlapping(clip, clip.id)) {
                found = true;
                break;
            }
            testFrame += direction;
            if (testFrame < 0 || testFrame > TIMELINE_DURATION * CONFIG.fps - clip.duration) {
                break;
            }
        }
        if (!found) {
            clip.startFrame = oldStartFrame;
        }
    }
    // ★ レイヤー変更を試す（横移動は維持したまま）
    if (newLayerId !== oldLayerId) {
        const currentStartFrame = clip.startFrame;
        clip.layerId = newLayerId;
        if (CONFIG.preventOverlap && isOverlapping(clip, clip.id)) {
            // レイヤー変更で重なる場合 → 空いてるレイヤーを探す
            const availableLayer = findAvailableLayer(currentStartFrame, clip.duration);
            if (availableLayer !== null) {
                clip.layerId = availableLayer;
            }
            else {
                // 空いてるレイヤーがない → 元のレイヤーに戻す
                clip.layerId = oldLayerId;
            }
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
// ☆
function getFrameFromMouseEvent(e) {
    const container = timelineContainer;
    const rect = container.getBoundingClientRect();
    const containerWidth = container.clientWidth - 4;
    const pixelsPerSecond = getPixelsPerSecond(containerWidth);
    const x = e.clientX - rect.left - TIMELINE_PADDING_LEFT + container.scrollLeft;
    const seconds = Math.max(0, Math.min(TIMELINE_DURATION, x / pixelsPerSecond));
    return Math.round(seconds * CONFIG.fps);
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
    if (currentFrame >= TIMELINE_DURATION * CONFIG.fps)
        currentFrame = 0;
    isPlaying = true;
    playBtn.textContent = '⏸';
    playBtn.classList.add('playing');
    playInterval = window.setInterval(() => {
        currentFrame++;
        if (currentFrame >= TIMELINE_DURATION * CONFIG.fps) {
            currentFrame = TIMELINE_DURATION * CONFIG.fps;
            stopPlayback();
            drawTimeline();
            drawPreview();
            return;
        }
        drawTimeline();
        drawPreview();
    }, 1000 / CONFIG.fps);
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
        if (clip.startFrame + clip.duration > TIMELINE_DURATION * CONFIG.fps) {
            clip.startFrame = TIMELINE_DURATION * CONFIG.fps - clip.duration;
            if (clip.startFrame < 0) {
                clip.startFrame = 0;
                clip.duration = TIMELINE_DURATION * CONFIG.fps;
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
    for (let layerId = 1; layerId <= currentLayerCount; layerId++) {
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
//  -------- 時間表示 --------
function formatTime(frame) {
    const seconds = frame / CONFIG.fps;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}
// ★ ヘルパー関数
function getVisibleDuration() {
    return TIMELINE_DURATION / timelineZoom;
}
function getPixelsPerSecond(containerWidth) {
    const usableWidth = containerWidth - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    const visibleDuration = getVisibleDuration();
    return usableWidth / visibleDuration;
}
function getTotalTimelineWidth(containerWidth) {
    const usableWidth = containerWidth - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    const visibleDuration = getVisibleDuration();
    return (TIMELINE_DURATION / visibleDuration) * usableWidth + TIMELINE_PADDING_LEFT + TIMELINE_PADDING_RIGHT;
}
function getTickInterval() {
    const visibleDuration = getVisibleDuration();
    if (visibleDuration <= 2)
        return 0.5;
    if (visibleDuration <= 5)
        return 1.0;
    if (visibleDuration <= 10)
        return 2.0;
    if (visibleDuration <= 20)
        return 5.0;
    return 10.0;
}
function updateZoomDisplay() {
    const percent = Math.round(timelineZoom * 100);
    if (zoomLevelDisplay) {
        zoomLevelDisplay.textContent = `${percent}%`;
    }
}
// ★ ズーム制御関数
function zoomTimeline(factor) {
    const oldZoom = timelineZoom;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, timelineZoom * factor));
    if (newZoom === timelineZoom)
        return;
    const container = timelineContainer;
    const containerWidth = container.clientWidth - 4;
    // 再生ヘッドの現在位置（ピクセル）を計算
    const oldPixelsPerSecond = getPixelsPerSecond(containerWidth);
    const headPixel = (currentFrame / CONFIG.fps) * oldPixelsPerSecond + TIMELINE_PADDING_LEFT;
    // ズームを適用
    timelineZoom = newZoom;
    // 再生ヘッドが同じ位置に見えるようにスクロール調整
    const newPixelsPerSecond = getPixelsPerSecond(containerWidth);
    const newHeadPixel = (currentFrame / CONFIG.fps) * newPixelsPerSecond + TIMELINE_PADDING_LEFT;
    container.scrollLeft += (newHeadPixel - headPixel);
    updateZoomDisplay();
    drawTimeline();
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
        textProperties.style.display = 'none';
        shapeProperties.style.display = 'none';
        textInput.value = '';
        fontSizeLabel.textContent = '--';
        fontSelect.value = DEFAULT_FONT;
        xNumber.value = '';
        yNumber.value = '';
        rotationNumber.value = '';
        startInput.value = '';
        durationInput.value = '';
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
    const maxStart = TIMELINE_DURATION * CONFIG.fps - selected.duration;
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
    const maxStart = TIMELINE_DURATION * CONFIG.fps - val;
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
// -------- 数値入力の共通設定（ループ化） --------
function setupAllNumberInputs() {
    const configs = [
        {
            input: xNumber,
            slider: xSlider,
            config: NUMBER_CONFIGS.x,
            getIsDragging: () => isDraggingX || isDraggingY,
            updateFn: (val) => updateSliderRange(xSlider, val, SLIDER_STAGES.coord, false),
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
        },
        {
            input: yNumber,
            slider: ySlider,
            config: NUMBER_CONFIGS.y,
            getIsDragging: () => isDraggingX || isDraggingY,
            updateFn: (val) => updateSliderRange(ySlider, val, SLIDER_STAGES.coord, false),
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
        },
        {
            input: rotationNumber,
            slider: rotationSlider,
            config: NUMBER_CONFIGS.rotation,
            getIsDragging: () => isDraggingRotation,
            updateFn: (val) => updateSliderRange(rotationSlider, val, SLIDER_STAGES.rotation, false),
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
        },
        {
            input: startInput,
            slider: startInput,
            config: NUMBER_CONFIGS.start,
            getIsDragging: () => false,
            updateFn: () => { },
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
        },
        {
            input: durationInput,
            slider: durationInput,
            config: NUMBER_CONFIGS.duration,
            getIsDragging: () => false,
            updateFn: () => { },
            onCommit: (val) => {
                const selected = getSelected();
                if (!selected)
                    return;
                const maxStart = TIMELINE_DURATION * CONFIG.fps - val;
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
        }
    ];
    for (const cfg of configs) {
        setupNumberInput(cfg.input, cfg.slider, {
            min: cfg.config.min,
            max: cfg.config.max,
            default: cfg.config.default,
            stages: cfg.config.stages,
            getIsDragging: cfg.getIsDragging,
            updateSliderRangeFn: cfg.updateFn,
            onCommit: cfg.onCommit
        });
    }
}
// -------- パネルリサイズ機能 --------
function setupResizeHandles() {
    resizeHandleHorizontal.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizingHorizontal = true;
        resizeStartX = e.clientX;
        resizeStartWidth = canvasWrapper.getBoundingClientRect().width;
        resizeHandleHorizontal.classList.add('active');
        document.addEventListener('mousemove', onHorizontalResize);
        document.addEventListener('mouseup', onHorizontalResizeEnd);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    resizeHandleVertical.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizingVertical = true;
        resizeStartY = e.clientY;
        resizeStartHeight = bottomSection.getBoundingClientRect().height;
        resizeHandleVertical.classList.add('active');
        document.addEventListener('mousemove', onVerticalResize);
        document.addEventListener('mouseup', onVerticalResizeEnd);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    });
}
function onHorizontalResize(e) {
    if (!isResizingHorizontal)
        return;
    const delta = e.clientX - resizeStartX;
    const newWidth = resizeStartWidth + delta;
    const parentWidth = canvasWrapper.parentElement.getBoundingClientRect().width - 6;
    const maxWidth = parentWidth - MIN_PANEL_WIDTH;
    if (newWidth >= MIN_PANEL_WIDTH && newWidth <= maxWidth) {
        canvasWrapper.style.flex = 'none';
        canvasWrapper.style.width = `${newWidth}px`;
    }
}
function onHorizontalResizeEnd(e) {
    isResizingHorizontal = false;
    resizeHandleHorizontal.classList.remove('active');
    document.removeEventListener('mousemove', onHorizontalResize);
    document.removeEventListener('mouseup', onHorizontalResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    drawPreview();
}
function onVerticalResize(e) {
    if (!isResizingVertical)
        return;
    const topSectionHeight = document.querySelector('.top-section').getBoundingClientRect().height;
    const container = document.querySelector('.main-content');
    const totalHeight = container.getBoundingClientRect().height - 50;
    const delta = -(e.clientY - resizeStartY);
    const newHeight = Math.min(Math.max(resizeStartHeight + delta, MIN_TIMELINE_HEIGHT), totalHeight * 0.6);
    bottomSection.style.height = `${newHeight}px`;
    bottomSection.style.minHeight = `${MIN_TIMELINE_HEIGHT}px`;
    drawTimeline();
}
function onVerticalResizeEnd(e) {
    isResizingVertical = false;
    resizeHandleVertical.classList.remove('active');
    document.removeEventListener('mousemove', onVerticalResize);
    document.removeEventListener('mouseup', onVerticalResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
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
// -------- 設定UIのイベント登録 --------
themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
overlapToggle.addEventListener('change', () => { CONFIG.preventOverlap = overlapToggle.checked; });
applyLayerCountBtn.addEventListener('click', () => {
    const val = parseInt(layerCountInput.value, 10);
    if (!isNaN(val)) {
        setLayerCount(val);
    }
});
layerCountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const val = parseInt(layerCountInput.value, 10);
        if (!isNaN(val)) {
            setLayerCount(val);
        }
    }
});
// 背景色変更
bgColorPicker.addEventListener('input', () => {
    CONFIG.bgColor = bgColorPicker.value;
    drawPreview();
});
// 解像度変更
resolutionSelect.addEventListener('change', () => {
    const [w, h] = resolutionSelect.value.split('x').map(Number);
    CONFIG.resolution = { width: w, height: h };
    canvas.width = w;
    canvas.height = h;
    drawPreview();
    drawTimeline();
});
// FPS変更
fpsSelect.addEventListener('change', () => {
    CONFIG.fps = Number(fpsSelect.value);
    drawPreview();
    drawTimeline();
});
// -------- タブ切り替え設定 --------
setupSettingsTabs();
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
setupSliderDrag(xSlider, () => { isDraggingX = true; }, () => {
    isDraggingX = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(xSlider, selected.x, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
setupSliderDrag(ySlider, () => { isDraggingY = true; }, () => {
    isDraggingY = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(ySlider, selected.y, SLIDER_STAGES.coord, false);
        drawPreview();
    }
});
setupSliderDrag(rotationSlider, () => { isDraggingRotation = true; }, () => {
    isDraggingRotation = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRange(rotationSlider, selected.rotation, SLIDER_STAGES.rotation, false);
        drawPreview();
    }
});
setupSliderDrag(strokeWidthSlider, () => { isDraggingStroke = true; }, () => {
    isDraggingStroke = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(strokeWidthSlider, selected.strokeWidth || 0, SLIDER_STAGES.stroke, false);
        drawPreview();
    }
});
setupSliderDrag(shapeWidthSlider, () => { isDraggingWidth = true; }, () => {
    isDraggingWidth = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeWidthSlider, selected.width || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
setupSliderDrag(shapeHeightSlider, () => { isDraggingHeight = true; }, () => {
    isDraggingHeight = false;
    const selected = getSelected();
    if (selected) {
        updateSliderRangePositive(shapeHeightSlider, selected.height || 100, SLIDER_STAGES.size, false);
        drawPreview();
    }
});
setupSliderDrag(fontSizeSlider, () => { isDraggingFontSize = true; }, () => {
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
setupResizeHandles();
setupPreviewDrag();
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
function setBackgroundColor(color) {
    CONFIG.bgColor = color;
    drawPreview();
}
// -------- デバッグ用グローバル公開 --------
window.__editor = {
    currentFrame,
    clips,
    drawPreview,
    drawTimeline,
    setFrame: (frame) => {
        currentFrame = Math.max(0, Math.min(TIMELINE_DURATION * CONFIG.fps, frame));
        drawPreview();
        drawTimeline();
        console.log(`Frame set to ${currentFrame} (${(currentFrame / CONFIG.fps).toFixed(2)}s)`);
    },
    getFrame: () => currentFrame,
    getClips: () => clips,
    togglePlay,
    play: startPlayback,
    stop: stopPlayback,
    reset: () => { stopPlayback(); currentFrame = 0; drawTimeline(); drawPreview(); },
    setOverlapPrevention,
    setBackgroundColor,
    setLayerCount,
    config: CONFIG,
    applyTheme,
    themes: THEMES,
    // デバッグ用
    //isOverlapping,      // 重なり判定関数を公開
    //resolveOverlap,     // 重なり解消関数を公開
    //findAvailableLayer, // 空きレイヤー探索関数を公開
};
// ☆ -------- ズームイベント --------
// ズームボタン（ボタンは動的に生成されるので、イベントは親要素に委譲）
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.id === 'zoomOutBtn') {
        zoomTimeline(0.8);
    }
    else if (target.id === 'zoomInBtn') {
        zoomTimeline(1.25);
    }
});
// マウスホイール（Ctrl + ホイールでズーム）
timelineContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        zoomTimeline(factor);
    }
}, { passive: false });
// -------- 初期化 --------
function init() {
    selectedId = null;
    totalTimeDisplay.textContent = formatTime(TIMELINE_DURATION * CONFIG.fps);
    currentLayerCount = CONFIG.layerCount;
    layerCountInput.value = String(CONFIG.layerCount);
    applyTheme(CONFIG.theme);
    syncUI();
    bottomSection.style.height = '250px';
    bottomSection.style.minHeight = `${MIN_TIMELINE_HEIGHT}px`;
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
//　☆ ウインドウリサイズ時にタイムラインも再描画
window.addEventListener('resize', () => {
    drawTimeline();
});
setTimeout(resizeCanvas, 100);
