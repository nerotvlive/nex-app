declare global {
    interface Window {
        skinEditorOpenFile?: (requestId: string) => Promise<unknown>;
        skinEditorSaveFile?: (requestId: string, fileName: string, base64: string, path: string | null, saveAs: boolean) => Promise<unknown>;
        skinEditorOpenFolder?: () => Promise<unknown>;
        skinEditorPendingFiles?: (requestId: string) => Promise<unknown>;
        nexSkinEditorFilesAvailable?: () => void;
        skinLibraryList?: (requestId: string) => Promise<unknown>;
        skinLibraryWrite?: (requestId: string, character: string, outfit: string, base64: string, overwrite: boolean) => Promise<unknown>;
        skinLibraryCreateCharacter?: (requestId: string, name: string) => Promise<unknown>;
        skinLibraryRename?: (requestId: string, path: string, name: string) => Promise<unknown>;
        skinLibraryDelete?: (requestId: string, path: string) => Promise<unknown>;
        skinLibraryOpenInEditor?: (...paths: string[]) => Promise<unknown>;
        skinLibraryPlayerSkin?: (requestId: string, uuid: string) => Promise<unknown>;
        skinLibraryPlayerCapes?: (requestId: string, uuid: string) => Promise<unknown>;
        skinLibraryOpenFolder?: (path: string) => Promise<unknown>;
        nexSkinBridgeResolve?: (requestId: string, result: BridgeResult) => void;
    }
}

interface BridgeResult {
    status: 'ok' | 'cancelled' | 'unavailable' | 'error';
    name?: string;
    path?: string;
    data?: string;
    message?: string;
    files?: PendingFileResult[];
    characters?: LibraryFolder[];
    loose?: LibraryFile[];
    url?: string;
    model?: 'classic' | 'slim';
    cape?: string;
    capes?: { id: string, alias: string | null, url: string, active: boolean, data: string }[];
}

export interface PlayerCape {
    id: string;
    alias: string | null;
    url: string;
    active: boolean;
    bytes: Uint8Array;
}

export interface LibraryFile {
    name: string;
    path: string;
    modified: number;
    data: string | null;
}

export interface LibraryFolder {
    name: string;
    path: string;
    outfits: LibraryFile[];
}

export interface PlayerSkin {
    name: string;
    url: string;
    model: 'classic' | 'slim';
    bytes: Uint8Array;
    cape: Uint8Array | null;
}

interface PendingFileResult {
    name: string;
    path: string;
    data?: string;
    error?: string;
}

export interface PendingFile {
    name: string;
    path: string;
    bytes: Uint8Array | null;
    error: string | null;
}

export interface OpenedFile {
    name: string;
    path: string | null;
    bytes: Uint8Array;
}

export interface SavedFile {
    name: string;
    path: string | null;
}

const pending = new Map<string, (result: BridgeResult) => void>();

window.nexSkinBridgeResolve = (requestId: string, result: BridgeResult) => {
    const resolve = pending.get(requestId);
    if (resolve) {
        pending.delete(requestId);
        resolve(result);
    }
};

function request(call: (requestId: string) => Promise<unknown> | undefined): Promise<BridgeResult> {
    const requestId = 'skin-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    return new Promise<BridgeResult>((resolve, reject) => {
        pending.set(requestId, resolve);
        try {
            const result = call(requestId);
            if (result && typeof result.catch === 'function') {
                result.catch(error => {
                    pending.delete(requestId);
                    reject(error);
                });
            }
        } catch (error) {
            pending.delete(requestId);
            reject(error);
        }
    });
}

export function hasNativeFileAccess(): boolean {
    return typeof window.skinEditorOpenFile === 'function' && typeof window.skinEditorSaveFile === 'function';
}

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export async function openSkinFile(): Promise<OpenedFile | null> {
    if (window.skinEditorOpenFile) {
        const result = await request(id => window.skinEditorOpenFile!(id));
        if (result.status === 'cancelled') return null;
        // no native dialog: the file chooser of the webview (GTK on Linux) still works
        if (result.status === 'unavailable') return browserOpen();
        if (result.status !== 'ok' || !result.data) throw new Error(result.message || 'Could not open file');
        return {name: result.name ?? 'skin.png', path: result.path ?? null, bytes: base64ToBytes(result.data)};
    }
    return browserOpen();
}

