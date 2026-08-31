// ============================================================
// AJ Video Editor - エントリーポイント
// フェーズ6: フォント選択機能 + 設定UI（テーマ切り替え）
// ============================================================

// -------- 定数 --------
const FPS = 30;
const LAYER_COUNT = 5;
const TIMELINE_DURATION = 20; // 秒
const TOTAL_FRAMES = TIMELINE_DURATION * FPS; // 600フレーム
const DEFAULT_CLIP_DURATION = 3 * FPS; // 90フレーム

// -------- ★ デフォルトフォント ★ --------
const DEFAULT_FONT = '"Hiragino Sans", "Microsoft YaHei", sans-serif';

// -------- 設定（デフォルト: true = 重なり防止ON） --------
const CONFIG = {
    preventOverlap: true,
    theme: 'white', // デフォルトテーマ
};

// -------- ★ テーマ定義 ★ --------
const THEMES: Record<string, Record<string, string>> = {
    // 白系（明）
    'white':       { bg: '#f5f5f5', secondary: '#e8e8e8', card: '#ffffff', text: '#222222', textSecondary: '#666666', border: '#d0d0d0', accent: '#f5576c' },
    'white-red':   { bg: '#fff5f5', secondary: '#f5e8e8', card: '#ffffff', text: '#331111', textSecondary: '#884444', border: '#e0c8c8', accent: '#e74c3c' },
    'white-blue':  { bg: '#f0f5ff', secondary: '#e8edf5', card: '#ffffff', text: '#111833', textSecondary: '#445588', border: '#c8d8e8', accent: '#3498db' },
    'white-green': { bg: '#f0fff5', secondary: '#e8f5ed', card: '#ffffff', text: '#113311', textSecondary: '#448844', border: '#c8e0d0', accent: '#2ecc71' },
    'white-yellow':{ bg: '#fffdf0', secondary: '#f5f0e8', card: '#ffffff', text: '#332b11', textSecondary: '#887744', border: '#e8e0c8', accent: '#f1c40f' },
    'white-purple':{ bg: '#f8f0ff', secondary: '#f0e8f5', card: '#ffffff', text: '#1f1133', textSecondary: '#664488', border: '#d8c8e8', accent: '#9b59b6' },

    // 黒系（暗）
    'black':       { bg: '#0d0d0d', secondary: '#161616', card: '#111111', text: '#e0e0e0', textSecondary: '#888888', border: '#2a2a2a', accent: '#f5576c' },
    'black-red':   { bg: '#1a0a0a', secondary: '#221111', card: '#1a0d0d', text: '#e8d0d0', textSecondary: '#aa8888', border: '#3a2020', accent: '#e74c3c' },
    'black-blue':  { bg: '#0a0d1a', secondary: '#111822', card: '#0d111a', text: '#d0d8e8', textSecondary: '#8899aa', border: '#202a3a', accent: '#3498db' },
    'black-green': { bg: '#0a1a0d', secondary: '#112211', card: '#0d1a0d', text: '#d0e8d0', textSecondary: '#88aa88', border: '#203a2a', accent: '#2ecc71' },
    'black-yellow':{ bg: '#1a180a', secondary: '#222211', card: '#1a1a0d', text: '#e8e0d0', textSecondary: '#aa9966', border: '#3a3820', accent: '#f1c40f' },
    'black-purple':{ bg: '#120a1a', secondary: '#1f1122', card: '#1a0d1a', text: '#e0d0e8', textSecondary: '#9988aa', border: '#2a203a', accent: '#9b59b6' },
};

// -------- 型定義 --------
interface TextClip {
    id: string;
    text: string;
    fontSize: number;
    color: string;
    x: number;
    y: number;
    layerId: number;
    startFrame: number;
    duration: number;
    fontFamily: string;
}

