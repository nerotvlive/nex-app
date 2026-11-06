import type {Rect} from "./types.ts";

export type SelectionMode = 'replace' | 'add' | 'subtract' | 'intersect';

export function rectMask(rect: Rect, width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height);
    for (let y = Math.max(0, rect.y); y < Math.min(height, rect.y + rect.h); y++) {
        mask.fill(1, y * width + Math.max(0, rect.x), y * width + Math.min(width, rect.x + rect.w));
    }
    return mask;
}

export function polygonMask(points: { x: number, y: number }[], width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height);
    if (points.length < 3) return mask;
    for (let y = 0; y < height; y++) {
        const py = y + 0.5;
        for (let x = 0; x < width; x++) {
            const px = x + 0.5;
            let inside = false;
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const a = points[i]!, b = points[j]!;
                const ay = a.y + 0.5, by = b.y + 0.5, ax = a.x + 0.5, bx = b.x + 0.5;
                if ((ay > py) !== (by > py) && px < (bx - ax) * (py - ay) / (by - ay) + ax) inside = !inside;
            }
            if (inside) mask[y * width + x] = 1;
        }
    }
    for (const point of points) {
        if (point.x >= 0 && point.y >= 0 && point.x < width && point.y < height) mask[point.y * width + point.x] = 1;
    }
    return mask;
}

export function combineMasks(base: Uint8Array | null, mask: Uint8Array, mode: SelectionMode): Uint8Array {
    if (mode === 'replace' || !base) return mode === 'subtract' ? new Uint8Array(mask.length) : mask;
    const out = new Uint8Array(mask.length);
    for (let i = 0; i < mask.length; i++) {
        const a = base[i]!, b = mask[i]!;
        out[i] = mode === 'add' ? (a | b) : mode === 'subtract' ? (a & (b ^ 1)) : (a & b);
    }
    return out;
}

export function maskBounds(mask: Uint8Array, width: number): Rect | null {
    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    for (let i = 0; i < mask.length; i++) {
        if (!mask[i]) continue;
        const x = i % width, y = Math.floor(i / width);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }
    return maxX < 0 ? null : {x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1};
}

export function shiftMask(mask: Uint8Array, width: number, height: number, dx: number, dy: number): Uint8Array {
    const out = new Uint8Array(mask.length);
    for (let i = 0; i < mask.length; i++) {
        if (!mask[i]) continue;
        const x = i % width + dx, y = Math.floor(i / width) + dy;
        if (x >= 0 && y >= 0 && x < width && y < height) out[y * width + x] = 1;
    }
    return out;
}

export function maskOutline(mask: Uint8Array, width: number, height: number): number[] {
    const segments: number[] = [];
    const at = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!at(x, y)) continue;
            if (!at(x, y - 1)) segments.push(x, y, x + 1, y);
            if (!at(x, y + 1)) segments.push(x, y + 1, x + 1, y + 1);
            if (!at(x - 1, y)) segments.push(x, y, x, y + 1);
            if (!at(x + 1, y)) segments.push(x + 1, y, x + 1, y + 1);
        }
    }
    return segments;
}
