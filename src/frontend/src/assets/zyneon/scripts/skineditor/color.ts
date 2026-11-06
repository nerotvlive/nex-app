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

export function shade(color: PackedColor, step: number, strength: number = 1): PackedColor {
    if (step === 0) return color;
    const c = unpack(color);
    const hsv = rgbToHsv(c.r, c.g, c.b);
    const greyish = hsv.s < 0.08;
    const n = Math.abs(step);
    for (let i = 0; i < n; i++) {
        if (step < 0) {
            if (!greyish) hsv.h = shiftHue(hsv.h, 235, 7 * strength);
            hsv.s = greyish ? hsv.s : Math.min(1, hsv.s + 0.06 * strength);
            hsv.v = Math.max(0, hsv.v - 0.11 * strength);
        } else {
            if (!greyish) hsv.h = shiftHue(hsv.h, 55, 6 * strength);
            hsv.s = Math.max(0, hsv.s - 0.07 * strength);
            hsv.v = Math.min(1, hsv.v + 0.1 * strength);
        }
    }
    return hsvToPacked(hsv, c.a);
}

export function shadeRamp(color: PackedColor, steps: number = 9, strength: number = 1): PackedColor[] {
    const half = Math.floor(steps / 2);
    const ramp: PackedColor[] = [];
    for (let i = -half; i <= half; i++) ramp.push(shade(color, i, strength));
    return ramp;
}

export function mix(from: PackedColor, to: PackedColor, t: number): PackedColor {
    const a = unpack(from), b = unpack(to);
    const ar = a.a === 0 ? b : a, br = b.a === 0 ? a : b;
    return pack(ar.r + (br.r - ar.r) * t, ar.g + (br.g - ar.g) * t, ar.b + (br.b - ar.b) * t, a.a + (b.a - a.a) * t);
}

export function jitter(color: PackedColor, amount: number, random: () => number = Math.random): PackedColor {
    const c = unpack(color);
    const hsv = rgbToHsv(c.r, c.g, c.b);
    hsv.v = Math.min(1, Math.max(0, hsv.v + (random() * 2 - 1) * amount * 0.5));
    hsv.h = (hsv.h + (random() * 2 - 1) * amount * 12 + 360) % 360;
    return hsvToPacked(hsv, c.a);
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = (t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function bayer(x: number, y: number): number {
    return (BAYER_4[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;
}

export function over(backdrop: PackedColor, source: PackedColor, opacity: number): PackedColor {
    const b = unpack(backdrop), s = unpack(source);
    const sa = s.a / 255 * opacity, ba = b.a / 255;
    const outAlpha = sa + ba * (1 - sa);
    if (outAlpha <= 0) return 0;
    const channel = (sc: number, bc: number) => (sc * sa + bc * ba * (1 - sa)) / outAlpha;
    return pack(channel(s.r, b.r), channel(s.g, b.g), channel(s.b, b.b), outAlpha * 255);
}

export function colorDistance(a: PackedColor, b: PackedColor): number {
    const x = unpack(a), y = unpack(b);
    return Math.max(Math.abs(x.r - y.r), Math.abs(x.g - y.g), Math.abs(x.b - y.b), Math.abs(x.a - y.a));
}
