import type {PackedColor} from "./types.ts";

const probe = new Uint32Array(new Uint8Array([1, 0, 0, 0]).buffer);
const LITTLE_ENDIAN = probe[0] === 1;

export interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface Hsv {
    h: number;
    s: number;
    v: number;
}

export const TRANSPARENT: PackedColor = 0;

export function pack(r: number, g: number, b: number, a: number = 255): PackedColor {
    r = clampByte(r);
    g = clampByte(g);
    b = clampByte(b);
    a = clampByte(a);
    return (LITTLE_ENDIAN
        ? ((a << 24) | (b << 16) | (g << 8) | r)
        : ((r << 24) | (g << 16) | (b << 8) | a)) >>> 0;
}

export function unpack(color: PackedColor): Rgba {
    if (LITTLE_ENDIAN) {
        return {r: color & 255, g: (color >>> 8) & 255, b: (color >>> 16) & 255, a: (color >>> 24) & 255};
    }
    return {r: (color >>> 24) & 255, g: (color >>> 16) & 255, b: (color >>> 8) & 255, a: color & 255};
}

export function alphaOf(color: PackedColor): number {
    return LITTLE_ENDIAN ? (color >>> 24) & 255 : color & 255;
}

export function withAlpha(color: PackedColor, alpha: number): PackedColor {
    const c = unpack(color);
    return pack(c.r, c.g, c.b, alpha);
}

export function clampByte(value: number): number {
    return value < 0 ? 0 : value > 255 ? 255 : Math.round(value);
}

export function toHex(color: PackedColor, withAlphaChannel: boolean = true): string {
    const c = unpack(color);
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    return '#' + hex(c.r) + hex(c.g) + hex(c.b) + (withAlphaChannel && c.a !== 255 ? hex(c.a) : '');
}

export function fromHex(value: string): PackedColor | null {
    let hex = value.trim().replace(/^#/, '');
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return null;
    const n = (i: number) => parseInt(hex.substring(i, i + 2), 16);
    return pack(n(0), n(2), n(4), hex.length === 8 ? n(6) : 255);
}

export function toCss(color: PackedColor): string {
    const c = unpack(color);
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${(c.a / 255).toFixed(3)})`;
}

export function rgbToHsv(r: number, g: number, b: number): Hsv {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta > 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return {h, s: max === 0 ? 0 : delta / max, v: max};
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function packedToHsv(color: PackedColor): Hsv {
    const c = unpack(color);
    return rgbToHsv(c.r, c.g, c.b);
}

export function hsvToPacked(hsv: Hsv, alpha: number = 255): PackedColor {
    const [r, g, b] = hsvToRgb(hsv.h, hsv.s, hsv.v);
    return pack(r, g, b, alpha);
}

function shiftHue(h: number, target: number, amount: number): number {
    let diff = ((target - h + 540) % 360) - 180;
    if (Math.abs(diff) < amount) return target;
    return (h + Math.sign(diff) * amount + 360) % 360;
}

export function shade(color: PackedColor, step: number): PackedColor {
    if (step === 0) return color;
    const c = unpack(color);
    const hsv = rgbToHsv(c.r, c.g, c.b);
    const greyish = hsv.s < 0.08;
    const n = Math.abs(step);
    for (let i = 0; i < n; i++) {
        if (step < 0) {
            if (!greyish) hsv.h = shiftHue(hsv.h, 235, 7);
            hsv.s = greyish ? hsv.s : Math.min(1, hsv.s + 0.06);
            hsv.v = Math.max(0, hsv.v - 0.11);
        } else {
            if (!greyish) hsv.h = shiftHue(hsv.h, 55, 6);
            hsv.s = Math.max(0, hsv.s - 0.07);
            hsv.v = Math.min(1, hsv.v + 0.1);
        }
    }
    return hsvToPacked(hsv, c.a);
}

export function shadeRamp(color: PackedColor, steps: number = 7): PackedColor[] {
    const half = Math.floor(steps / 2);
    const ramp: PackedColor[] = [];
    for (let i = -half; i <= half; i++) ramp.push(shade(color, i));
    return ramp;
}

export function jitter(color: PackedColor, amount: number, random: () => number = Math.random): PackedColor {
    const c = unpack(color);
    const hsv = rgbToHsv(c.r, c.g, c.b);
    hsv.v = Math.min(1, Math.max(0, hsv.v + (random() * 2 - 1) * amount * 0.5));
    hsv.h = (hsv.h + (random() * 2 - 1) * amount * 12 + 360) % 360;
    return hsvToPacked(hsv, c.a);
}
