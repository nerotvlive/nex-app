import {describe, expect, it} from "vitest";
import {atlasToStorage, getLayout} from "./layout.ts";
import {createPixelLayer, SkinDocument} from "./document.ts";
import {compositeDocument} from "./compositor.ts";
import {decodePng, encodePng} from "./png.ts";
import {readNexSkin, writeNexSkin} from "./nexskin.ts";
import {convertDocument, documentFromImage} from "./convert.ts";
import {fromHex, pack, shadeRamp, toHex, unpack} from "./color.ts";

const view = (pixels: Uint8ClampedArray) => new Uint32Array(pixels.buffer, pixels.byteOffset, pixels.length / 4);

describe('layout', () => {
    const layout = getLayout('modern', 'classic');

    it('uses every face pixel of a classic 64x64 skin', () => {
        let active = 0;
        for (let i = 0; i < layout.width * layout.height; i++) active += layout.pixelActive[i]!;
        // 1632 base + 1632 overlay pixels
        expect(active).toBe(3264);
    });

    it('has a symmetric mirror table', () => {
        for (let i = 0; i < layout.mirror.length; i++) {
            const mirrored = layout.mirror[i]!;
            if (mirrored >= 0) expect(layout.mirror[mirrored]).toBe(i);
        }
        // head front left column <-> right column
        expect(layout.mirror[8 * 64 + 8]).toBe(8 * 64 + 15);
        // right arm front (44,20) <-> left arm front (39,52)
        expect(layout.mirror[20 * 64 + 44]).toBe(52 * 64 + 39);
    });

    it('maps overlay pixels to the base storage of the same part', () => {
        expect(atlasToStorage(layout, 'overlay', 8 * 64 + 40)).toBe(8 * 64 + 8); // hat -> head
        expect(atlasToStorage(layout, 'overlay', 36 * 64 + 20)).toBe(20 * 64 + 20); // jacket -> body
        expect(atlasToStorage(layout, 'overlay', 52 * 64 + 52)).toBe(52 * 64 + 36); // left sleeve -> left arm
        expect(atlasToStorage(layout, 'overlay', 52 * 64 + 4)).toBe(52 * 64 + 20); // left pants -> left leg
        expect(atlasToStorage(layout, 'base', 8 * 64 + 40)).toBe(-1);
    });
});

describe('compositor', () => {
    it('renders overlay layers into the overlay region', () => {
        const doc = SkinDocument.createEmpty('test');
        const layer = doc.layers[0]!;
        if (layer.kind !== 'layer') throw new Error('expected a layer');
        layer.target = 'overlay';
        view(layer.pixels)[8 * 64 + 8] = pack(255, 0, 0);
        const composite = compositeDocument(doc, getLayout('modern', 'classic'));
        expect(composite[(8 * 64 + 40) * 4]).toBe(255);
        expect(composite[(8 * 64 + 8) * 4 + 3]).toBe(0);
    });

    it('supports blend modes', () => {
        const base = createPixelLayer('base', 'base', 64, 64);
        const multiply = createPixelLayer('multiply', 'base', 64, 64);
        multiply.blend = 'multiply';
        view(base.pixels)[9 * 64 + 9] = pack(200, 100, 50);
        view(multiply.pixels)[9 * 64 + 9] = pack(128, 128, 128);
        const composite = compositeDocument(new SkinDocument('x', 'modern', 'classic', [multiply, base]), getLayout('modern', 'classic'));
        expect(unpack(view(composite)[9 * 64 + 9]!)).toEqual({r: 100, g: 50, b: 25, a: 255});
    });
});

describe('files', () => {
    it('round trips PNGs losslessly, including semi transparent pixels', () => {
        const pixels = new Uint8ClampedArray(64 * 64 * 4);
        for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 37) % 256;
        const decoded = decodePng(encodePng(pixels, 64, 64));
        expect(decoded.width).toBe(64);
        expect(Array.from(decoded.data)).toEqual(Array.from(pixels));
    });

    it('round trips .nexskin projects', () => {
        const base = createPixelLayer('base', 'base', 64, 64);
        view(base.pixels)[9 * 64 + 9] = pack(1, 2, 3);
        const overlay = createPixelLayer('overlay', 'overlay', 64, 64);
        overlay.blend = 'multiply';
        overlay.opacity = 0.5;
        const doc = new SkinDocument('Project', 'modern', 'slim', [overlay, base]);
        const loaded = readNexSkin(writeNexSkin(doc));
        expect(loaded.name).toBe('Project');
        expect(loaded.model).toBe('slim');
        expect(loaded.layers.map(layer => layer.name)).toEqual(['overlay', 'base']);
        const [loadedOverlay, loadedBase] = loaded.layers;
        expect(loadedOverlay?.kind === 'layer' && loadedOverlay.blend).toBe('multiply');
        expect(loadedOverlay?.opacity).toBe(0.5);
        expect(loadedBase?.kind === 'layer' && view(loadedBase.pixels)[9 * 64 + 9]).toBe(pack(1, 2, 3));
    });
});

