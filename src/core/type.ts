// -------- 型定義 --------
type ClipType = 'text' | 'shape';
type ShapeType = 'rectangle' | 'triangle' | 'circle' | 'pie' | 'arrow';

interface Clip {
    id: string;
    type: ClipType;
    layerId: number;
    startFrame: number;
    duration: number;
    x: number;
    y: number;
    rotation: number;
    text?: string;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    shapeType?: ShapeType;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    width?: number;
    height?: number;
}
