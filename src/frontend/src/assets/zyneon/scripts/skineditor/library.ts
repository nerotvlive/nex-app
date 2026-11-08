import type {PartId, SkinModel} from "./types.ts";
import {loadSkinPreview, toNexSkin, type SkinSource} from "./preview.ts";
import {decodeImage} from "./png.ts";
import {isNexSkin, readNexSkin, writeNexSkin} from "./nexskin.ts";
import {SkinDocument} from "./document.ts";
import {base64ToBytes, createLibraryCharacter, deleteLibraryEntry, fetchPlayerSkin, hasSkinLibrary, type LibraryFile, type LibraryFolder, listSkinLibrary, openInSkinEditor, renameLibraryEntry, saveSkinFile, writeLibraryOutfit} from "./bridge.ts";

const BUNDLED_PREFIX = 'bundled:';
const LOOSE_ID = 'loose';
const LEGACY_PLAYER_OUTFIT = 'Minecraft';
const PLAYER_TEXTURE_KEY = 'nexapp.skins.playerTexture.';

export interface SkinOutfit {
    id: string;
    name: string;
    source: string;
    path: string | null;
    bundled: boolean;
}

export interface SkinCharacter {
    id: string;
    name: string;
    path: string | null;
    bundled: boolean;
    loose: boolean;
    uuid: string | null;
    outfits: SkinOutfit[];
}

const fileBytes = new Map<string, Uint8Array>();

function fileName(source: string): string {
    return decodeURIComponent(source.split(/[\\/]/).pop() ?? source).replace(/\.(png|nexskin)$/i, '');
}

function characterKey(name: string): string {
    return name.trim().toLowerCase();
}

export function skinTitle(character: string, outfit: string): string {
    return `${character} (${outfit})`;
}

export function uuidKey(uuid: string): string | null {
    const clean = uuid.trim().toLowerCase().replace(/-/g, '');
    return /^[0-9a-f]{32}$/.test(clean) ? clean : null;
}

function uuidFolder(key: string): string {
    return `${key.slice(0, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}-${key.slice(16, 20)}-${key.slice(20)}`;
}

function characterNameOf(title: string): string | null {
    const match = /^(.*?)\s*\((.+)\)\s*$/.exec(title);
    return match?.[1]?.trim() || null;
}

export function outfitNameOf(title: string): string {
    const match = /^[^(]*\((.+)\)\s*$/.exec(title);
    return (match ? match[1]! : title).trim();
}

function documentName(bytes: Uint8Array): string | null {
    try {
        return isNexSkin(bytes) ? readNexSkin(bytes).name || null : null;
    } catch {
        return null;
    }
}

function withTitle(bytes: Uint8Array, title: string): Uint8Array {
    const doc = readNexSkin(bytes);
    doc.name = title;
    return writeNexSkin(doc);
}

function fileOutfit(file: LibraryFile): SkinOutfit {
    const id = file.path + '?' + file.modified;
    const bytes = file.data ? base64ToBytes(file.data) : null;
    if (bytes) fileBytes.set(id, bytes);
    const title = bytes ? documentName(bytes) : null;
    return {id, name: title ? outfitNameOf(title) : file.name, source: id, path: file.path, bundled: false};
}

export function groupBundledSkins(sources: string[]): SkinCharacter[] {
    const characters = new Map<string, SkinCharacter>();
    for (const source of sources) {
        const name = fileName(source);
        const match = /^(.*?)\s*\(([^)]+)\)$/.exec(name);
        const characterName = match ? match[1]!.trim() : name;
        const outfitName = match ? match[2]!.trim() : name;
        const id = BUNDLED_PREFIX + characterKey(characterName);
        let character = characters.get(id);
        if (!character) {
            character = {id, name: characterName, path: null, bundled: true, loose: false, uuid: null, outfits: []};
            characters.set(id, character);
        }
        character.outfits.push({id: source, name: outfitName, source, path: null, bundled: true});
    }
    return [...characters.values()];
}

function folderTitle(folder: LibraryFolder): string | null {
    const newest = [...folder.outfits].sort((a, b) => b.modified - a.modified).find(file => file.data);
    const title = newest?.data ? documentName(base64ToBytes(newest.data)) : null;
    return title ? characterNameOf(title) : null;
}

