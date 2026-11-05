export type SkinFormat = 'modern' | 'legacy';

export type SkinModel = 'classic' | 'slim';

export type PartId = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg';

export const PART_IDS: readonly PartId[] = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];

export type SkinLayerKind = 'base' | 'overlay';

export type LayerTarget = 'base' | 'overlay' | 'atlas';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'add';

export const BLEND_MODES: readonly BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'add'];

export type FaceDir = 'top' | 'bottom' | 'right' | 'front' | 'left' | 'back';

export type Vec3 = [number, number, number];

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type PackedColor = number;
