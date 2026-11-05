import type {BlendMode} from "./types.ts";
import type {LayerNode, PixelLayer, SkinDocument} from "./document.ts";
import {destTable, type SkinLayout} from "./layout.ts";

export interface FlatLayer {
    layer: PixelLayer;
    opacity: number;
}

export function flattenVisible(nodes: LayerNode[], opacity: number = 1, out: FlatLayer[] = []): FlatLayer[] {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i]!;
        if (!node.visible || node.opacity <= 0) continue;
        const effective = opacity * node.opacity;
        if (node.kind === 'group') flattenVisible(node.children, effective, out);
        else out.push({layer: node, opacity: effective});
    }
    return out;
}

function blendChannel(mode: BlendMode, backdrop: number, source: number): number {
    switch (mode) {
        case 'multiply':
            return backdrop * source;
        case 'screen':
            return backdrop + source - backdrop * source;
        case 'overlay':
            return backdrop <= 0.5 ? 2 * backdrop * source : 1 - 2 * (1 - backdrop) * (1 - source);
        case 'darken':
            return Math.min(backdrop, source);
        case 'lighten':
            return Math.max(backdrop, source);
        case 'add':
            return Math.min(1, backdrop + source);
        default:
            return source;
    }
}

export function blendLayerInto(accumulator: Float32Array, layer: PixelLayer, opacity: number, layout: SkinLayout) {
    const src = layer.pixels;
    const dest = destTable(layout, layer.target);
    const count = layout.width * layout.height;
    const mode = layer.blend;
    for (let i = 0; i < count; i++) {
        const sourceAlpha = src[i * 4 + 3]! / 255 * opacity;
        if (sourceAlpha <= 0) continue;
        const j = dest ? dest[i]! : i;
        if (j < 0) continue;
        const o = j * 4, s = i * 4;
        const backdropAlpha = accumulator[o + 3]!;
        const outAlpha = sourceAlpha + backdropAlpha * (1 - sourceAlpha);
        for (let c = 0; c < 3; c++) {
            const sc = src[s + c]! / 255;
            const bc = accumulator[o + c]!;
            const mixed = mode === 'normal' ? sc : (1 - backdropAlpha) * sc + backdropAlpha * blendChannel(mode, bc, sc);
            const premultiplied = sourceAlpha * mixed + backdropAlpha * bc * (1 - sourceAlpha);
            accumulator[o + c] = outAlpha > 0 ? premultiplied / outAlpha : 0;
        }
        accumulator[o + 3] = outAlpha;
    }
}

export function compositeDocument(doc: SkinDocument, layout: SkinLayout, out?: Uint8ClampedArray, layers?: FlatLayer[]): Uint8ClampedArray {
    const count = layout.width * layout.height;
    const result = out && out.length === count * 4 ? out : new Uint8ClampedArray(count * 4);
    const accumulator = new Float32Array(count * 4);
    for (const flat of layers ?? flattenVisible(doc.layers)) {
        blendLayerInto(accumulator, flat.layer, flat.opacity, layout);
    }
    for (let i = 0; i < count * 4; i++) result[i] = accumulator[i]! * 255;
    return result;
}

export function renderLayerToAtlas(layer: PixelLayer, layout: SkinLayout, out?: Uint8ClampedArray): Uint8ClampedArray {
    const count = layout.width * layout.height;
    const result = out && out.length === count * 4 ? out : new Uint8ClampedArray(count * 4);
    result.fill(0);
    const dest = destTable(layout, layer.target);
    const src = new Uint32Array(layer.pixels.buffer, layer.pixels.byteOffset, count);
    const dst = new Uint32Array(result.buffer, result.byteOffset, count);
    for (let i = 0; i < count; i++) {
        if (src[i] === 0) continue;
        const j = dest ? dest[i]! : i;
        if (j >= 0) dst[j] = src[i]!;
    }
    return result;
}

export interface CompositeWarnings {
    transparentBasePixels: number;
}

export function analyzeComposite(composite: Uint8ClampedArray, layout: SkinLayout): CompositeWarnings {
    let transparentBasePixels = 0;
    const count = layout.width * layout.height;
    for (let i = 0; i < count; i++) {
        if (layout.pixelKind[i] === 1 && layout.pixelActive[i] === 1 && composite[i * 4 + 3]! < 255) transparentBasePixels++;
    }
    return {transparentBasePixels};
}