export async function loadLibrary(bundled: string[], names: Record<string, string> = {}): Promise<SkinCharacter[]> {
    const characters = groupBundledSkins(bundled);
    const byName = new Map(characters.map(character => [characterKey(character.name), character]));
    const library = await listSkinLibrary();
    fileBytes.clear();
    for (const folder of library.characters) {
        const outfits = folder.outfits.map(fileOutfit);
        const uuid = uuidKey(folder.name);
        if (uuid) {
            characters.push({id: folder.path, name: names[uuid] ?? folderTitle(folder) ?? folder.name, path: folder.path, bundled: false, loose: false, uuid, outfits});
            continue;
        }
        const match = byName.get(characterKey(folder.name));
        if (match) {
            match.path = folder.path;
            match.outfits.push(...outfits);
        } else {
            characters.push({id: folder.path, name: folder.name, path: folder.path, bundled: false, loose: false, uuid: null, outfits});
        }
    }
    if (library.loose.length) characters.push({id: LOOSE_ID, name: '', path: null, bundled: false, loose: true, uuid: null, outfits: library.loose.map(fileOutfit)});
    return characters;
}

export function canUseLibraryFiles(): boolean {
    return hasSkinLibrary();
}

export async function outfitSource(outfit: SkinOutfit): Promise<SkinSource> {
    if (outfit.bundled) return outfit.source;
    const bytes = fileBytes.get(outfit.id);
    if (!bytes) throw new Error('The skin file could not be read');
    return bytes;
}

