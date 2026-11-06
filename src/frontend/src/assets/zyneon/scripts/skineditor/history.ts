import type {DocumentSnapshot, PixelLayer, SkinDocument} from "./document.ts";

export interface HistoryEntry {
    label: string;
    bytes?: number;
    undo(): void;
    redo(): void;
}

export class History {

    private undoStack: HistoryEntry[] = [];
    private redoStack: HistoryEntry[] = [];
    private readonly limit: number;
    private readonly byteLimit: number;
    private bytes = 0;

    constructor(limit: number = 500, byteLimit: number = 32 * 1024 * 1024) {
        this.limit = limit;
        this.byteLimit = byteLimit;
    }

    push(entry: HistoryEntry) {
        this.undoStack.push(entry);
        this.bytes += entry.bytes ?? 0;
        for (const dropped of this.redoStack) this.bytes -= dropped.bytes ?? 0;
        this.redoStack = [];
        while (this.undoStack.length > 1 && (this.undoStack.length > this.limit || this.bytes > this.byteLimit)) {
            this.bytes -= this.undoStack.shift()!.bytes ?? 0;
        }
    }

    get usedBytes(): number {
        return this.bytes;
    }

    undo(): HistoryEntry | null {
        const entry = this.undoStack.pop();
        if (!entry) return null;
        entry.undo();
        this.redoStack.push(entry);
        return entry;
    }

    redo(): HistoryEntry | null {
        const entry = this.redoStack.pop();
        if (!entry) return null;
        entry.redo();
        this.undoStack.push(entry);
        return entry;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.bytes = 0;
    }

    get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    get canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    get undoLabel(): string | null {
        return this.undoStack[this.undoStack.length - 1]?.label ?? null;
    }

    get redoLabel(): string | null {
        return this.redoStack[this.redoStack.length - 1]?.label ?? null;
    }
}

export class PixelStroke {

    readonly layer: PixelLayer;
    private readonly view: Uint32Array;
    private readonly before = new Map<number, number>();

    constructor(layer: PixelLayer) {
        this.layer = layer;
        this.view = new Uint32Array(layer.pixels.buffer, layer.pixels.byteOffset, layer.pixels.length / 4);
    }

    get(index: number): number {
        return this.view[index] ?? 0;
    }

    original(index: number): number {
        const before = this.before.get(index);
        return before === undefined ? this.get(index) : before;
    }

    touched(index: number): boolean {
        return this.before.has(index);
    }

    set(index: number, color: number): boolean {
        if (index < 0 || index >= this.view.length) return false;
        const current = this.view[index]!;
        if (current === color) {
            if (!this.before.has(index)) this.before.set(index, current);
            return false;
        }
        if (!this.before.has(index)) this.before.set(index, current);
        this.view[index] = color;
        return true;
    }

    revert() {
        for (const [index, value] of this.before) this.view[index] = value;
        this.before.clear();
    }

    get isEmpty(): boolean {
        for (const [index, value] of this.before) {
            if (this.view[index] !== value) return false;
        }
        return true;
    }

    toEntry(label: string, resolve: (id: string) => PixelLayer | null, onChange: () => void): HistoryEntry | null {
        const indices: number[] = [];
        const before: number[] = [];
        const after: number[] = [];
        for (const [index, value] of this.before) {
            const now = this.view[index]!;
            if (now === value) continue;
            indices.push(index);
            before.push(value);
            after.push(now);
        }
        if (indices.length === 0) return null;
        const indexArray = Uint16Array.from(indices);
        const beforeArray = Uint32Array.from(before);
        const afterArray = Uint32Array.from(after);
        const layerId = this.layer.id;
        const apply = (values: Uint32Array) => {
            const layer = resolve(layerId);
            if (!layer) return;
            const view = new Uint32Array(layer.pixels.buffer, layer.pixels.byteOffset, layer.pixels.length / 4);
            for (let i = 0; i < indexArray.length; i++) view[indexArray[i]!] = values[i]!;
            onChange();
        };
        return {
            label,
            bytes: indexArray.byteLength + beforeArray.byteLength + afterArray.byteLength,
            undo: () => apply(beforeArray),
            redo: () => apply(afterArray)
        };
    }
}

function snapshotBytes(snapshot: DocumentSnapshot): number {
    let bytes = 0;
    const walk = (nodes: DocumentSnapshot['layers']) => {
        for (const node of nodes) {
            if (node.kind === 'layer') bytes += node.pixels.byteLength;
            else walk(node.children);
        }
    };
    walk(snapshot.layers);
    return bytes;
}

export function snapshotEntry(label: string, doc: SkinDocument, before: DocumentSnapshot, after: DocumentSnapshot, onChange: () => void): HistoryEntry {
    return {
        label,
        bytes: snapshotBytes(before) + snapshotBytes(after),
        undo: () => {
            doc.restore(before);
            onChange();
        },
        redo: () => {
            doc.restore(after);
            onChange();
        }
    };
}
