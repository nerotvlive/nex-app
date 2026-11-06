import {bayer, pack} from "./color.ts";
import type {SkinLayout} from "./layout.ts";

export type ShadingStyle = 'smooth' | 'dither';

export interface ShadingOptions {
    strength: number;
    highlight: number;
    style: ShadingStyle;
    edges: boolean;
    overlay: boolean;
}

export const DEFAULT_SHADING: ShadingOptions = {strength: 0.45, highlight: 0.2, style: 'smooth', edges: true, overlay: true};

export function autoShade(composite: Uint8ClampedArray, layout: SkinLayout, options: ShadingOptions, allowed: (index: number) => boolean = () => true): Uint8ClampedArray {
    const width = layout.width;
    const out = new Uint8ClampedArray(width * layout.height * 4);
    const view = new Uint32Array(out.buffer);
    for (const box of layout.boxes) {
        if (box.kind === 'overlay' && !options.overlay) continue;
        for (const face of box.faces) {
            const {x: fx, y: fy, w, h} = face.rect;
            for (let t = 0; t < h; t++) {
                for (let s = 0; s < w; s++) {
                    const x = fx + s, y = fy + t;
                    if (y >= layout.height) continue;
                    const index = y * width + x;
                    if (composite[index * 4 + 3] === 0 || !allowed(index)) continue;
                    let shadow = 0;
                    let light = 0;
                    const vertical = h > 1 ? t / (h - 1) : 0;
                    if (face.dir === 'bottom') shadow = 0.75;
                    else if (face.dir === 'top') light = 1;
                    else {
                        shadow = Math.pow(vertical, 1.6) * 0.7;
                        if (t === 0) light = 0.6;
                    }
                    if (options.edges && face.dir !== 'top' && face.dir !== 'bottom' && (s === 0 || s === w - 1)) shadow += 0.25;
                    shadow = Math.min(1, shadow) * options.strength;
                    light = light * options.highlight;
                    if (options.style === 'dither') {
                        const threshold = bayer(x, y);
                        if (shadow > 0 && shadow * 2 > threshold) view[index] = pack(0, 0, 0, Math.round(255 * Math.min(1, options.strength * 0.9)));
                        else if (light > 0 && light * 2 > threshold) view[index] = pack(255, 255, 255, Math.round(255 * Math.min(1, options.highlight * 0.9)));
                    } else if (shadow >= light && shadow > 0.01) {
                        view[index] = pack(0, 0, 0, Math.round(255 * shadow));
                    } else if (light > 0.01) {
                        view[index] = pack(255, 255, 255, Math.round(255 * light));
                    }
                }
            }
        }
    }
    return out;
}
