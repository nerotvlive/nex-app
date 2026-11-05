import {strFromU8, strToU8, unzipSync, zipSync, type Zippable} from "fflate";
import {BLEND_MODES, type BlendMode, type LayerTarget, type SkinFormat, type SkinModel} from "./types.ts";
import {createId, type LayerNode, SkinDocument} from "./document.ts";
import {decodePng, encodePng} from "./png.ts";
import {compositeDocument} from "./compositor.ts";
import {getLayout, skinHeight} from "./layout.ts";

export const NEXSKIN_EXTENSION = '.nexskin';
export const NEXSKIN_VERSION = 1;

interface ManifestNodeBase {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
}

interface ManifestLayer extends ManifestNodeBase {
    type: 'layer';
    target: LayerTarget;
    blend: BlendMode;
    file: string;
}

interface ManifestGroup extends ManifestNodeBase {
    type: 'group';
    collapsed: boolean;
    children: ManifestNode[];
}

type ManifestNode = ManifestLayer | ManifestGroup;

export interface NexSkinManifest {
    type: 'nexskin';
    version: number;
    generator: string;
    name: string;
    skin: {
        format: SkinFormat;
        model: SkinModel;
        width: number;
        height: number;
    };
    layers: ManifestNode[];
}

export function writeNexSkin(doc: SkinDocument): Uint8Array {
    const files: Zippable = {};
    const toManifest = (node: LayerNode): ManifestNode => {
        const base = {id: node.id, name: node.name, visible: node.visible, locked: node.locked, opacity: node.opacity};
        if (node.kind === 'group') {
            return {...base, type: 'group', collapsed: node.collapsed, children: node.children.map(toManifest)};
        }
        const file = `layers/${node.id}.png`;
        files[file] = [encodePng(node.pixels, doc.width, doc.height), {level: 0}];
        return {...base, type: 'layer', target: node.target, blend: node.blend, file};
    };
    const manifest: NexSkinManifest = {
        type: 'nexskin',
        version: NEXSKIN_VERSION,
        generator: 'NEX App Skin Editor',
        name: doc.name,
        skin: {format: doc.format, model: doc.model, width: doc.width, height: doc.height},
        layers: doc.layers.map(toManifest)
    };
    files['manifest.json'] = [strToU8(JSON.stringify(manifest, null, 2)), {level: 6}];
    const preview = compositeDocument(doc, getLayout(doc.format, doc.model));
    files['preview.png'] = [encodePng(preview, doc.width, doc.height), {level: 0}];
    return zipSync(files);
}

export function readNexSkin(bytes: Uint8Array): SkinDocument {
    const files = unzipSync(bytes);
    const manifestFile = files['manifest.json'];
    if (!manifestFile) throw new Error('manifest.json is missing');
    const manifest = JSON.parse(strFromU8(manifestFile)) as NexSkinManifest;
    if (manifest.type !== 'nexskin') throw new Error('Not a .nexskin file');
    if (manifest.version > NEXSKIN_VERSION) throw new Error(`Unsupported .nexskin version ${manifest.version}`);

    const format: SkinFormat = manifest.skin?.format === 'legacy' ? 'legacy' : 'modern';
    const model: SkinModel = manifest.skin?.model === 'slim' ? 'slim' : 'classic';
    const width = 64, height = skinHeight(format);
    const usedIds = new Set<string>();

    const fromManifest = (node: ManifestNode): LayerNode => {
        let id = typeof node.id === 'string' && node.id ? node.id : createId();
        if (usedIds.has(id)) id = createId();
        usedIds.add(id);
        const base = {
            id,
            name: String(node.name ?? ''),
            visible: node.visible !== false,
            locked: node.locked === true,
            opacity: clamp01(Number(node.opacity ?? 1))
        };
        if (node.type === 'group') {
            return {...base, kind: 'group', collapsed: node.collapsed === true, children: (node.children ?? []).map(fromManifest)};
        }
        const pixels = new Uint8ClampedArray(width * height * 4);
        const file = files[node.file];
        if (file) {
            const image = decodePng(file);
            // copy what fits, so slightly broken files still open
            for (let y = 0; y < Math.min(height, image.height); y++) {
                for (let x = 0; x < Math.min(width, image.width); x++) {
                    const s = (y * image.width + x) * 4, d = (y * width + x) * 4;
                    pixels[d] = image.data[s]!;
                    pixels[d + 1] = image.data[s + 1]!;
                    pixels[d + 2] = image.data[s + 2]!;
                    pixels[d + 3] = image.data[s + 3]!;
                }
            }
        }
        const target: LayerTarget = node.target === 'overlay' || node.target === 'atlas' ? node.target : 'base';
        const blend: BlendMode = BLEND_MODES.includes(node.blend) ? node.blend : 'normal';
        return {...base, kind: 'layer', target, blend, pixels};
    };

    return new SkinDocument(String(manifest.name ?? 'Skin'), format, model, (manifest.layers ?? []).map(fromManifest));
}

export function readNexSkinPreview(bytes: Uint8Array): Uint8Array | null {
    const files = unzipSync(bytes, {filter: file => file.name === 'preview.png'});
    return files['preview.png'] ?? null;
}

export function isNexSkin(bytes: Uint8Array): boolean {
    return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

function clamp01(value: number): number {
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}