// -------- DOM要素 --------
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const textInput = document.getElementById('textInput') as HTMLTextAreaElement;
const fontSelect = document.getElementById('fontSelect') as HTMLSelectElement;
const fontSizeSlider = document.getElementById('fontSize') as HTMLInputElement;
const fontSizeLabel = document.getElementById('fontSizeLabel') as HTMLSpanElement;
const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;

const xSlider = document.getElementById('xPos') as HTMLInputElement;
const xNumber = document.getElementById('xNumber') as HTMLInputElement;
const ySlider = document.getElementById('yPos') as HTMLInputElement;
const yNumber = document.getElementById('yNumber') as HTMLInputElement;

const startInput = document.getElementById('startInput') as HTMLInputElement;
const durationInput = document.getElementById('durationInput') as HTMLInputElement;

const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const deleteBtn = document.getElementById('deleteBtn') as HTMLButtonElement;
const timelineContainer = document.getElementById('timelineContainer') as HTMLDivElement;

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const currentTimeDisplay = document.getElementById('currentTime') as HTMLSpanElement;
const totalTimeDisplay = document.getElementById('totalTime') as HTMLSpanElement;

// -------- ★ 設定UI DOM ★ --------
const settingsToggle = document.getElementById('settingsToggle') as HTMLButtonElement;
const settingsOverlay = document.getElementById('settingsOverlay') as HTMLDivElement;
const settingsClose = document.getElementById('settingsClose') as HTMLButtonElement;
const settingsCloseBtn = document.getElementById('settingsCloseBtn') as HTMLButtonElement;
const settingsWindow = document.getElementById('settingsWindow') as HTMLDivElement;
const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
const overlapToggle = document.getElementById('overlapToggle') as HTMLInputElement;

// -------- キャンバスサイズ --------
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;
const MAX_COORD = 8000;

// -------- 状態 --------
let clips: TextClip[] = [];
let selectedId: string | null = null;
let idCounter = 0;
let currentFrame = 0;
let isPlaying = false;
let playInterval: number | null = null;

// -------- ドラッグ中フラグ --------
let isDraggingX = false;
let isDraggingY = false;

// -------- シーク用フラグ --------
let isSeeking = false;

// -------- クリップドラッグ用 --------
let isDraggingClip = false;
let dragClipId: string | null = null;
let dragStartMouseX = 0;
let dragStartMouseY = 0;
let dragStartFrame = 0;
let dragStartLayer = 0;
let dragClipElement: HTMLElement | null = null;

// -------- タイムライン用定数 --------
const TIMELINE_HEIGHT = 32;
const TIMELINE_PADDING_LEFT = 80;
const TIMELINE_PADDING_RIGHT = 20;
const TIMELINE_HEADER_HEIGHT = 28;

// -------- ユーティリティ --------
function generateId(): string {
    return `clip-${++idCounter}`;
}

function getSliderMax(value: number): number {
    const abs = Math.abs(value);
    if (abs < 500) return 500;
    if (abs < 1000) return 1000;
    if (abs < 2000) return 2000;
    if (abs < 4000) return 4000;
    return 8000;
}

function updateSliderRange(): void {
    if (isDraggingX || isDraggingY) return;
    const selected = getSelected();
    if (!selected) return;

    const xMax = getSliderMax(selected.x);
    const yMax = getSliderMax(selected.y);
    xSlider.min = String(-xMax);
    xSlider.max = String(xMax);
    ySlider.min = String(-yMax);
    ySlider.max = String(yMax);
}

function getSelected(): TextClip | null {
    return clips.find(c => c.id === selectedId) || null;
}

function setPropertiesEnabled(enabled: boolean): void {
    const inputs = [
        textInput,
        fontSelect,
        fontSizeSlider,
        colorPicker,
        xSlider,
        xNumber,
        ySlider,
        yNumber,
        startInput,
        durationInput
    ];
    for (const input of inputs) {
        input.disabled = !enabled;
    }
    const labels = document.querySelectorAll('.control-group label');
    for (const label of labels) {
        if (enabled) {
            label.classList.remove('disabled');
        } else {
            label.classList.add('disabled');
        }
    }
    const values = document.querySelectorAll('.value');
    for (const val of values) {
        if (enabled) {
            val.classList.remove('disabled');
        } else {
            val.classList.add('disabled');
        }
    }
    const coordInputs = document.querySelectorAll('.coord-input');
    for (const ci of coordInputs) {
        if (enabled) {
            ci.classList.remove('disabled');
        } else {
            ci.classList.add('disabled');
        }
    }
}

