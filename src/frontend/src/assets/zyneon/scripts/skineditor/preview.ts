import type {SkinFormat, SkinModel} from "./types.ts";
import {getLayout, type SkinLayout} from "./layout.ts";
import {compositeDocument} from "./compositor.ts";
import {documentFromImage} from "./convert.ts";
import {decodeImage} from "./png.ts";
import {isNexSkin, readNexSkin, writeNexSkin} from "./nexskin.ts";
import {detectModel} from "./editor.ts";
import type {TextureImage} from "./renderer3d.ts";

export type SkinSource = string | Uint8Array | ArrayBuffer | Blob;

export interface SkinPreview {
    format: SkinFormat;
    layout: SkinLayout;
    composite: Uint8ClampedArray;
    model: SkinModel;
}

async function sourceBytes(source: SkinSource): Promise<Uint8Array> {
    if (source instanceof Uint8Array) return source;
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    if (source instanceof Blob) return new Uint8Array(await source.arrayBuffer());
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to load skin (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
}

export async function loadCapeImage(source: SkinSource): Promise<TextureImage> {
    const image = await decodeImage(await sourceBytes(source));
    if (image.width < 22 || image.height < 17) throw new Error(`Unsupported cape size ${image.width}x${image.height}`);
    return image;
}

export async function loadSkinPreview(source: SkinSource, model?: SkinModel): Promise<SkinPreview> {
    const bytes = await sourceBytes(source);
    let doc;
    if (isNexSkin(bytes)) {
        doc = readNexSkin(bytes);
    } else {
        const image = await decodeImage(bytes);
        if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) throw new Error(`Unsupported skin size ${image.width}x${image.height}`);
        doc = documentFromImage('preview', image.data, image.height === 32 ? 'legacy' : 'modern', detectModel(image.data, image.width, image.height), 'base', 'overlay');
    }
    const resolvedModel = model ?? doc.model;
    const layout = getLayout(doc.format, resolvedModel);
    return {format: doc.format, layout, composite: compositeDocument(doc, getLayout(doc.format, doc.model)), model: resolvedModel};
}

export async function toNexSkin(bytes: Uint8Array, title: string, model?: SkinModel): Promise<Uint8Array> {
    if (isNexSkin(bytes)) return bytes;
    const image = await decodeImage(bytes);
    if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) throw new Error(`Unsupported skin size ${image.width}x${image.height}`);
    const doc = documentFromImage(title, image.data, image.height === 32 ? 'legacy' : 'modern', model ?? detectModel(image.data, image.width, image.height), title + '-body', title + '-outer');
    return writeNexSkin(doc);
}
