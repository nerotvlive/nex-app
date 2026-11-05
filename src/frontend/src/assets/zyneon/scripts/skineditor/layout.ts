import {
    type FaceDir,
    type LayerTarget,
    PART_IDS,
    type PartId,
    type Rect,
    type SkinFormat,
    type SkinLayerKind,
    type SkinModel,
    type Vec3
} from "./types.ts";

export interface FaceDef {
    dir: FaceDir;
    normal: Vec3;
    rect: Rect;
    origin: Vec3;
    uAxis: Vec3;
    vAxis: Vec3;
}

export interface BoxDef {
    id: number;
    part: PartId;
    kind: SkinLayerKind;
    min: Vec3;
    size: Vec3;
    inflate: number;
    faces: FaceDef[];
}

export interface SkinLayout {
    format: SkinFormat;
    model: SkinModel;
    width: number;
    height: number;
    boxes: BoxDef[];
    pixelParts: Uint8Array;
    pixelPart: Int8Array;
    pixelKind: Uint8Array;
    pixelActive: Uint8Array;
    pixelFace: Int16Array;
    mirror: Int32Array;
    overlayOffset: Record<PartId, number | null>;
    destBase: Int32Array;
    destOverlay: Int32Array;
}

export const FACE_ORDER: readonly FaceDir[] = ['top', 'bottom', 'right', 'front', 'left', 'back'];

interface PartUv {
    base: [number, number];
    overlay: [number, number] | null;
    mirrored?: boolean;
}

const MODERN_UV: Record<PartId, PartUv> = {
    head: {base: [0, 0], overlay: [32, 0]},
    body: {base: [16, 16], overlay: [16, 32]},
    rightArm: {base: [40, 16], overlay: [40, 32]},
    leftArm: {base: [32, 48], overlay: [48, 48]},
    rightLeg: {base: [0, 16], overlay: [0, 32]},
    leftLeg: {base: [16, 48], overlay: [0, 48]}
};

const LEGACY_UV: Record<PartId, PartUv> = {
    head: {base: [0, 0], overlay: [32, 0]},
    body: {base: [16, 16], overlay: null},
    rightArm: {base: [40, 16], overlay: null},
    leftArm: {base: [40, 16], overlay: null, mirrored: true},
    rightLeg: {base: [0, 16], overlay: null},
    leftLeg: {base: [0, 16], overlay: null, mirrored: true}
};

export const MIRROR_PART: Record<PartId, PartId> = {
    head: 'head',
    body: 'body',
    rightArm: 'leftArm',
    leftArm: 'rightArm',
    rightLeg: 'leftLeg',
    leftLeg: 'rightLeg'
};

export const OVERLAY_INFLATE: Record<PartId, number> = {
    head: 0.5,
    body: 0.25,
    rightArm: 0.25,
    leftArm: 0.25,
    rightLeg: 0.25,
    leftLeg: 0.25
};

export function partBox(part: PartId, model: SkinModel): { size: Vec3, min: Vec3 } {
    const armWidth = model === 'slim' ? 3 : 4;
    switch (part) {
        case 'head':
            return {size: [8, 8, 8], min: [-4, 24, -4]};
        case 'body':
            return {size: [8, 12, 4], min: [-4, 12, -2]};
        case 'rightArm':
            return {size: [armWidth, 12, 4], min: [-4 - armWidth, 12, -2]};
        case 'leftArm':
            return {size: [armWidth, 12, 4], min: [4, 12, -2]};
        case 'rightLeg':
            return {size: [4, 12, 4], min: [-4, 0, -2]};
        case 'leftLeg':
            return {size: [4, 12, 4], min: [0, 0, -2]};
    }
}

export function skinHeight(format: SkinFormat): number {
    return format === 'legacy' ? 32 : 64;
}