function getClipsAtFrame(frame: number): TextClip[] {
    return clips.filter(clip => {
        return frame >= clip.startFrame && frame < clip.startFrame + clip.duration;
    });
}

// -------- ★ 重なりチェック関数 ★ --------
function isOverlapping(clip: TextClip, ignoreId?: string): boolean {
    return clips.some(other => {
        if (other.id === clip.id) return false;
        if (ignoreId && other.id === ignoreId) return false;
        if (other.layerId !== clip.layerId) return false;
        const aStart = clip.startFrame;
        const aEnd = clip.startFrame + clip.duration;
        const bStart = other.startFrame;
        const bEnd = other.startFrame + other.duration;
        return aStart < bEnd && bStart < aEnd;
    });
}

// -------- ★ 重なりを解消する（クリップをずらす） ★ --------
function resolveOverlap(clip: TextClip, ignoreId?: string): void {
    if (!CONFIG.preventOverlap) return;

    let maxAttempts = 100;
    let attempts = 0;

    while (isOverlapping(clip, ignoreId) && attempts < maxAttempts) {
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

// -------- ★ 重なり防止を適用 ★ --------
function applyOverlapPrevention(clip: TextClip, ignoreId?: string): void {
    if (!CONFIG.preventOverlap) return;
    resolveOverlap(clip, ignoreId);
}

// -------- ★ 空いてるレイヤーを探す ★ --------
function findAvailableLayer(startFrame: number, duration: number): number | null {
    for (let layerId = 1; layerId <= LAYER_COUNT; layerId++) {
        const hasOverlap = clips.some(clip => {
            if (clip.layerId !== layerId) return false;
            const aStart = startFrame;
            const aEnd = startFrame + duration;
            const bStart = clip.startFrame;
            const bEnd = clip.startFrame + clip.duration;
            return aStart < bEnd && bStart < aEnd;
        });
        if (!hasOverlap) {
            return layerId;
        }
    }
    return null;
}

// -------- 時間表示フォーマット --------
function formatTime(frame: number): string {
    const seconds = frame / FPS;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

// -------- ★ テーマ適用関数 ★ --------
function applyTheme(themeName: string): void {
    const theme = THEMES[themeName];
    if (!theme) return;

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
function drawPreview(): void {
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
        const lines = clip.text.split('\n');
        const lineHeight = clip.fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = drawY - totalHeight / 2 + lineHeight / 2;

        ctx.font = `${clip.fontSize}px ${clip.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < lines.length; i++) {
            ctx.fillStyle = clip.color;
            ctx.fillText(lines[i], drawX, startY + i * lineHeight);
        }

        if (clip.id === selectedId) {
            let maxWidth = 0;
            for (const line of lines) {
                const metrics = ctx.measureText(line);
                if (metrics.width > maxWidth) maxWidth = metrics.width;
            }
            const width = maxWidth || 50;
            const height = totalHeight;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 6]);
            ctx.strokeRect(
                drawX - width / 2 - 10,
                drawY - height / 2 - 10,
                width + 20,
                height + 20
            );
            ctx.setLineDash([]);
        }
    }
}

// -------- タイムライン描画 --------
function drawTimeline(): void {
    const containerWidth = timelineContainer.clientWidth - 4;
    const usableWidth = containerWidth - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    const pixelsPerSecond = usableWidth / TIMELINE_DURATION;

    let html = '';

    // --- 時間目盛り ---
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

    // --- レイヤートラック ---
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

            html += `<div class="timeline-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}" 
                          data-clip-id="${clip.id}"
                          style="left:${left}px; width:${Math.max(width, 4)}px; background:${color}; opacity:${opacity};">
                        <span class="timeline-clip-label">${clip.text.replace(/\n/g, ' ')}</span>
                     </div>`;
        }

        html += `</div></div>`;
    }

    timelineContainer.innerHTML = html;

    // --- クリップクリックイベント ---
    document.querySelectorAll('.timeline-clip').forEach(el => {
        el.addEventListener('click', (e) => {
            if (isDraggingClip) return;
            const id = el.getAttribute('data-clip-id');
            if (id) {
                selectedId = id;
                syncUI();
            }
        });
    });

    // --- クリップドラッグ用イベント ---
    document.querySelectorAll('.timeline-clip').forEach(el => {
        el.addEventListener('mousedown', (e) => {
            const id = el.getAttribute('data-clip-id');
            if (id) {
                startClipDrag(e, id);
            }
        });
    });

    // --- シーク用イベント ---
    const trackAreas = timelineContainer.querySelectorAll('.timeline-track-area');
    for (const area of trackAreas) {
        area.addEventListener('mousedown', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.timeline-clip')) return;
            startSeek(e);
        });
    }

    const ruler = timelineContainer.querySelector('.timeline-ruler-inner');
    if (ruler) {
        ruler.addEventListener('mousedown', (e) => {
            startSeek(e);
        });
    }

    // --- 時間表示更新 ---
    currentTimeDisplay.textContent = formatTime(currentFrame);
    totalTimeDisplay.textContent = formatTime(TOTAL_FRAMES);
}

// -------- クリップドラッグ機能 --------
function startClipDrag(e: MouseEvent, clipId: string): void {
    if (isDraggingClip) return;

    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    if (isPlaying) {
        stopPlayback();
    }

    isDraggingClip = true;
    dragClipId = clipId;
    dragStartFrame = clip.startFrame;
    dragStartLayer = clip.layerId;
    dragStartMouseX = e.clientX;
    dragStartMouseY = e.clientY;
    dragClipElement = e.target as HTMLElement;

    selectedId = clipId;

    document.addEventListener('mousemove', onClipDragMove);
    document.addEventListener('mouseup', onClipDragEnd);
    document.addEventListener('mouseleave', onClipDragEnd);

    document.body.style.cursor = 'grabbing';

    drawTimeline();
}

function onClipDragMove(e: MouseEvent): void {
    if (!isDraggingClip || !dragClipId) return;

    const clip = clips.find(c => c.id === dragClipId);
    if (!clip) return;

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

    if (selectedId === dragClipId) {
        updatePropertyUI(clip);
    }
}

function onClipDragEnd(e: MouseEvent): void {
    if (!isDraggingClip) return;

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

// -------- プロパティUI更新（ドラッグ中用） --------
function updatePropertyUI(clip: TextClip): void {
    if (selectedId !== clip.id) return;
    startInput.value = String(clip.startFrame);
    durationInput.value = String(clip.duration);
}

// -------- シーク機能 --------
function getFrameFromMouseEvent(e: MouseEvent): number {
    const container = timelineContainer;
    const rect = container.getBoundingClientRect();
    const containerWidth = container.clientWidth - 4;
    const usableWidth = containerWidth - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    const pixelsPerSecond = usableWidth / TIMELINE_DURATION;

    const x = e.clientX - rect.left - TIMELINE_PADDING_LEFT;
    const seconds = Math.max(0, Math.min(TIMELINE_DURATION, x / pixelsPerSecond));
    const frame = Math.round(seconds * FPS);
    return Math.max(0, Math.min(TOTAL_FRAMES, frame));
}

function startSeek(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.timeline-clip')) return;

    if (isPlaying) {
        stopPlayback();
    }

    isSeeking = true;
    const frame = getFrameFromMouseEvent(e);
    currentFrame = frame;
    drawTimeline();
    drawPreview();

    document.addEventListener('mousemove', onSeekMove);
    document.addEventListener('mouseup', onSeekEnd);
    document.addEventListener('mouseleave', onSeekEnd);
}

function onSeekMove(e: MouseEvent): void {
    if (!isSeeking) return;
    const frame = getFrameFromMouseEvent(e);
    currentFrame = frame;
    drawTimeline();
    drawPreview();
}

function onSeekEnd(e: MouseEvent): void {
    if (!isSeeking) return;
    isSeeking = false;
    document.removeEventListener('mousemove', onSeekMove);
    document.removeEventListener('mouseup', onSeekEnd);
    document.removeEventListener('mouseleave', onSeekEnd);
}

// -------- 再生制御 --------
function togglePlay(): void {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
}

function startPlayback(): void {
    if (isPlaying) return;

    if (currentFrame >= TOTAL_FRAMES) {
        currentFrame = 0;
    }

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

function stopPlayback(): void {
    isPlaying = false;
    playBtn.textContent = '▶';
    playBtn.classList.remove('playing');

    if (playInterval !== null) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

// -------- UI同期 --------
function syncUI(): void {
    const selected = getSelected();
    const hasClips = clips.length > 0;

    if (selected && hasClips) {
        textInput.value = selected.text;
        fontSelect.value = selected.fontFamily;
        fontSizeSlider.value = String(selected.fontSize);
        fontSizeLabel.textContent = `${selected.fontSize}px`;
        colorPicker.value = selected.color;
        xSlider.value = String(selected.x);
        xNumber.value = String(selected.x);
        ySlider.value = String(selected.y);
        yNumber.value = String(selected.y);
        startInput.value = String(selected.startFrame);
        durationInput.value = String(selected.duration);
        updateSliderRange();
        setPropertiesEnabled(true);
        autoResizeTextarea();
    } else {
        textInput.value = '';
        fontSizeLabel.textContent = '--';
        fontSelect.value = DEFAULT_FONT;
        setPropertiesEnabled(false);
    }

    drawTimeline();
    drawPreview();
}

// -------- textareaの高さを自動調整 --------
function autoResizeTextarea(): void {
    textInput.style.height = 'auto';
    textInput.style.height = `${Math.min(textInput.scrollHeight, 120)}px`;
}

// -------- テキスト追加 --------
function addText(): void {
    const startFrame = currentFrame;
    const duration = DEFAULT_CLIP_DURATION;

    const layerId = findAvailableLayer(startFrame, duration);

    if (layerId === null) {
        alert('All layers are full at this time position. Please move or delete existing clips.');
        return;
    }

    const newClip: TextClip = {
        id: generateId(),
        text: 'New Text',
        fontSize: 48,
        color: '#ffffff',
        x: 0,
        y: 0,
        layerId: layerId,
        startFrame: startFrame,
        duration: duration,
        fontFamily: DEFAULT_FONT
    };

    clips.push(newClip);
    selectedId = newClip.id;
    syncUI();
}

// -------- テキスト削除 --------
function deleteSelected(): void {
    if (!selectedId) return;
    clips = clips.filter(c => c.id !== selectedId);
    selectedId = clips.length > 0 ? clips[0].id : null;
    syncUI();
}

// -------- 選択中のテキストを更新 --------
function updateSelected(): void {
    const selected = getSelected();
    if (!selected) return;

    selected.text = textInput.value || ' ';
    selected.fontFamily = fontSelect.value;
    selected.fontSize = parseInt(fontSizeSlider.value, 10);
    selected.color = colorPicker.value;
    selected.x = parseInt(xSlider.value, 10);
    selected.y = parseInt(ySlider.value, 10);

    fontSizeLabel.textContent = `${selected.fontSize}px`;
    autoResizeTextarea();
    drawPreview();
    drawTimeline();
}

// -------- Start / Duration 更新 --------
function updateStart(): void {
    const selected = getSelected();
    if (!selected) return;

    let val = parseInt(startInput.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    const maxStart = TOTAL_FRAMES - selected.duration;
    if (val > maxStart) val = maxStart;

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

function updateDuration(): void {
    const selected = getSelected();
    if (!selected) return;

    let val = parseInt(durationInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    const maxStart = TOTAL_FRAMES - val;
    if (selected.startFrame > maxStart) {
        selected.startFrame = Math.max(0, maxStart);
    }

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

// -------- 数値入力補正 --------
function parseCoord(value: string): number {
    if (value === '' || value === '-' || isNaN(Number(value))) return 0;
    return Math.max(-MAX_COORD, Math.min(MAX_COORD, Number(value)));
}

function updateXFromNumber(): void {
    const selected = getSelected();
    if (!selected) return;
    const val = parseCoord(xNumber.value);
    selected.x = val;
    xSlider.value = String(val);
    xNumber.value = String(val);
    if (!isDraggingX && !isDraggingY) updateSliderRange();
    drawPreview();
    xNumber.blur();
}

function updateYFromNumber(): void {
    const selected = getSelected();
    if (!selected) return;
    const val = parseCoord(yNumber.value);
    selected.y = val;
    ySlider.value = String(val);
    yNumber.value = String(val);
    if (!isDraggingX && !isDraggingY) updateSliderRange();
    drawPreview();
    yNumber.blur();
}

// -------- 数値入力フィールドをクリックで全選択 --------
function setupNumberInputSelectOnClick(): void {
    const inputs = [xNumber, yNumber, startInput, durationInput];
    for (const input of inputs) {
        input.addEventListener('click', () => {
            input.select();
        });
        input.addEventListener('focus', () => {
            input.select();
        });
    }
}

// -------- Text入力欄のキーボード操作 --------
function setupTextInputKeyboard(): void {
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                return;
            } else {
                e.preventDefault();
                textInput.blur();
                updateSelected();
            }
        }
    });

    textInput.addEventListener('blur', () => {
        updateSelected();
    });

    textInput.addEventListener('input', () => {
        autoResizeTextarea();
        const selected = getSelected();
        if (selected) {
            selected.text = textInput.value || ' ';
            drawPreview();
            drawTimeline();
        }
    });
}

// -------- ★ フォントセレクターイベント ★ --------
fontSelect.addEventListener('change', updateSelected);

// -------- ★ 設定UIイベント ★ --------
function openSettings(): void {
    settingsOverlay.classList.add('active');
}

function closeSettings(): void {
    settingsOverlay.classList.remove('active');
}

settingsToggle.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsCloseBtn.addEventListener('click', closeSettings);

// 外側クリックで閉じる
settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        closeSettings();
    }
});

// テーマ切り替え
themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
});

// 重なり防止トグル
overlapToggle.addEventListener('change', () => {
    CONFIG.preventOverlap = overlapToggle.checked;
});

// -------- キーボードショートカット --------
function setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            return;
        }

        if (e.key === ' ') {
            e.preventDefault();
            togglePlay();
            return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            deleteSelected();
        }

        // Escapeで設定閉じる
        if (e.key === 'Escape') {
            if (settingsOverlay.classList.contains('active')) {
                closeSettings();
            }
        }
    });
}

// -------- イベント登録 --------
addBtn.addEventListener('click', addText);
deleteBtn.addEventListener('click', deleteSelected);
playBtn.addEventListener('click', togglePlay);

fontSizeSlider.addEventListener('input', updateSelected);
colorPicker.addEventListener('input', updateSelected);

startInput.addEventListener('change', updateStart);
startInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        startInput.blur();
        updateStart();
    }
});

durationInput.addEventListener('change', updateDuration);
durationInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        durationInput.blur();
        updateDuration();
    }
});

xSlider.addEventListener('input', () => {
    const selected = getSelected();
    if (!selected) return;
    selected.x = parseInt(xSlider.value, 10);
    xNumber.value = String(selected.x);
    drawPreview();
});

xSlider.addEventListener('mousedown', () => { isDraggingX = true; });
xSlider.addEventListener('mouseup', () => {
    isDraggingX = false;
    updateSliderRange();
    drawPreview();
});
xSlider.addEventListener('mouseleave', () => {
    if (isDraggingX) {
        isDraggingX = false;
        updateSliderRange();
        drawPreview();
    }
});
xSlider.addEventListener('touchstart', () => { isDraggingX = true; });
xSlider.addEventListener('touchend', () => {
    isDraggingX = false;
    updateSliderRange();
    drawPreview();
});
xSlider.addEventListener('touchcancel', () => {
    isDraggingX = false;
    updateSliderRange();
    drawPreview();
});

ySlider.addEventListener('input', () => {
    const selected = getSelected();
    if (!selected) return;
    selected.y = parseInt(ySlider.value, 10);
    yNumber.value = String(selected.y);
    drawPreview();
});

ySlider.addEventListener('mousedown', () => { isDraggingY = true; });
ySlider.addEventListener('mouseup', () => {
    isDraggingY = false;
    updateSliderRange();
    drawPreview();
});
ySlider.addEventListener('mouseleave', () => {
    if (isDraggingY) {
        isDraggingY = false;
        updateSliderRange();
        drawPreview();
    }
});
ySlider.addEventListener('touchstart', () => { isDraggingY = true; });
ySlider.addEventListener('touchend', () => {
    isDraggingY = false;
    updateSliderRange();
    drawPreview();
});
ySlider.addEventListener('touchcancel', () => {
    isDraggingY = false;
    updateSliderRange();
    drawPreview();
});

xNumber.addEventListener('change', updateXFromNumber);
xNumber.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        updateXFromNumber();
    }
});

yNumber.addEventListener('change', updateYFromNumber);
yNumber.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        updateYFromNumber();
    }
});

setupNumberInputSelectOnClick();
setupTextInputKeyboard();
setupKeyboardShortcuts();

// -------- ★ 設定切り替え用関数 ★ --------
function setOverlapPrevention(enabled: boolean): void {
    CONFIG.preventOverlap = enabled;
    overlapToggle.checked = enabled;
    if (enabled) {
        for (const clip of clips) {
            resolveOverlap(clip, clip.id);
        }
        syncUI();
    }
}

// -------- デバッグ用グローバル公開 --------
(window as any).__editor = {
    currentFrame,
    clips,
    drawPreview,
    drawTimeline,
    setFrame: (frame: number) => {
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
    addClip: (clip: Partial<TextClip>) => {
        const startFrame = clip.startFrame ?? currentFrame;
        const duration = clip.duration || DEFAULT_CLIP_DURATION;
        const layerId = clip.layerId ?? findAvailableLayer(startFrame, duration);
        if (layerId === null) {
            console.warn('All layers are full at this time position.');
            return null;
        }
        const newClip: TextClip = {
            id: generateId(),
            text: clip.text || 'New Text',
            fontSize: clip.fontSize || 48,
            color: clip.color || '#ffffff',
            x: clip.x || 0,
            y: clip.y || 0,
            layerId: layerId,
            startFrame: startFrame,
            duration: duration,
            fontFamily: clip.fontFamily || DEFAULT_FONT
        };
        applyOverlapPrevention(newClip);
        clips.push(newClip);
        selectedId = newClip.id;
        syncUI();
        console.log('Added clip:', newClip);
        return newClip;
    },
    setOverlapPrevention,
    config: CONFIG,
    applyTheme,
    themes: THEMES,
};

// -------- ★ 初期化（空っぽスタート + テーマ適用） ★ --------
function init(): void {
    selectedId = null;
    totalTimeDisplay.textContent = formatTime(TOTAL_FRAMES);
    applyTheme(CONFIG.theme);
    syncUI();
}

init();

// -------- リサイズ対応 --------
function resizeCanvas(): void {
    const container = canvas.parentElement!;
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