async function outfitBytes(outfit: SkinOutfit): Promise<Uint8Array> {
    const source = await outfitSource(outfit);
    if (source instanceof Uint8Array) return source;
    const response = await fetch(source as string);
    if (!response.ok) throw new Error(`Failed to load skin (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
}

export async function createCharacter(name: string): Promise<string> {
    return (await createLibraryCharacter(name)).path;
}

function characterFolder(character: SkinCharacter): string {
    if (character.uuid) return uuidFolder(character.uuid);
    return character.path?.split(/[\\/]/).pop() || character.name;
}

export async function importOutfit(character: SkinCharacter, name: string, bytes: Uint8Array): Promise<string> {
    const title = skinTitle(character.name, name);
    return writeLibraryOutfit(characterFolder(character), name, withTitle(await toNexSkin(bytes, title), title));
}

export async function createOutfitFrom(character: SkinCharacter, outfit: SkinOutfit | null, name: string, layerName: string): Promise<string> {
    const title = skinTitle(character.name, name);
    const bytes = outfit ? withTitle(await toNexSkin(await outfitBytes(outfit), title), title) : writeNexSkin(SkinDocument.createEmpty(title, 'modern', 'classic', layerName));
    const path = await writeLibraryOutfit(characterFolder(character), name, bytes);
    openInSkinEditor([path]);
    return path;
}

export async function renameOutfit(character: SkinCharacter, outfit: SkinOutfit, name: string): Promise<string> {
    if (outfit.bundled || !outfit.path) throw new Error('Bundled outfits cannot be renamed');
    const bytes = withTitle(await outfitBytes(outfit), skinTitle(character.name, name));
    const saved = await saveSkinFile(outfit.path.split(/[\\/]/).pop() ?? 'skin.nexskin', bytes, outfit.path, false);
    return saved?.path ?? outfit.path;
}

export async function renameEntry(path: string, name: string): Promise<string> {
    return renameLibraryEntry(path, name);
}

export async function deleteEntry(path: string): Promise<void> {
    await deleteLibraryEntry(path);
}

export function editOutfits(outfits: SkinOutfit[]) {
    openInSkinEditor(outfits.filter(outfit => !outfit.bundled && outfit.path).map(outfit => outfit.path!));
}

export interface PlayerSync {
    name: string;
    uuid: string;
    texture: string;
    cape: Uint8Array | null;
    changed: boolean;
}

function textureId(url: string): string {
    return (url.split('/').pop() ?? '').replace(/[^0-9a-zA-Z]/g, '') || 'skin';
}

function storedTexture(key: string): string | null {
    try {
        return localStorage.getItem(PLAYER_TEXTURE_KEY + key);
    } catch {
        return null;
    }
}

export function playerTexture(uuid: string): string | null {
    const key = uuidKey(uuid);
    const url = key ? storedTexture(key) : null;
    return url ? textureId(url) : null;
}

async function removeLegacyPlayerFiles(name: string, characters: SkinCharacter[]): Promise<boolean> {
    const character = characters.find(entry => !entry.uuid && !entry.loose && entry.path && characterKey(entry.name) === characterKey(name));
    if (!character) return false;
    const own = character.outfits.filter(outfit => !outfit.bundled && outfit.path);
    const legacy = own.filter(outfit => [characterKey(name), characterKey(LEGACY_PLAYER_OUTFIT)].includes(characterKey(fileName(outfit.path!))));
    if (!legacy.length) return false;
    if (!character.bundled && legacy.length === own.length) await deleteLibraryEntry(character.path!);
    else for (const outfit of legacy) await deleteLibraryEntry(outfit.path!);
    return true;
}

export async function syncPlayerSkin(username: string, uuid: string, characters: SkinCharacter[]): Promise<PlayerSync | null> {
    const key = uuidKey(uuid);
    if (!hasSkinLibrary() || !key) return null;
    const skin = await fetchPlayerSkin(uuid);
    if (!skin) return null;
    const name = skin.name || username;
    const texture = textureId(skin.url);
    const migrated = await removeLegacyPlayerFiles(name, characters);
    const result: PlayerSync = {name, uuid: key, texture, cape: skin.cape, changed: migrated};
    const character = characters.find(entry => entry.uuid === key) ?? null;
    const outfits = character?.outfits ?? [];
    if (outfits.some(outfit => outfit.path && fileName(outfit.path) === texture)) return result;
    if (character && !migrated && storedTexture(key) === skin.url) return result;
    const used = new Set(outfits.map(outfit => outfit.name.toLowerCase()));
    let outfitName = name;
    for (let i = 2; used.has(outfitName.toLowerCase()); i++) outfitName = `${name} ${i}`;
    const title = skinTitle(name, outfitName);
    await writeLibraryOutfit(uuidFolder(key), texture, withTitle(await toNexSkin(skin.bytes, title, skin.model), title), true);
    try {
        localStorage.setItem(PLAYER_TEXTURE_KEY + key, skin.url);
    } catch {
        console.warn('[Skins] Could not remember the player skin');
    }
    return {...result, changed: true};
}

const FRONT_LAYOUT: Record<PartId, [number, number]> = {
    head: [4, 0],
    body: [4, 8],
    rightArm: [4, 8],
    leftArm: [12, 8],
    rightLeg: [4, 20],
    leftLeg: [8, 20]
};

const thumbnails = new Map<string, Promise<{ url: string, model: SkinModel }>>();

export function outfitThumbnail(outfit: SkinOutfit): Promise<{ url: string, model: SkinModel }> {
    let thumbnail = thumbnails.get(outfit.id);
    if (!thumbnail) {
        thumbnail = renderThumbnail(outfit);
        thumbnail.catch(() => thumbnails.delete(outfit.id));
        thumbnails.set(outfit.id, thumbnail);
    }
    return thumbnail;
}

async function renderThumbnail(outfit: SkinOutfit): Promise<{ url: string, model: SkinModel }> {
    const preview = await loadSkinPreview(await outfitSource(outfit));
    const {layout, composite} = preview;
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 32;
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(16, 32);
    for (const kind of ['base', 'overlay'] as const) {
        for (const box of layout.boxes) {
            if (box.kind !== kind) continue;
            const face = box.faces.find(entry => entry.dir === 'front');
            if (!face) continue;
            const [baseX, baseY] = FRONT_LAYOUT[box.part];
            const left = box.part === 'rightArm' ? baseX - face.rect.w : baseX;
            const mirrored = layout.format === 'legacy' && (box.part === 'leftArm' || box.part === 'leftLeg');
            for (let y = 0; y < face.rect.h; y++) {
                for (let x = 0; x < face.rect.w; x++) {
                    const sourceX = face.rect.x + (mirrored ? face.rect.w - 1 - x : x);
                    const from = ((face.rect.y + y) * layout.width + sourceX) * 4;
                    const alpha = composite[from + 3]!;
                    if (alpha === 0) continue;
                    const to = ((baseY + y) * 16 + left + x) * 4;
                    const a = alpha / 255;
                    for (let channel = 0; channel < 3; channel++) image.data[to + channel] = composite[from + channel]! * a + image.data[to + channel]! * (1 - a);
                    image.data[to + 3] = Math.max(image.data[to + 3]!, alpha);
                }
            }
        }
    }
    context.putImageData(image, 0, 0);
    return {url: canvas.toDataURL('image/png'), model: preview.model};
}

const capeThumbnails = new Map<string, Promise<string>>();

export function capeThumbnail(id: string, bytes: Uint8Array): Promise<string> {
    let thumbnail = capeThumbnails.get(id);
    if (!thumbnail) {
        thumbnail = renderCapeThumbnail(bytes);
        thumbnail.catch(() => capeThumbnails.delete(id));
        capeThumbnails.set(id, thumbnail);
    }
    return thumbnail;
}

async function renderCapeThumbnail(bytes: Uint8Array): Promise<string> {
    const image = await decodeImage(bytes);
    const scale = image.width >= 64 ? Math.max(1, Math.floor(image.width / 64)) : 1;
    const width = 10 * scale, height = 16 * scale;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    const output = context.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const from = ((scale + y) * image.width + scale + x) * 4;
            const to = (y * width + x) * 4;
            for (let channel = 0; channel < 4; channel++) output.data[to + channel] = image.data[from + channel] ?? 0;
        }
    }
    context.putImageData(output, 0, 0);
    return canvas.toDataURL('image/png');
}