function buildFaces(u: number, v: number, size: Vec3, min: Vec3, mirrored: boolean): FaceDef[] {
    const [w, h, d] = size;
    const [x0, y0, z0] = min;
    const x1 = x0 + w, y1 = y0 + h, z1 = z0 + d;
    const faces: FaceDef[] = [
        {dir: 'top', normal: [0, 1, 0], rect: {x: u + d, y: v, w: w, h: d}, origin: [x0, y1, z0], uAxis: [1, 0, 0], vAxis: [0, 0, 1]},
        {dir: 'bottom', normal: [0, -1, 0], rect: {x: u + d + w, y: v, w: w, h: d}, origin: [x0, y0, z0], uAxis: [1, 0, 0], vAxis: [0, 0, 1]},
        {dir: 'right', normal: [-1, 0, 0], rect: {x: u, y: v + d, w: d, h: h}, origin: [x0, y1, z0], uAxis: [0, 0, 1], vAxis: [0, -1, 0]},
        {dir: 'front', normal: [0, 0, 1], rect: {x: u + d, y: v + d, w: w, h: h}, origin: [x0, y1, z1], uAxis: [1, 0, 0], vAxis: [0, -1, 0]},
        {dir: 'left', normal: [1, 0, 0], rect: {x: u + d + w, y: v + d, w: d, h: h}, origin: [x1, y1, z1], uAxis: [0, 0, -1], vAxis: [0, -1, 0]},
        {dir: 'back', normal: [0, 0, -1], rect: {x: u + 2 * d + w, y: v + d, w: w, h: h}, origin: [x1, y1, z0], uAxis: [-1, 0, 0], vAxis: [0, -1, 0]}
    ];
    if (mirrored) {
        for (const face of faces) {
            face.origin[0] = x0 + x1 - face.origin[0];
            face.uAxis[0] = -face.uAxis[0];
            face.normal[0] = -face.normal[0];
            if (face.dir === 'right') face.dir = 'left';
            else if (face.dir === 'left') face.dir = 'right';
        }
        const right = faces[2]!;
        faces[2] = faces[4]!;
        faces[4] = right;
    }
    return faces;
}

export function buildBoxes(format: SkinFormat, model: SkinModel): BoxDef[] {
    const uvs = format === 'legacy' ? LEGACY_UV : MODERN_UV;
    const boxes: BoxDef[] = [];
    for (const kind of ['base', 'overlay'] as SkinLayerKind[]) {
        for (const part of PART_IDS) {
            const uv = uvs[part];
            const origin = kind === 'base' ? uv.base : uv.overlay;
            if (!origin) continue;
            const {size, min} = partBox(part, model);
            boxes.push({
                id: boxes.length,
                part,
                kind,
                min,
                size,
                inflate: kind === 'overlay' ? OVERLAY_INFLATE[part] : 0,
                faces: buildFaces(origin[0], origin[1], size, min, uv.mirrored === true)
            });
        }
    }
    return boxes;
}

export function facePoint(face: FaceDef, s: number, t: number): Vec3 {
    return [
        face.origin[0] + s * face.uAxis[0] + t * face.vAxis[0],
        face.origin[1] + s * face.uAxis[1] + t * face.vAxis[1],
        face.origin[2] + s * face.uAxis[2] + t * face.vAxis[2]
    ];
}

export function inflatedFacePoint(box: BoxDef, face: FaceDef, s: number, t: number, extra: number = 0): Vec3 {
    const p = facePoint(face, s, t);
    const grow = box.inflate + extra;
    if (grow === 0) return p;
    const out: Vec3 = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        const size = box.size[i]!;
        const center = box.min[i]! + size / 2;
        out[i] = center + (p[i]! - center) * ((size + 2 * grow) / size);
    }
    return out;
}

export function faceTexel(face: FaceDef, p: Vec3): [number, number] {
    const dx = p[0] - face.origin[0], dy = p[1] - face.origin[1], dz = p[2] - face.origin[2];
    return [
        dx * face.uAxis[0] + dy * face.uAxis[1] + dz * face.uAxis[2],
        dx * face.vAxis[0] + dy * face.vAxis[1] + dz * face.vAxis[2]
    ];
}

function sameVec(a: Vec3, b: Vec3): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function findFaceByNormal(box: BoxDef, normal: Vec3): FaceDef | undefined {
    return box.faces.find(face => sameVec(face.normal, normal));
}

export function findBox(boxes: BoxDef[], part: PartId, kind: SkinLayerKind): BoxDef | undefined {
    return boxes.find(box => box.part === part && box.kind === kind);
}

const layoutCache = new Map<string, SkinLayout>();

export function getLayout(format: SkinFormat, model: SkinModel): SkinLayout {
    const key = format + ':' + model;
    let layout = layoutCache.get(key);
    if (!layout) {
        layout = createLayout(format, model);
        layoutCache.set(key, layout);
    }
    return layout;
}

