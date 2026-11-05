const DATABASE = 'nexapp-skineditor';
const STORE = 'drafts';
const KEY = 'current';

export interface DraftTab {
    name: string;
    path: string | null;
    bytes: Uint8Array;
}

export interface Draft {
    savedAt: number;
    tabs: DraftTab[];
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB is not available'));
            return;
        }
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const database = await openDatabase();
    try {
        return await new Promise<T>((resolve, reject) => {
            const transaction = database.transaction(STORE, mode);
            const request = action(transaction.objectStore(STORE));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        database.close();
    }
}

export async function saveDraft(draft: Draft): Promise<void> {
    try {
        await run('readwrite', store => store.put(draft, KEY));
    } catch {
        // ignore, drafts are optional
    }
}

export async function loadDraft(): Promise<Draft | null> {
    try {
        const draft = await run<unknown>('readonly', store => store.get(KEY)) as Partial<Draft> & Partial<DraftTab> | undefined;
        if (!draft) return null;
        if (!draft.tabs && draft.bytes) return {savedAt: draft.savedAt ?? Date.now(), tabs: [{name: draft.name ?? 'Skin', path: draft.path ?? null, bytes: draft.bytes}]};
        return draft.tabs && draft.tabs.length ? {savedAt: draft.savedAt ?? Date.now(), tabs: draft.tabs} : null;
    } catch {
        return null;
    }
}

export async function clearDraft(): Promise<void> {
    try {
        await run('readwrite', store => store.delete(KEY));
    } catch {
        // ignore
    }
}
