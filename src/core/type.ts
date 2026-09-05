// -------- 型定義 --------
export type ClipType = 'text' | 'shape';
export type ShapeType = 'rectangle' | 'triangle' | 'circle' | 'pie' | 'arrow';

export interface Clip {
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