function createLayout(format: SkinFormat, model: SkinModel): SkinLayout {
    const width = 64;
    const height = skinHeight(format);
    const size = width * height;
    const boxes = buildBoxes(format, model);

    const pixelParts = new Uint8Array(size);
    const pixelPart = new Int8Array(size).fill(-1);
    const pixelKind = new Uint8Array(size);
    const pixelActive = new Uint8Array(size);
    const pixelFace = new Int16Array(size).fill(-1);
    const mirror = new Int32Array(size).fill(-1);

    for (const unionModel of ['classic', 'slim'] as SkinModel[]) {
        for (const box of buildBoxes(format, unionModel)) {
            const partIndex = PART_IDS.indexOf(box.part);
            for (const face of box.faces) {
                forEachTexel(face.rect, width, height, (index) => {
                    pixelParts[index] = pixelParts[index]! | (1 << partIndex);
                    if (pixelPart[index] === -1) pixelPart[index] = partIndex;
                    pixelKind[index] = box.kind === 'base' ? 1 : 2;
                });
            }
        }
    }

    for (const box of boxes) {
        box.faces.forEach((face, faceIndex) => {
            forEachTexel(face.rect, width, height, (index) => {
                pixelActive[index] = 1;
                if (pixelFace[index] === -1) pixelFace[index] = box.id * 6 + faceIndex;
            });
        });
    }
    for (const box of boxes) {
        const target = findBox(boxes, MIRROR_PART[box.part], box.kind);
        if (!target) continue;
        for (const face of box.faces) {
            const targetFace = findFaceByNormal(target, [-face.normal[0], face.normal[1], face.normal[2]]);
            if (!targetFace) continue;
            for (let t = 0; t < face.rect.h; t++) {
                for (let s = 0; s < face.rect.w; s++) {
                    const p = facePoint(face, s + 0.5, t + 0.5);
                    const [ms, mt] = faceTexel(targetFace, [-p[0], p[1], p[2]]);
                    const tx = Math.floor(ms), ty = Math.floor(mt);
                    if (tx < 0 || ty < 0 || tx >= targetFace.rect.w || ty >= targetFace.rect.h) continue;
                    const from = (face.rect.y + t) * width + face.rect.x + s;
                    const to = (targetFace.rect.y + ty) * width + targetFace.rect.x + tx;
                    if (from < size && to < size) mirror[from] = to;
                }
            }
        }
    }

    const overlayOffset = {} as Record<PartId, number | null>;
    const uvs = format === 'legacy' ? LEGACY_UV : MODERN_UV;
    for (const part of PART_IDS) {
        const uv = uvs[part];
        overlayOffset[part] = uv.overlay && !uv.mirrored
            ? (uv.overlay[1] - uv.base[1]) * width + (uv.overlay[0] - uv.base[0])
            : null;
    }

    const destBase = new Int32Array(size).fill(-1);
    const destOverlay = new Int32Array(size).fill(-1);
    for (let i = 0; i < size; i++) {
        if (pixelKind[i] !== 1) continue;
        destBase[i] = i;
        const part = pixelPart[i]!;
        const offset = part >= 0 ? overlayOffset[PART_IDS[part]!] : null;
        if (offset !== null && offset !== undefined) {
            const target = i + offset;
            if (target >= 0 && target < size && pixelKind[target] === 2) destOverlay[i] = target;
        }
    }

    return {
        format, model, width, height, boxes,
        pixelParts, pixelPart, pixelKind, pixelActive, pixelFace, mirror,
        overlayOffset, destBase, destOverlay
    };
}

function forEachTexel(rect: Rect, width: number, height: number, callback: (index: number) => void) {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
        if (y < 0 || y >= height) continue;
        for (let x = rect.x; x < rect.x + rect.w; x++) {
            if (x < 0 || x >= width) continue;
            callback(y * width + x);
        }
    }
}

export function destTable(layout: SkinLayout, target: LayerTarget): Int32Array | null {
    if (target === 'base') return layout.destBase;
    if (target === 'overlay') return layout.destOverlay;
    return null;
}

export function atlasToStorage(layout: SkinLayout, target: LayerTarget, index: number): number {
    if (index < 0 || index >= layout.width * layout.height) return -1;
    if (target === 'atlas') return index;
    const kind = layout.pixelKind[index];
    if (target === 'base') return kind === 1 ? index : -1;
    if (kind !== 2) return -1;
    const part = layout.pixelPart[index]!;
    const offset = part >= 0 ? layout.overlayOffset[PART_IDS[part]!] : null;
    if (offset === null || offset === undefined) return -1;
    const storage = index - offset;
    return layout.destOverlay[storage] === index ? storage : -1;
}

export function faceOfPixel(layout: SkinLayout, index: number): FaceDef | null {
    const id = layout.pixelFace[index] ?? -1;
    if (id < 0) return null;
    return layout.boxes[Math.floor(id / 6)]?.faces[id % 6] ?? null;
}

export function partMask(parts: Iterable<PartId>): number {
    let mask = 0;
    for (const part of parts) mask |= 1 << PART_IDS.indexOf(part);
    return mask;
}
