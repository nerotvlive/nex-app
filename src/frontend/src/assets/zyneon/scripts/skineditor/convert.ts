import {PART_IDS, type SkinFormat, type SkinLayerKind, type SkinModel, type Vec3} from "./types.ts";
import {createPixelLayer, type LayerNode, type PixelLayer, SkinDocument} from "./document.ts";
import {type BoxDef, facePoint, faceTexel, findBox, findFaceByNormal, getLayout, type SkinLayout} from "./layout.ts";

export function resamplePixels(pixels: Uint8ClampedArray, kinds: SkinLayerKind[], from: SkinLayout, to: SkinLayout): Uint8ClampedArray {
    const out = new Uint8ClampedArray(to.width * to.height * 4);
    const src = new Uint32Array(pixels.buffer, pixels.byteOffset, from.width * from.height);
    const dst = new Uint32Array(out.buffer);
    for (const box of to.boxes) {
        if (!kinds.includes(box.kind)) continue;
        const source = findBox(from.boxes, box.part, box.kind);
        if (!source) continue;
        for (const face of box.faces) {
            const sourceFace = findFaceByNormal(source, face.normal);
            if (!sourceFace) continue;
            for (let t = 0; t < face.rect.h; t++) {
                for (let s = 0; s < face.rect.w; s++) {
                    const p = facePoint(face, s + 0.5, t + 0.5);
                    const q = mapBetweenBoxes(p, box, source);
                    const [ss, st] = faceTexel(sourceFace, q);
                    const sx = clampInt(Math.floor(ss), 0, sourceFace.rect.w - 1);
                    const sy = clampInt(Math.floor(st), 0, sourceFace.rect.h - 1);
                    const sourceIndex = (sourceFace.rect.y + sy) * from.width + sourceFace.rect.x + sx;
                    const targetIndex = (face.rect.y + t) * to.width + face.rect.x + s;
                    if (sourceIndex < src.length && targetIndex < dst.length) dst[targetIndex] = src[sourceIndex]!;
                }
            }
        }
    }
    return out;
}

function mapBetweenBoxes(p: Vec3, from: BoxDef, to: BoxDef): Vec3 {
    const out: Vec3 = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        const n = (p[i]! - from.min[i]!) / from.size[i]!;
        out[i] = to.min[i]! + n * to.size[i]!;
    }
    return out;
}

function clampInt(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

export function convertLayer(layer: PixelLayer, from: SkinLayout, to: SkinLayout): Uint8ClampedArray {
    const kinds: SkinLayerKind[] = layer.target === 'atlas' ? ['base', 'overlay'] : ['base'];
    return resamplePixels(layer.pixels, kinds, from, to);
}

export function convertDocument(doc: SkinDocument, format: SkinFormat, model: SkinModel) {
    const from = getLayout(doc.format, doc.model);
    const to = getLayout(format, model);
    const walk = (nodes: LayerNode[]) => {
        for (const node of nodes) {
            if (node.kind === 'group') walk(node.children);
            else node.pixels = convertLayer(node, from, to);
        }
    };
    walk(doc.layers);
    doc.format = format;
    doc.model = model;
}

export function splitAtlasPixels(pixels: Uint8ClampedArray, layout: SkinLayout): [Uint8ClampedArray, Uint8ClampedArray] {
    const count = layout.width * layout.height;
    const base = new Uint8ClampedArray(count * 4);
    const overlay = new Uint8ClampedArray(count * 4);
    const src = new Uint32Array(pixels.buffer, pixels.byteOffset, count);
    const baseView = new Uint32Array(base.buffer);
    const overlayView = new Uint32Array(overlay.buffer);
    for (let i = 0; i < count; i++) {
        if (layout.pixelKind[i] !== 1) continue;
        baseView[i] = src[i]!;
        const overlayIndex = layout.destOverlay[i]!;
        if (overlayIndex >= 0) overlayView[i] = src[overlayIndex]!;
    }
    return [base, overlay];
}

export function documentFromImage(name: string, rgba: Uint8ClampedArray, format: SkinFormat, model: SkinModel, bodyName: string, outerName: string): SkinDocument {
    const layout = getLayout(format, model);
    const [base, overlay] = splitAtlasPixels(rgba, layout);
    if (format === 'legacy') clearOpaqueLegacyHat(overlay, layout);
    const body = createPixelLayer(bodyName, 'base', layout.width, layout.height, base);
    const outer = createPixelLayer(outerName, 'overlay', layout.width, layout.height, overlay);
    return new SkinDocument(name, format, model, [outer, body]);
}

function clearOpaqueLegacyHat(overlay: Uint8ClampedArray, layout: SkinLayout) {
    const head = PART_IDS.indexOf('head');
    const count = layout.width * layout.height;
    let pixels = 0;
    for (let i = 0; i < count; i++) {
        if (layout.pixelPart[i] !== head || layout.pixelKind[i] !== 1 || layout.destOverlay[i]! < 0) continue;
        pixels++;
        if (overlay[i * 4 + 3]! < 128) return;
    }
    if (pixels === 0) return;
    for (let i = 0; i < count; i++) {
        if (layout.pixelPart[i] === head && layout.pixelKind[i] === 1) overlay.fill(0, i * 4, i * 4 + 4);
    }
}