describe('conversion', () => {
    it('converts 64x32 to 64x64 exactly like Minecraft', () => {
        const doc = new SkinDocument('legacy', 'legacy', 'classic', [createPixelLayer('atlas', 'atlas', 64, 32)]);
        const layer = doc.layers[0]!;
        if (layer.kind !== 'layer') throw new Error('expected a layer');
        for (let i = 0; i < 64 * 32; i++) layer.pixels.set([i & 255, (i >> 8) + 10, 77, 255], i * 4);
        const source = new Uint32Array(layer.pixels.buffer.slice(0));
        convertDocument(doc, 'modern', 'classic');
        const converted = doc.layers[0]!;
        if (converted.kind !== 'layer') throw new Error('expected a layer');
        const target = view(converted.pixels);
        // [sourceX, sourceY, offsetX, offsetY, width, height], every rect is mirrored horizontally
        const rects = [
            [4, 16, 16, 32, 4, 4], [8, 16, 16, 32, 4, 4], [0, 20, 24, 32, 4, 12], [4, 20, 16, 32, 4, 12], [8, 20, 8, 32, 4, 12], [12, 20, 16, 32, 4, 12],
            [44, 16, -8, 32, 4, 4], [48, 16, -8, 32, 4, 4], [40, 20, 0, 32, 4, 12], [44, 20, -8, 32, 4, 12], [48, 20, -16, 32, 4, 12], [52, 20, -8, 32, 4, 12]
        ];
        for (const [sx, sy, dx, dy, w, h] of rects) {
            for (let y = 0; y < h!; y++) {
                for (let x = 0; x < w!; x++) {
                    expect(target[(sy! + dy! + y) * 64 + sx! + dx! + (w! - 1 - x)]).toBe(source[(sy! + y) * 64 + sx! + x]);
                }
            }
        }
    });
});

describe('png import', () => {
    it('splits a skin into a -body and an -outer layer', () => {
        const rgba = new Uint8ClampedArray(64 * 64 * 4);
        view(rgba)[9 * 64 + 9] = pack(9, 9, 9); // head front
        view(rgba)[8 * 64 + 40] = pack(1, 2, 3); // hat front
        const doc = documentFromImage('steve', rgba, 'modern', 'classic', 'steve-body', 'steve-outer');
        const [outer, body] = doc.layers;
        if (outer?.kind !== 'layer' || body?.kind !== 'layer') throw new Error('expected layers');
        expect([outer.name, outer.target, body.name, body.target]).toEqual(['steve-outer', 'overlay', 'steve-body', 'base']);
        // the overlay is stored in base coordinates of the same part
        expect(view(outer.pixels)[8 * 64 + 8]).toBe(pack(1, 2, 3));
        expect(view(body.pixels)[9 * 64 + 9]).toBe(pack(9, 9, 9));
        expect(view(compositeDocument(doc, getLayout('modern', 'classic')))[8 * 64 + 40]).toBe(pack(1, 2, 3));
    });

    it('ignores a fully opaque hat of old 64x32 skins like Minecraft', () => {
        const rgba = new Uint8ClampedArray(64 * 32 * 4).fill(255);
        const doc = documentFromImage('old', rgba, 'legacy', 'classic', 'old-body', 'old-outer');
        const outer = doc.layers[0];
        if (outer?.kind !== 'layer') throw new Error('expected a layer');
        expect(view(outer.pixels).every(pixel => pixel === 0)).toBe(true);
    });
});

describe('colors', () => {
    it('parses and prints hex colors', () => {
        expect(toHex(fromHex('#3ab3da')!)).toBe('#3ab3da');
        expect(toHex(fromHex('#3ab3da80')!)).toBe('#3ab3da80');
        expect(fromHex('nope')).toBeNull();
    });

    it('creates a shade ramp around the color', () => {
        const color = pack(200, 60, 60);
        const ramp = shadeRamp(color, 7);
        expect(ramp).toHaveLength(7);
        expect(ramp[3]).toBe(color);
    });
});
