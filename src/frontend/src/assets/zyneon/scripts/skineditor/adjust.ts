import type {PackedColor} from "./types.ts";
import {clampByte, hslToRgb, pack, rgbToHsl, unpack} from "./color.ts";

export type AdjustmentKind = 'brightnessContrast' | 'hueSaturation' | 'invert' | 'desaturate' | 'posterize' | 'replace';

export interface Adjustment {
    kind: AdjustmentKind;
    brightness?: number;
    contrast?: number;
    hue?: number;
    saturation?: number;
    lightness?: number;
    colorize?: boolean;
    levels?: number;
    replaceWith?: PackedColor;
}

export const ADJUSTMENT_KINDS: readonly AdjustmentKind[] = ['brightnessContrast', 'hueSaturation', 'invert', 'desaturate', 'posterize'];

export function defaultAdjustment(kind: AdjustmentKind): Adjustment {
    switch (kind) {
        case 'brightnessContrast':
            return {kind, brightness: 0, contrast: 0};
        case 'hueSaturation':
            return {kind, hue: 0, saturation: 0, lightness: 0, colorize: false};
        case 'posterize':
            return {kind, levels: 4};
        default:
            return {kind};
    }
}

export function hasParameters(kind: AdjustmentKind): boolean {
    return kind === 'brightnessContrast' || kind === 'hueSaturation' || kind === 'posterize';
}

export function adjustColor(color: PackedColor, adjustment: Adjustment): PackedColor {
    const c = unpack(color);
    if (c.a === 0) return color;
    let r = c.r, g = c.g, b = c.b;
    switch (adjustment.kind) {
        case 'brightnessContrast': {
            const brightness = (adjustment.brightness ?? 0) * 1.28;
            const contrast = (adjustment.contrast ?? 0) * 2.55;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            r = factor * (r + brightness - 128) + 128;
            g = factor * (g + brightness - 128) + 128;
            b = factor * (b + brightness - 128) + 128;
            break;
        }
        case 'hueSaturation': {
            let [h, s, l] = rgbToHsl(r, g, b);
            const saturation = (adjustment.saturation ?? 0) / 100;
            const lightness = (adjustment.lightness ?? 0) / 100;
            if (adjustment.colorize) {
                h = adjustment.hue ?? 0;
                s = Math.min(1, Math.max(0, 0.5 + saturation * 0.5));
            } else {
                h += adjustment.hue ?? 0;
                s = Math.min(1, Math.max(0, s * (1 + saturation)));
            }
            l = Math.min(1, Math.max(0, lightness >= 0 ? l + (1 - l) * lightness : l * (1 + lightness)));
            [r, g, b] = hslToRgb(h, s, l);
            break;
        }
        case 'invert':
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
            break;
        case 'desaturate': {
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            r = g = b = luma;
            break;
        }
        case 'posterize': {
            const levels = Math.max(2, Math.round(adjustment.levels ?? 4)) - 1;
            const step = (value: number) => Math.round(Math.round(value / 255 * levels) / levels * 255);
            r = step(r);
            g = step(g);
            b = step(b);
            break;
        }
        case 'replace':
            return adjustment.replaceWith ?? color;
    }
    return pack(clampByte(r), clampByte(g), clampByte(b), c.a);
}