export async function saveSkinFile(fileName: string, bytes: Uint8Array, path: string | null, saveAs: boolean): Promise<SavedFile | null> {
    if (window.skinEditorSaveFile) {
        const result = await request(id => window.skinEditorSaveFile!(id, fileName, bytesToBase64(bytes), path, saveAs));
        if (result.status === 'cancelled') return null;
        if (result.status !== 'ok') throw new Error(result.message || 'Could not save file');
        return {name: result.name ?? fileName, path: result.path ?? null};
    }
    browserDownload(fileName, bytes);
    return {name: fileName, path: null};
}

export async function takePendingFiles(): Promise<PendingFile[]> {
    if (!window.skinEditorPendingFiles) return [];
    const result = await request(id => window.skinEditorPendingFiles!(id));
    if (result.status !== 'ok') return [];
    return (result.files ?? []).map(file => ({
        name: file.name,
        path: file.path,
        bytes: file.data ? base64ToBytes(file.data) : null,
        error: file.data ? null : file.error ?? 'Unknown error'
    }));
}

export function openSkinFolder() {
    if (window.skinEditorOpenFolder) {
        void window.skinEditorOpenFolder();
    }
}

function browserOpen(): Promise<OpenedFile | null> {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.png,.nexskin,image/png';
        let settled = false;
        input.addEventListener('change', async () => {
            settled = true;
            const file = input.files?.[0];
            if (!file) {
                resolve(null);
                return;
            }
            resolve({name: file.name, path: null, bytes: new Uint8Array(await file.arrayBuffer())});
        });
        input.addEventListener('cancel', () => {
            if (!settled) resolve(null);
        });
        input.click();
    });
}

function browserDownload(fileName: string, bytes: Uint8Array) {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart]));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function hasSkinLibrary(): boolean {
    return typeof window.skinLibraryList === 'function';
}

async function libraryCall(call: (requestId: string) => Promise<unknown> | undefined): Promise<BridgeResult> {
    if (!hasSkinLibrary()) throw new Error('The skin library is only available in the app');
    const result = await request(call);
    if (result.status !== 'ok') throw new Error(result.message || 'Skin library request failed');
    return result;
}

export async function listSkinLibrary(): Promise<{ characters: LibraryFolder[], loose: LibraryFile[] }> {
    if (!hasSkinLibrary()) return {characters: [], loose: []};
    const result = await libraryCall(id => window.skinLibraryList!(id));
    return {characters: result.characters ?? [], loose: result.loose ?? []};
}

export async function writeLibraryOutfit(character: string, outfit: string, bytes: Uint8Array, overwrite: boolean = false): Promise<string> {
    const result = await libraryCall(id => window.skinLibraryWrite!(id, character, outfit, bytesToBase64(bytes), overwrite));
    return result.path!;
}

export async function createLibraryCharacter(name: string): Promise<{ name: string, path: string }> {
    const result = await libraryCall(id => window.skinLibraryCreateCharacter!(id, name));
    return {name: result.name!, path: result.path!};
}

export async function renameLibraryEntry(path: string, name: string): Promise<string> {
    const result = await libraryCall(id => window.skinLibraryRename!(id, path, name));
    return result.path!;
}

export async function deleteLibraryEntry(path: string): Promise<void> {
    await libraryCall(id => window.skinLibraryDelete!(id, path));
}

export function openLibraryFolder(path: string) {
    if (window.skinLibraryOpenFolder) void window.skinLibraryOpenFolder(path);
}

export function openInSkinEditor(paths: string[]) {
    if (paths.length && window.skinLibraryOpenInEditor) void window.skinLibraryOpenInEditor(...paths);
}

export async function fetchPlayerSkin(uuid: string): Promise<PlayerSkin | null> {
    const result = await libraryCall(id => window.skinLibraryPlayerSkin!(id, uuid));
    if (!result.data || !result.url) return null;
    return {name: result.name ?? '', url: result.url, model: result.model ?? 'classic', bytes: base64ToBytes(result.data), cape: result.cape ? base64ToBytes(result.cape) : null};
}

export async function fetchPlayerCapes(uuid: string): Promise<PlayerCape[]> {
    if (!window.skinLibraryPlayerCapes) return [];
    const result = await libraryCall(id => window.skinLibraryPlayerCapes!(id, uuid));
    return (result.capes ?? []).map(cape => ({id: cape.id, alias: cape.alias, url: cape.url, active: cape.active, bytes: base64ToBytes(cape.data)}));
}
