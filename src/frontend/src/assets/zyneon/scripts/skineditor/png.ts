import {unzlibSync, zlibSync} from "fflate";

export interface DecodedImage {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

let crcTable: Uint32Array | null = null;

function crc32(bytes: Uint8Array, start: number, end: number): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
    }
    let crc = 0xffffffff;
    for (let i = start; i < end; i++) crc = crcTable[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
    const out = new Uint8Array(12 + data.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    view.setUint32(8 + data.length, crc32(out, 4, 8 + data.length));
    return out;
}

export function encodePng(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): Uint8Array {
    const header = new Uint8Array(13);
    const headerView = new DataView(header.buffer);
    headerView.setUint32(0, width);
    headerView.setUint32(4, height);
    header[8] = 8;
    header[9] = 6;
    header[10] = 0;
    header[11] = 0;
    header[12] = 0;

    const stride = width * 4;
    const raw = new Uint8Array((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = 0;
        raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
    }

    const parts = [
        new Uint8Array(SIGNATURE),
        chunk('IHDR', header),
        chunk('IDAT', zlibSync(raw, {level: 9})),
        chunk('IEND', new Uint8Array(0))
    ];
    const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}

function paeth(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
}

export function decodePng(bytes: Uint8Array): DecodedImage {
    for (let i = 0; i < 8; i++) {
        if (bytes[i] !== SIGNATURE[i]) throw new Error('Not a PNG file');
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
    let palette: Uint8Array | null = null;
    let transparency: Uint8Array | null = null;
    const idat: Uint8Array[] = [];
    while (offset + 8 <= bytes.length) {
        const length = view.getUint32(offset);
        const type = String.fromCharCode(bytes[offset + 4]!, bytes[offset + 5]!, bytes[offset + 6]!, bytes[offset + 7]!);
        const data = bytes.subarray(offset + 8, offset + 8 + length);
        offset += 12 + length;
        if (type === 'IHDR') {
            const header = new DataView(data.buffer, data.byteOffset, data.byteLength);
            width = header.getUint32(0);
            height = header.getUint32(4);
            bitDepth = data[8]!;
            colorType = data[9]!;
            interlace = data[12]!;
        } else if (type === 'PLTE') {
            palette = data;
        } else if (type === 'tRNS') {
            transparency = data;
        } else if (type === 'IDAT') {
            idat.push(data);
        } else if (type === 'IEND') {
            break;
        }
    }
    if (bitDepth !== 8 || interlace !== 0) throw new Error('Unsupported PNG variant');
    const channels = ({0: 1, 2: 3, 3: 1, 4: 2, 6: 4} as Record<number, number>)[colorType];
    if (!channels) throw new Error('Unsupported PNG color type');

    const compressed = new Uint8Array(idat.reduce((sum, part) => sum + part.length, 0));
    let position = 0;
    for (const part of idat) {
        compressed.set(part, position);
        position += part.length;
    }
    const raw = unzlibSync(compressed);
    const stride = width * channels;
    if (raw.length < (stride + 1) * height) throw new Error('Corrupt PNG data');

    const pixels = new Uint8Array(stride * height);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)]!;
        const line = y * (stride + 1) + 1;
        const out = y * stride;
        for (let x = 0; x < stride; x++) {
            const value = raw[line + x]!;
            const left = x >= channels ? pixels[out + x - channels]! : 0;
            const up = y > 0 ? pixels[out - stride + x]! : 0;
            const upLeft = y > 0 && x >= channels ? pixels[out - stride + x - channels]! : 0;
            let result: number;
            switch (filter) {
                case 0: result = value; break;
                case 1: result = value + left; break;
                case 2: result = value + up; break;
                case 3: result = value + ((left + up) >> 1); break;
                case 4: result = value + paeth(left, up, upLeft); break;
                default: throw new Error('Unknown PNG filter ' + filter);
            }
            pixels[out + x] = result & 255;
        }
    }

    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        const o = i * 4;
        switch (colorType) {
            case 6:
                data[o] = pixels[i * 4]!;
                data[o + 1] = pixels[i * 4 + 1]!;
                data[o + 2] = pixels[i * 4 + 2]!;
                data[o + 3] = pixels[i * 4 + 3]!;
                break;
            case 2: {
                const r = pixels[i * 3]!, g = pixels[i * 3 + 1]!, b = pixels[i * 3 + 2]!;
                data[o] = r;
                data[o + 1] = g;
                data[o + 2] = b;
                const keyed = transparency && transparency.length >= 6
                    && r === transparency[1] && g === transparency[3] && b === transparency[5];
                data[o + 3] = keyed ? 0 : 255;
                break;
            }
            case 0: {
                const v = pixels[i]!;
                data[o] = data[o + 1] = data[o + 2] = v;
                data[o + 3] = transparency && transparency.length >= 2 && v === transparency[1] ? 0 : 255;
                break;
            }
            case 4:
                data[o] = data[o + 1] = data[o + 2] = pixels[i * 2]!;
                data[o + 3] = pixels[i * 2 + 1]!;
                break;
            case 3: {
                const index = pixels[i]!;
                if (!palette || index * 3 + 2 >= palette.length) throw new Error('Invalid PNG palette');
                data[o] = palette[index * 3]!;
                data[o + 1] = palette[index * 3 + 1]!;
                data[o + 2] = palette[index * 3 + 2]!;
                data[o + 3] = transparency && index < transparency.length ? transparency[index]! : 255;
                break;
            }
        }
    }
    return {width, height, data};
}

export async function decodeImage(bytes: Uint8Array): Promise<DecodedImage> {
    try {
        return decodePng(bytes);
    } catch {
        // fall through to the browser decoder (interlaced / 16 bit PNGs, other formats)
    }
    const blob = new Blob([bytes as BlobPart]);
    const url = URL.createObjectURL(blob);
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error('Could not decode image'));
            element.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', {willReadFrequently: true});
        if (!context) throw new Error('Canvas 2D is not available');
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        return {width: canvas.width, height: canvas.height, data: imageData.data};
    } finally {
        URL.revokeObjectURL(url);
    }
}
