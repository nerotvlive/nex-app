import {markRaw, shallowReactive} from "vue";
import {PART_IDS, type LayerTarget, type PackedColor, type PartId, type Rect, type SkinFormat, type SkinModel} from "./types.ts";
import {createGroup, createId, createPixelLayer, cloneNode, type LayerNode, type PixelLayer, SkinDocument} from "./document.ts";
import {atlasToStorage, destTable, getLayout, partMask, type SkinLayout} from "./layout.ts";
import {analyzeComposite, compositeDocument} from "./compositor.ts";
import {History, type HistoryEntry, PixelStroke, snapshotEntry} from "./history.ts";
import {alphaOf, jitter, pack, shade, shadeRamp, TRANSPARENT} from "./color.ts";
import {splitAtlasPixels, convertDocument, documentFromImage} from "./convert.ts";
import {encodePng, decodeImage} from "./png.ts";
import {isNexSkin, NEXSKIN_EXTENSION, readNexSkin, writeNexSkin} from "./nexskin.ts";
import {openSkinFile, saveSkinFile} from "./bridge.ts";
import {clearDraft, loadDraft, saveDraft, type DraftTab} from "./draft.ts";

export type ToolId = 'pencil' | 'eraser' | 'fill' | 'picker' | 'shade' | 'noise' | 'select' | 'move' | 'line' | 'rect' | 'replace' | 'hand';

export interface ToolInfo {
    id: ToolId;
    icon: string;
    key: string;
    primary: boolean;
}

export const TOOLS: readonly ToolInfo[] = [
    {id: 'pencil', icon: 'icon-pencil', key: 'B', primary: true},
    {id: 'eraser', icon: 'icon-eraser', key: 'E', primary: true},
    {id: 'fill', icon: 'icon-paint-bucket', key: 'G', primary: true},
    {id: 'picker', icon: 'icon-pipette', key: 'I', primary: true},
    {id: 'shade', icon: 'icon-sun-moon', key: 'O', primary: true},
    {id: 'noise', icon: 'icon-spray-can', key: 'B', primary: true},
    {id: 'select', icon: 'icon-square-dashed', key: 'M', primary: true},
    {id: 'move', icon: 'icon-move', key: 'V', primary: false},
    {id: 'rect', icon: 'icon-square', key: 'U', primary: false},
    {id: 'line', icon: 'icon-slash', key: 'U', primary: false},
    {id: 'replace', icon: 'icon-replace', key: 'B', primary: false},
    {id: 'hand', icon: 'icon-hand', key: 'H', primary: false}
];

export function toolShortcut(tool: ToolInfo): string {
    const first = TOOLS.find(t => t.key === tool.key);
    return first === tool ? tool.key : 'Shift+' + tool.key;
}

export interface DocumentTab {
    id: string;
    doc: SkinDocument;
    history: History;
    filePath: string | null;
    fileName: string | null;
    dirty: boolean;
    activeLayerId: string | null;
    selection: Rect | null;
}

export interface TabInfo {
    id: string;
    name: string;
    dirty: boolean;
    active: boolean;
    format: SkinFormat;
}

export type ViewRequest = 'fit' | 'zoomIn' | 'zoomOut';

export type ViewMode = '3d' | '2d' | 'split';
export type HiddenPartMode = 'hide' | 'ghost' | 'lock';
export type FillMode = 'face' | 'part' | 'global';
export type RectMode = 'outline' | 'filled';

export interface PointerHit {
    x: number;
    y: number;
    part?: PartId;
    view: '2d' | '3d';
}

export interface PointerInfo {
    button: number;
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
}

export interface EditorMessage {
    key: string;
    params?: Record<string, unknown>;
    kind: 'info' | 'warning' | 'error' | 'success';
}

export type Translate = (key: string, params?: Record<string, unknown>) => string;

interface Clipboard {
    rect: Rect;
    colors: Uint32Array;
}

interface LiftedPixel {
    atlas: number;
    color: number;
}

const DEFAULT_COLORS: PackedColor[] = [
    pack(0x1d, 0x1d, 0x21), pack(0x47, 0x4f, 0x52), pack(0x9d, 0x9d, 0x97), pack(0xf9, 0xff, 0xfe),
    pack(0xb0, 0x2e, 0x26), pack(0xf9, 0x80, 0x1d), pack(0xfe, 0xd8, 0x3d), pack(0x80, 0xc7, 0x1f),
    pack(0x5e, 0x7c, 0x16), pack(0x16, 0x9c, 0x9c), pack(0x3a, 0xb3, 0xda), pack(0x3c, 0x44, 0xaa),
    pack(0x89, 0x32, 0xb8), pack(0xc7, 0x4e, 0xbd), pack(0xf3, 0x8b, 0xaa), pack(0x83, 0x54, 0x32)
];

export class SkinEditor {
    doc: SkinDocument;
    layout: SkinLayout;
    composite: Uint8ClampedArray;
    history: History;
    version = 0;
    historyVersion = 0;

    filePath: string | null = null;
    fileName: string | null = null;
    dirty = false;

    tool: ToolId = 'pencil';
    primaryColor: PackedColor = pack(0x3a, 0xb3, 0xda);
    secondaryColor: PackedColor = pack(0x1d, 0x1d, 0x21);
    recentColors: PackedColor[] = [];
    swatches: PackedColor[] = [...DEFAULT_COLORS];
    brushSize = 1;
    mirror = false;
    fillMode: FillMode = 'face';
    rectMode: RectMode = 'outline';
    shadeDirection: 1 | -1 = -1;
    noiseAmount = 0.25;

    selection: Rect | null = null;
    selectedParts: PartId[] = [...PART_IDS];
    overlayVisible: Record<PartId, boolean> = {head: true, body: true, rightArm: true, leftArm: true, rightLeg: true, leftLeg: true};
    hiddenPartMode: HiddenPartMode = 'hide';

    viewMode: ViewMode = 'split';
    shading = true;
    grid = true;
    guides = true;
    activeLayerId: string | null = null;
    hover: PointerHit | null = null;
    message: EditorMessage | null = null;
    navigationHeld = false;

    panelsHidden = false;
    viewRequest: { kind: ViewRequest, serial: number } | null = null;

    tabs: DocumentTab[] = [];
    activeTabId = '';

    translate: Translate = (key) => key;

    private lastToolOfGroup: Record<string, ToolId> = {};
    private stroke: PixelStroke | null = null;
    private strokeStart: PointerHit | null = null;
    private lastHit: PointerHit | null = null;
    private strokeColor: PackedColor = 0;
    private strokeDirection = 1;
    private selectionStart: PointerHit | null = null;
    private lifted: LiftedPixel[] | null = null;
    private liftedSelection: Rect | null = null;
    private clipboard: Clipboard | null = null;
    private messageTimer: number | null = null;
    private draftTimer: number | null = null;

    constructor() {
        this.doc = markRaw(SkinDocument.createEmpty('Skin'));
        this.layout = markRaw(getLayout(this.doc.format, this.doc.model));
        this.composite = markRaw(new Uint8ClampedArray(64 * 64 * 4));
        this.history = markRaw(new History());
        this.activeLayerId = this.doc.layers[0]?.id ?? null;
        const tab = this.createTab(this.doc, null, null);
        tab.history = this.history;
        this.tabs = [tab];
        this.activeTabId = tab.id;
        this.recomposite();
    }

    get activeNode(): LayerNode | null {
        return this.doc.find(this.activeLayerId)?.node ?? null;
    }

    get activeLayer(): PixelLayer | null {
        return this.doc.findLayer(this.activeLayerId);
    }

    get activeTarget(): LayerTarget {
        return this.activeLayer?.target ?? 'base';
    }

    get canUndo(): boolean {
        void this.historyVersion;
        return this.history.canUndo;
    }

    get canRedo(): boolean {
        void this.historyVersion;
        return this.history.canRedo;
    }

    private createEmptyDocument(format: SkinFormat, model: SkinModel): SkinDocument {
        return SkinDocument.createEmpty(this.translate('pages.skineditor.document.untitled'), format, model, this.translate('pages.skineditor.layers.defaultName', {number: 1}));
    }

    newDocument(format: SkinFormat = 'modern', model: SkinModel = 'classic') {
        this.openTab(this.createEmptyDocument(format, model), null, null);
    }

    setDocument(doc: SkinDocument, path: string | null, fileName: string | null) {
        this.cancelStroke();
        this.doc = markRaw(doc);
        this.filePath = path;
        this.fileName = fileName;
        this.history = markRaw(new History());
        this.historyVersion++;
        this.selection = null;
        this.activeLayerId = doc.allLayers()[0]?.id ?? doc.layers[0]?.id ?? null;
        this.refreshLayout();
        this.recomposite();
        this.version++;
        this.dirty = false;
        this.stashTab();
    }

    private createTab(doc: SkinDocument, path: string | null, fileName: string | null): DocumentTab {
        return markRaw({
            id: createId(),
            doc: markRaw(doc),
            history: markRaw(new History()),
            filePath: path,
            fileName,
            dirty: false,
            activeLayerId: doc.allLayers()[0]?.id ?? doc.layers[0]?.id ?? null,
            selection: null
        });
    }

    private get currentTab(): DocumentTab | undefined {
        return this.tabs.find(tab => tab.id === this.activeTabId);
    }

    private stashTab() {
        const tab = this.currentTab;
        if (!tab) return;
        tab.doc = this.doc;
        tab.history = this.history;
        tab.filePath = this.filePath;
        tab.fileName = this.fileName;
        tab.dirty = this.dirty;
        tab.activeLayerId = this.activeLayerId;
        tab.selection = this.selection;
    }

    private loadTab(tab: DocumentTab) {
        this.activeTabId = tab.id;
        this.doc = tab.doc;
        this.history = tab.history;
        this.filePath = tab.filePath;
        this.fileName = tab.fileName;
        this.dirty = tab.dirty;
        this.activeLayerId = tab.activeLayerId;
        this.selection = tab.selection;
        this.lastPropertyEdit = null;
        this.historyVersion++;
        this.refreshLayout();
        this.recomposite();
        this.version++;
    }

    private get isPristine(): boolean {
        return !this.dirty && !this.history.canUndo && !this.history.canRedo && this.filePath === null && this.fileName === null;
    }

    openTab(doc: SkinDocument, path: string | null, fileName: string | null, dirty: boolean = false) {
        this.cancelStroke();
        const current = this.currentTab;
        const replace = !!current && this.isPristine;
        this.stashTab();
        const tab = this.createTab(doc, path, fileName);
        tab.dirty = dirty;
        if (replace && current) {
            this.tabs = this.tabs.map(t => t.id === current.id ? tab : t);
        } else {
            const index = current ? this.tabs.indexOf(current) + 1 : this.tabs.length;
            this.tabs = [...this.tabs.slice(0, index), tab, ...this.tabs.slice(index)];
        }
        this.loadTab(tab);
    }

    switchTab(id: string) {
        if (id === this.activeTabId) return;
        const tab = this.tabs.find(t => t.id === id);
        if (!tab) return;
        this.cancelStroke();
        this.stashTab();
        this.loadTab(tab);
    }

    cycleTab(direction: 1 | -1) {
        if (this.tabs.length < 2) return;
        const index = this.tabs.findIndex(tab => tab.id === this.activeTabId);
        const next = this.tabs[(index + direction + this.tabs.length) % this.tabs.length]!;
        this.switchTab(next.id);
    }

    isTabDirty(id: string): boolean {
        if (id === this.activeTabId) return this.dirty;
        return this.tabs.find(tab => tab.id === id)?.dirty ?? false;
    }

    tabName(id: string): string {
        if (id === this.activeTabId) return this.doc.name;
        return this.tabs.find(tab => tab.id === id)?.doc.name ?? '';
    }

    closeTab(id: string) {
        const index = this.tabs.findIndex(tab => tab.id === id);
        if (index < 0) return;
        this.cancelStroke();
        if (this.tabs.length === 1) {
            const tab = this.createTab(this.createEmptyDocument(this.doc.format, this.doc.model), null, null);
            this.tabs = [tab];
            this.loadTab(tab);
            this.scheduleDraft();
            return;
        }
        const wasActive = id === this.activeTabId;
        if (!wasActive) this.stashTab();
        this.tabs = this.tabs.filter(tab => tab.id !== id);
        if (wasActive) this.loadTab(this.tabs[Math.min(index, this.tabs.length - 1)]!);
        this.scheduleDraft();
    }

    moveTab(id: string, toIndex: number) {
        const tab = this.tabs.find(t => t.id === id);
        if (!tab) return;
        const rest = this.tabs.filter(t => t.id !== id);
        const index = Math.max(0, Math.min(rest.length, toIndex));
        this.tabs = [...rest.slice(0, index), tab, ...rest.slice(index)];
    }

    get tabList(): TabInfo[] {
        void this.version;
        return this.tabs.map(tab => {
            const active = tab.id === this.activeTabId;
            const doc = active ? this.doc : tab.doc;
            return {id: tab.id, name: doc.name, dirty: active ? this.dirty : tab.dirty, active, format: doc.format};
        });
    }

    private refreshLayout() {
        const layout = getLayout(this.doc.format, this.doc.model);
        if (layout !== this.layout) this.layout = markRaw(layout);
        if (this.composite.length !== layout.width * layout.height * 4) {
            this.composite = markRaw(new Uint8ClampedArray(layout.width * layout.height * 4));
        }
    }

    recomposite() {
        compositeDocument(this.doc, this.layout, this.composite);
    }

    touch(markDirty: boolean = true) {
        this.refreshLayout();
        this.recomposite();
        this.version++;
        if (markDirty) {
            this.dirty = true;
            this.scheduleDraft();
        }
    }

    private pushHistory(entry: HistoryEntry | null) {
        if (!entry) return;
        this.history.push(entry);
        this.historyVersion++;
    }

    private structural(label: string, change: () => void) {
        this.cancelStroke();
        const before = this.doc.snapshot();
        change();
        const after = this.doc.snapshot();
        this.pushHistory(snapshotEntry(label, this.doc, before, after, () => this.afterHistory()));
        this.touch();
    }

    private afterHistory() {
        this.refreshLayout();
        if (!this.doc.find(this.activeLayerId)) {
            this.activeLayerId = this.doc.allLayers()[0]?.id ?? this.doc.layers[0]?.id ?? null;
        }
    }

    undo() {
        this.cancelStroke();
        if (this.history.undo()) {
            this.historyVersion++;
            this.afterHistory();
            this.touch();
        }
    }

    redo() {
        this.cancelStroke();
        if (this.history.redo()) {
            this.historyVersion++;
            this.afterHistory();
            this.touch();
        }
    }

    setModel(model: SkinModel) {
        if (this.doc.model === model) return;
        this.structural('pages.skineditor.history.model', () => {
            this.doc.model = model;
        });
    }

    convert(format: SkinFormat, model: SkinModel) {
        if (this.doc.format === format && this.doc.model === model) return;
        this.structural('pages.skineditor.history.convert', () => {
            convertDocument(this.doc, format, model);
        });
        this.selection = null;
        this.notify('pages.skineditor.messages.converted', 'success');
    }

    rename(name: string) {
        const trimmed = name.trim();
        if (!trimmed || trimmed === this.doc.name) return;
        this.structural('pages.skineditor.history.rename', () => {
            this.doc.name = trimmed;
        });
    }

    selectNode(id: string) {
        if (this.doc.find(id)) this.activeLayerId = id;
    }

    private nextLayerName(): string {
        return this.translate('pages.skineditor.layers.defaultName', {number: this.doc.allLayers().length + 1});
    }
    private insertNode(node: LayerNode) {
        const active = this.doc.find(this.activeLayerId);
        if (active && active.node.kind === 'group' && !active.node.collapsed) {
            active.node.children.unshift(node);
        } else if (active) {
            active.siblings.splice(active.index, 0, node);
        } else {
            this.doc.layers.unshift(node);
        }
        this.activeLayerId = node.id;
    }

    addLayer(target?: LayerTarget) {
        const layerTarget = target ?? (this.activeLayer?.target === 'atlas' ? 'base' : this.activeLayer?.target ?? 'base');
        this.structural('pages.skineditor.history.addLayer', () => {
            this.insertNode(createPixelLayer(this.nextLayerName(), layerTarget, this.doc.width, this.doc.height));
        });
    }

    addGroup() {
        this.structural('pages.skineditor.history.addGroup', () => {
            this.insertNode(createGroup(this.translate('pages.skineditor.layers.defaultGroup')));
        });
    }

    duplicateNode(id: string) {
        const location = this.doc.find(id);
        if (!location) return;
        this.structural('pages.skineditor.history.duplicate', () => {
            const copy = cloneNode(location.node, false);
            copy.name = this.translate('pages.skineditor.layers.copyName', {name: location.node.name});
            location.siblings.splice(location.index, 0, copy);
            this.activeLayerId = copy.id;
        });
    }

    deleteNode(id: string) {
        const location = this.doc.find(id);
        if (!location) return;
        this.structural('pages.skineditor.history.delete', () => {
            location.siblings.splice(location.index, 1);
            const next = location.siblings[location.index] ?? location.siblings[location.index - 1] ?? location.parent;
            this.activeLayerId = next?.id ?? this.doc.allLayers()[0]?.id ?? null;
        });
    }

    moveNode(id: string, targetId: string, position: 'before' | 'after' | 'inside') {
        if (id === targetId || this.doc.contains(id, targetId)) return;
        const source = this.doc.find(id);
        const target = this.doc.find(targetId);
        if (!source || !target) return;
        if (position === 'inside' && target.node.kind !== 'group') position = 'after';
        this.structural('pages.skineditor.history.move', () => {
            const node = source.siblings.splice(source.index, 1)[0]!;
            const current = this.doc.find(targetId)!;
            if (position === 'inside' && current.node.kind === 'group') {
                current.node.children.unshift(node);
                current.node.collapsed = false;
            } else {
                current.siblings.splice(current.index + (position === 'after' ? 1 : 0), 0, node);
            }
        });
    }

    moveNodeStep(id: string, direction: -1 | 1) {
        const location = this.doc.find(id);
        if (!location) return;
        const targetIndex = location.index + direction;
        if (targetIndex < 0 || targetIndex >= location.siblings.length) {
            if (location.parent) this.moveNode(id, location.parent.id, direction < 0 ? 'before' : 'after');
            return;
        }
        this.structural('pages.skineditor.history.move', () => {
            const [node] = location.siblings.splice(location.index, 1);
            location.siblings.splice(targetIndex, 0, node!);
        });
    }

    setNodeProperty<K extends 'name' | 'visible' | 'locked' | 'opacity' | 'blend' | 'collapsed'>(id: string, key: K, value: unknown, merge: boolean = false) {
        const location = this.doc.find(id);
        if (!location) return;
        const node = location.node as unknown as Record<string, unknown>;
        if (!(key in node) || node[key] === value) return;
        const before = node[key];
        node[key] = value;
        const apply = (v: unknown) => {
            const current = this.doc.find(id)?.node as unknown as Record<string, unknown> | undefined;
            if (current) current[key] = v;
            this.afterHistory();
        };
        const label = 'pages.skineditor.history.property';
        const last = this.lastPropertyEdit;
        if (merge && last && last.id === id && last.key === key && Date.now() - last.time < 1500 && this.history.canUndo) {
            last.after = value;
            last.time = Date.now();
        } else {
            const edit = {id, key: key as string, before, after: value, time: Date.now()};
            this.lastPropertyEdit = edit;
            this.pushHistory({label, undo: () => apply(edit.before), redo: () => apply(edit.after)});
        }
        this.touch(key !== 'collapsed');
    }

    private lastPropertyEdit: { id: string, key: string, before: unknown, after: unknown, time: number } | null = null;

    setLayerTarget(id: string, target: LayerTarget) {
        const layer = this.doc.findLayer(id);
        if (!layer || layer.target === target) return;
        this.structural('pages.skineditor.history.target', () => {
            const current = this.doc.findLayer(id)!;
            if (current.target !== 'atlas' && target !== 'atlas') {
                current.target = target;
                return;
            }
            const layout = this.layout;
            const count = layout.width * layout.height;
            const src = new Uint32Array(current.pixels.buffer, current.pixels.byteOffset, count);
            const pixels = new Uint8ClampedArray(count * 4);
            const dst = new Uint32Array(pixels.buffer);
            if (current.target === 'atlas') {
                const table = destTable(layout, target)!;
                for (let i = 0; i < count; i++) {
                    const atlas = table[i]!;
                    if (atlas >= 0) dst[i] = src[atlas]!;
                }
            } else {
                const table = destTable(layout, current.target)!;
                for (let i = 0; i < count; i++) {
                    const atlas = table[i]!;
                    if (atlas >= 0 && src[i] !== 0) dst[atlas] = src[i]!;
                }
            }
            current.pixels = pixels;
            current.target = target;
        });
    }

    splitAtlasLayer(id: string) {
        const location = this.doc.find(id);
        if (!location || location.node.kind !== 'layer' || location.node.target !== 'atlas') return;
        this.structural('pages.skineditor.history.split', () => {
            const layer = location.node as PixelLayer;
            const [base, overlay] = splitAtlasPixels(layer.pixels, this.layout);
            const baseLayer = createPixelLayer(this.translate('pages.skineditor.layers.splitBase', {name: layer.name}), 'base', this.doc.width, this.doc.height, base);
            const overlayLayer = createPixelLayer(this.translate('pages.skineditor.layers.splitOverlay', {name: layer.name}), 'overlay', this.doc.width, this.doc.height, overlay);
            baseLayer.opacity = overlayLayer.opacity = layer.opacity;
            baseLayer.visible = overlayLayer.visible = layer.visible;
            location.siblings.splice(location.index, 1, overlayLayer, baseLayer);
            this.activeLayerId = baseLayer.id;
        });
    }

    mergeDown(id: string) {
        const location = this.doc.find(id);
        if (!location || location.node.kind !== 'layer') return;
        const below = location.siblings[location.index + 1];
        if (!below || below.kind !== 'layer') {
            this.notify('pages.skineditor.messages.mergeImpossible', 'warning');
            return;
        }
        this.structural('pages.skineditor.history.merge', () => {
            const upper = location.node as PixelLayer;
            const lower = below;
            const layout = this.layout;
            const count = layout.width * layout.height;
            if (upper.target !== lower.target && lower.target !== 'atlas') {
                const table = destTable(layout, lower.target)!;
                const src = new Uint32Array(lower.pixels.buffer, lower.pixels.byteOffset, count);
                const pixels = new Uint8ClampedArray(count * 4);
                const dst = new Uint32Array(pixels.buffer);
                for (let i = 0; i < count; i++) {
                    if (table[i]! >= 0 && src[i] !== 0) dst[table[i]!] = src[i]!;
                }
                lower.pixels = pixels;
                lower.target = 'atlas';
            }
            const temp = new SkinDocument('merge', this.doc.format, this.doc.model, [
                {...upper, visible: true},
                {...lower, visible: true, opacity: 1, blend: 'normal'}
            ]);
            const merged = compositeDocument(temp, layout);
            const result = new Uint8ClampedArray(count * 4);
            const resultView = new Uint32Array(result.buffer);
            const mergedView = new Uint32Array(merged.buffer);
            for (let i = 0; i < count; i++) {
                const storage = atlasToStorage(layout, lower.target, i);
                if (storage >= 0 && mergedView[i] !== 0) resultView[storage] = mergedView[i]!;
            }
            lower.pixels = result;
            location.siblings.splice(location.index, 1);
            this.activeLayerId = lower.id;
        });
    }

    clearLayer(id: string) {
        const layer = this.doc.findLayer(id);
        if (!layer) return;
        this.structural('pages.skineditor.history.clear', () => {
            this.doc.findLayer(id)!.pixels.fill(0);
        });
    }

    get selectedMask(): number {
        return partMask(this.selectedParts);
    }

    get allPartsSelected(): boolean {
        return this.selectedParts.length === PART_IDS.length;
    }

    selectPart(part: PartId, additive: boolean) {
        if (additive) {
            const has = this.selectedParts.includes(part);
            const next = has ? this.selectedParts.filter(p => p !== part) : [...this.selectedParts, part];
            this.selectedParts = next.length ? PART_IDS.filter(p => next.includes(p)) : [...PART_IDS];
        } else if (this.selectedParts.length === 1 && this.selectedParts[0] === part) {
            this.selectedParts = [...PART_IDS];
        } else {
            this.selectedParts = [part];
        }
    }

    selectAllParts() {
        this.selectedParts = [...PART_IDS];
    }

    setOverlayVisible(part: PartId | 'all', visible: boolean) {
        const next = {...this.overlayVisible};
        for (const p of part === 'all' ? PART_IDS : [part]) next[p] = visible;
        this.overlayVisible = next;
    }

    get allOverlaysVisible(): boolean {
        return PART_IDS.every(part => this.overlayVisible[part]);
    }

    computeEditableMask(): Uint8Array {
        const layout = this.layout;
        const count = layout.width * layout.height;
        const mask = new Uint8Array(count);
        const layer = this.activeLayer;
        if (!layer) return mask;
        const parts = this.selectedMask;
        for (let i = 0; i < count; i++) {
            if (!layout.pixelActive[i]) continue;
            if ((layout.pixelParts[i]! & parts) === 0) continue;
            if (atlasToStorage(layout, layer.target, i) < 0) continue;
            mask[i] = 1;
        }
        return mask;
    }

    setPrimaryColor(color: PackedColor, remember: boolean = false) {
        this.primaryColor = color;
        if (remember) this.rememberColor(color);
    }

    setSecondaryColor(color: PackedColor) {
        this.secondaryColor = color;
    }

    swapColors() {
        const primary = this.primaryColor;
        this.primaryColor = this.secondaryColor;
        this.secondaryColor = primary;
    }

    rememberColor(color: PackedColor) {
        if (alphaOf(color) === 0) return;
        this.recentColors = [color, ...this.recentColors.filter(c => c !== color)].slice(0, 16);
    }

    get shadePalette(): PackedColor[] {
        return shadeRamp(this.primaryColor, 7);
    }

    private inSelection(index: number): boolean {
        const selection = this.selection;
        if (!selection) return true;
        const x = index % this.layout.width, y = Math.floor(index / this.layout.width);
        return x >= selection.x && y >= selection.y && x < selection.x + selection.w && y < selection.y + selection.h;
    }

    private paintableStorage(index: number, part: PartId | undefined, ignoreRestrictions: boolean): number {
        const layer = this.stroke?.layer ?? this.activeLayer;
        if (!layer) return -1;
        const layout = this.layout;
        if (index < 0 || index >= layout.width * layout.height || !layout.pixelActive[index]) return -1;
        if (!ignoreRestrictions) {
            const mask = part ? partMask([part]) : layout.pixelParts[index]!;
            if ((mask & this.selectedMask) === 0) return -1;
            if (!this.inSelection(index)) return -1;
        }
        return atlasToStorage(layout, layer.target, index);
    }

    private canStartStroke(): PixelLayer | null {
        const layer = this.activeLayer;
        if (!layer) {
            this.notify('pages.skineditor.messages.noLayer', 'warning');
            return null;
        }
        if (this.doc.isEffectivelyLocked(layer.id)) {
            this.notify('pages.skineditor.messages.layerLocked', 'warning');
            return null;
        }
        if (!this.doc.isEffectivelyVisible(layer.id)) {
            this.notify('pages.skineditor.messages.layerHidden', 'warning');
            return null;
        }
        return layer;
    }

    private paintPixel(index: number, part: PartId | undefined, color: (storage: number, current: number) => number | null) {
        if (!this.stroke) return;
        const targets: [number, PartId | undefined, boolean][] = [[index, part, false]];
        if (this.mirror) {
            const mirrored = this.layout.mirror[index] ?? -1;
            if (mirrored >= 0 && mirrored !== index) targets.push([mirrored, undefined, true]);
        }
        for (const [atlas, atlasPart, ignore] of targets) {
            const storage = this.paintableStorage(atlas, atlasPart, ignore);
            if (storage < 0) continue;
            const next = color(storage, this.stroke.get(storage));
            if (next !== null) this.stroke.set(storage, next);
        }
    }

    private brushPixels(x: number, y: number): number[] {
        const layout = this.layout;
        const size = Math.max(1, Math.min(8, this.brushSize));
        if (size === 1) return [y * layout.width + x];
        const center = y * layout.width + x;
        const face = layout.pixelFace[center] ?? -1;
        const start = -Math.floor((size - 1) / 2);
        const out: number[] = [];
        for (let dy = start; dy < start + size; dy++) {
            for (let dx = start; dx < start + size; dx++) {
                const px = x + dx, py = y + dy;
                if (px < 0 || py < 0 || px >= layout.width || py >= layout.height) continue;
                const index = py * layout.width + px;
                if (face >= 0 && layout.pixelFace[index] !== face) continue;
                out.push(index);
            }
        }
        return out;
    }

    private brushAt(hit: PointerHit) {
        const color = this.brushColorFunction();
        for (const index of this.brushPixels(hit.x, hit.y)) this.paintPixel(index, hit.part, color);
    }

    private brushColorFunction(): (storage: number, current: number) => number | null {
        switch (this.tool) {
            case 'eraser':
                return () => TRANSPARENT;
            case 'shade':
                return (storage, current) => {
                    // every pixel is shaded once per stroke
                    if (!this.stroke || alphaOf(current) === 0) return null;
                    if (this.stroke.touched(storage)) return null;
                    return shade(current, this.strokeDirection);
                };
            case 'noise':
                return () => jitter(this.strokeColor, this.noiseAmount);
            default:
                return () => this.strokeColor;
        }
    }

    private linePixels(a: { x: number, y: number }, b: { x: number, y: number }): { x: number, y: number }[] {
        const out: { x: number, y: number }[] = [];
        let x0 = a.x, y0 = a.y;
        const dx = Math.abs(b.x - x0), dy = -Math.abs(b.y - y0);
        const sx = x0 < b.x ? 1 : -1, sy = y0 < b.y ? 1 : -1;
        let error = dx + dy;
        for (let guard = 0; guard < 512; guard++) {
            out.push({x: x0, y: y0});
            if (x0 === b.x && y0 === b.y) break;
            const e2 = 2 * error;
            if (e2 >= dy) {
                error += dy;
                x0 += sx;
            }
            if (e2 <= dx) {
                error += dx;
                y0 += sy;
            }
        }
        return out;
    }

    private sameFaceFilter(start: PointerHit): (index: number) => boolean {
        if (start.view === '2d') return () => true;
        const face = this.layout.pixelFace[start.y * this.layout.width + start.x] ?? -1;
        return index => face < 0 || this.layout.pixelFace[index] === face;
    }

    private drawShape(start: PointerHit, end: PointerHit, shift: boolean) {
        if (!this.stroke) return;
        this.stroke.revert();
        const width = this.layout.width;
        const filter = this.sameFaceFilter(start);
        const color = () => this.strokeColor;
        const indices = new Set<number>();
        if (this.tool === 'line') {
            let target = {x: end.x, y: end.y};
            if (shift) {
                const dx = end.x - start.x, dy = end.y - start.y;
                if (Math.abs(dx) > 2 * Math.abs(dy)) target = {x: end.x, y: start.y};
                else if (Math.abs(dy) > 2 * Math.abs(dx)) target = {x: start.x, y: end.y};
                else {
                    const d = Math.max(Math.abs(dx), Math.abs(dy));
                    target = {x: start.x + Math.sign(dx) * d, y: start.y + Math.sign(dy) * d};
                }
            }
            for (const point of this.linePixels(start, target)) {
                for (const index of this.brushPixels(point.x, point.y)) indices.add(index);
            }
        } else {
            const x0 = Math.min(start.x, end.x), x1 = Math.max(start.x, end.x);
            const y0 = Math.min(start.y, end.y), y1 = Math.max(start.y, end.y);
            const filled = this.rectMode === 'filled' || shift;
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    if (filled || x === x0 || x === x1 || y === y0 || y === y1) indices.add(y * width + x);
                }
            }
        }
        for (const index of indices) {
            if (filter(index)) this.paintPixel(index, start.view === '3d' ? start.part : undefined, color);
        }
    }

    private fill(hit: PointerHit) {
        const layer = this.stroke?.layer;
        if (!layer || !this.stroke) return;
        const layout = this.layout;
        const width = layout.width, height = layout.height;
        const startIndex = hit.y * width + hit.x;
        const startStorage = this.paintableStorage(startIndex, hit.part, false);
        if (startStorage < 0) return;
        const targetColor = this.stroke.get(startStorage);
        const fillColor = this.strokeColor;
        if (targetColor === fillColor) return;
        const startFace = layout.pixelFace[startIndex] ?? -1;
        const startKind = layout.pixelKind[startIndex];
        const startParts = hit.part ? partMask([hit.part]) : layout.pixelParts[startIndex]!;
        const color = () => fillColor;

        const allowed = (index: number): boolean => {
            if (this.fillMode === 'face') return layout.pixelFace[index] === startFace;
            if (this.fillMode === 'part') return layout.pixelKind[index] === startKind && (layout.pixelParts[index]! & startParts) !== 0;
            return true;
        };
        const matches = (index: number): boolean => {
            const storage = this.paintableStorage(index, undefined, false);
            return storage >= 0 && this.stroke!.original(storage) === targetColor && !this.stroke!.touched(storage);
        };

        if (this.fillMode === 'global') {
            for (let i = 0; i < width * height; i++) {
                if (matches(i)) this.paintPixel(i, undefined, color);
            }
            return;
        }
        const visited = new Uint8Array(width * height);
        const queue = [startIndex];
        visited[startIndex] = 1;
        while (queue.length) {
            const index = queue.pop()!;
            if (!matches(index) && index !== startIndex) continue;
            this.paintPixel(index, index === startIndex ? hit.part : undefined, color);
            const x = index % width, y = Math.floor(index / width);
            const neighbours = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, y > 0 ? index - width : -1, y < height - 1 ? index + width : -1];
            for (const next of neighbours) {
                if (next < 0 || visited[next]) continue;
                visited[next] = 1;
                if (allowed(next) && matches(next)) queue.push(next);
            }
        }
    }

    private replaceColor(hit: PointerHit) {
        if (!this.stroke) return;
        const startStorage = this.paintableStorage(hit.y * this.layout.width + hit.x, hit.part, false);
        if (startStorage < 0) return;
        const from = this.stroke.get(startStorage);
        const to = this.strokeColor;
        if (from === to) return;
        const count = this.layout.width * this.layout.height;
        for (let i = 0; i < count; i++) {
            const storage = this.paintableStorage(i, undefined, false);
            if (storage >= 0 && this.stroke.original(storage) === from) this.stroke.set(storage, to);
        }
    }

    pickColor(hit: PointerHit, secondary: boolean) {
        const index = hit.y * this.layout.width + hit.x;
        const c = this.composite;
        if (c[index * 4 + 3] === 0) return;
        const color = pack(c[index * 4]!, c[index * 4 + 1]!, c[index * 4 + 2]!, c[index * 4 + 3]!);
        if (secondary) this.secondaryColor = color;
        else this.setPrimaryColor(color, true);
    }

    private liftPixels() {
        const layer = this.stroke?.layer;
        if (!layer || !this.stroke) return;
        const layout = this.layout;
        const lifted: LiftedPixel[] = [];
        const rect = this.selection ?? {x: 0, y: 0, w: layout.width, h: layout.height};
        for (let y = rect.y; y < rect.y + rect.h; y++) {
            for (let x = rect.x; x < rect.x + rect.w; x++) {
                const atlas = y * layout.width + x;
                const storage = atlasToStorage(layout, layer.target, atlas);
                if (storage < 0) continue;
                const color = this.stroke.get(storage);
                if (color !== 0) lifted.push({atlas, color});
            }
        }
        this.lifted = lifted;
        this.liftedSelection = this.selection ? {...this.selection} : null;
    }

    private applyMove(dx: number, dy: number) {
        const layer = this.stroke?.layer;
        if (!layer || !this.stroke || !this.lifted) return;
        this.stroke.revert();
        const layout = this.layout;
        for (const pixel of this.lifted) {
            const storage = atlasToStorage(layout, layer.target, pixel.atlas);
            if (storage >= 0) this.stroke.set(storage, 0);
        }
        for (const pixel of this.lifted) {
            const x = pixel.atlas % layout.width + dx, y = Math.floor(pixel.atlas / layout.width) + dy;
            if (x < 0 || y < 0 || x >= layout.width || y >= layout.height) continue;
            const storage = atlasToStorage(layout, layer.target, y * layout.width + x);
            if (storage >= 0) this.stroke.set(storage, pixel.color);
        }
        if (this.liftedSelection) this.selection = {...this.liftedSelection, x: this.liftedSelection.x + dx, y: this.liftedSelection.y + dy};
    }

    nudge(dx: number, dy: number) {
        const layer = this.canStartStroke();
        if (!layer) return;
        this.stroke = new PixelStroke(layer);
        this.liftPixels();
        this.applyMove(dx, dy);
        this.finishStroke('pages.skineditor.history.move');
    }

    pointerDown(hit: PointerHit, info: PointerInfo) {
        this.cancelStroke();
        this.lastHit = hit;
        const secondary = info.button === 2;
        const tool = info.alt && this.tool !== 'picker' ? 'picker' : this.tool;
        if (tool === 'hand') return;

        if (tool === 'picker') {
            this.pickColor(hit, secondary);
            this.strokeStart = hit;
            return;
        }
        if (tool === 'select') {
            this.selectionStart = hit;
            this.selection = null;
            return;
        }

        const layer = this.canStartStroke();
        if (!layer) return;
        this.stroke = new PixelStroke(layer);
        this.strokeStart = hit;
        this.strokeColor = secondary ? this.secondaryColor : this.primaryColor;
        this.strokeDirection = (info.shift || secondary) ? -this.shadeDirection : this.shadeDirection;

        switch (tool) {
            case 'pencil':
            case 'eraser':
            case 'shade':
            case 'noise':
                if (tool === 'pencil') this.rememberColor(this.strokeColor);
                this.brushAt(hit);
                break;
            case 'fill':
                this.rememberColor(this.strokeColor);
                this.fill(hit);
                this.finishStroke('pages.skineditor.history.fill');
                break;
            case 'replace':
                this.rememberColor(this.strokeColor);
                this.replaceColor(hit);
                this.finishStroke('pages.skineditor.history.replace');
                break;
            case 'line':
            case 'rect':
                this.rememberColor(this.strokeColor);
                this.drawShape(hit, hit, info.shift);
                break;
            case 'move':
                this.liftPixels();
                break;
        }
        this.touch();
    }

    pointerMove(hit: PointerHit | null, info: PointerInfo) {
        this.hover = hit;
        if (!hit) return;
        const tool = info.alt && this.tool !== 'picker' ? 'picker' : this.tool;

        if (this.selectionStart && tool === 'select') {
            const a = this.selectionStart;
            this.selection = {
                x: Math.min(a.x, hit.x), y: Math.min(a.y, hit.y),
                w: Math.abs(hit.x - a.x) + 1, h: Math.abs(hit.y - a.y) + 1
            };
            return;
        }
        if (tool === 'picker' && this.strokeStart) {
            this.pickColor(hit, info.button === 2);
            return;
        }
        if (!this.stroke || !this.strokeStart) return;

        switch (this.tool) {
            case 'pencil':
            case 'eraser':
            case 'shade':
            case 'noise': {
                const last = this.lastHit;
                if (last && hit.view === '2d' && last.view === '2d') {
                    for (const point of this.linePixels(last, hit).slice(1)) this.brushAt({...hit, x: point.x, y: point.y});
                } else {
                    this.brushAt(hit);
                }
                break;
            }
            case 'line':
            case 'rect':
                this.drawShape(this.strokeStart, hit, info.shift);
                break;
            case 'move':
                this.applyMove(hit.x - this.strokeStart.x, hit.y - this.strokeStart.y);
                break;
        }
        this.lastHit = hit;
        this.touch();
    }

    pointerUp() {
        if (this.selectionStart) {
            if (this.selection && this.selection.w === 1 && this.selection.h === 1 && this.lastHit === this.selectionStart) this.selection = null;
            this.selectionStart = null;
        }
        this.strokeStart = null;
        if (this.stroke) {
            const labels: Partial<Record<ToolId, string>> = {
                eraser: 'pages.skineditor.history.erase',
                shade: 'pages.skineditor.history.shade',
                noise: 'pages.skineditor.history.noise',
                line: 'pages.skineditor.history.line',
                rect: 'pages.skineditor.history.rect',
                move: 'pages.skineditor.history.move'
            };
            this.finishStroke(labels[this.tool] ?? 'pages.skineditor.history.paint');
        }
        this.lifted = null;
        this.liftedSelection = null;
    }

    pointerLeave() {
        this.hover = null;
    }

    private finishStroke(label: string) {
        const stroke = this.stroke;
        this.stroke = null;
        if (!stroke) return;
        this.pushHistory(stroke.toEntry(label, id => this.doc.findLayer(id), () => this.touch()));
        this.touch();
    }

    cancelStroke() {
        if (this.stroke) this.finishStroke('pages.skineditor.history.paint');
        this.strokeStart = null;
        this.selectionStart = null;
        this.lifted = null;
        this.liftedSelection = null;
    }

    selectAll() {
        this.selection = {x: 0, y: 0, w: this.layout.width, h: this.layout.height};
    }

    deselect() {
        this.selection = null;
    }

    copySelection(cut: boolean = false) {
        const layer = this.activeLayer;
        if (!layer) return;
        const rect = this.selection ?? {x: 0, y: 0, w: this.layout.width, h: this.layout.height};
        const colors = new Uint32Array(rect.w * rect.h);
        const view = new Uint32Array(layer.pixels.buffer, layer.pixels.byteOffset, layer.pixels.length / 4);
        for (let y = 0; y < rect.h; y++) {
            for (let x = 0; x < rect.w; x++) {
                const storage = atlasToStorage(this.layout, layer.target, (rect.y + y) * this.layout.width + rect.x + x);
                colors[y * rect.w + x] = storage >= 0 ? view[storage]! : 0;
            }
        }
        this.clipboard = {rect: {...rect}, colors};
        if (cut) this.deleteSelection('pages.skineditor.history.cut');
        this.notify(cut ? 'pages.skineditor.messages.cut' : 'pages.skineditor.messages.copied', 'info');
    }

    paste() {
        const clipboard = this.clipboard;
        if (!clipboard) return;
        const layer = this.canStartStroke();
        if (!layer) return;
        const rect = clipboard.rect;
        this.stroke = new PixelStroke(layer);
        for (let y = 0; y < rect.h; y++) {
            for (let x = 0; x < rect.w; x++) {
                const color = clipboard.colors[y * rect.w + x]!;
                if (color === 0) continue;
                const storage = atlasToStorage(this.layout, layer.target, (rect.y + y) * this.layout.width + rect.x + x);
                if (storage >= 0) this.stroke.set(storage, color);
            }
        }
        this.selection = {...rect};
        this.tool = 'move';
        this.finishStroke('pages.skineditor.history.paste');
    }

    deleteSelection(label: string = 'pages.skineditor.history.erase') {
        const layer = this.canStartStroke();
        if (!layer) return;
        this.stroke = new PixelStroke(layer);
        const rect = this.selection ?? {x: 0, y: 0, w: this.layout.width, h: this.layout.height};
        for (let y = rect.y; y < rect.y + rect.h; y++) {
            for (let x = rect.x; x < rect.x + rect.w; x++) {
                const index = y * this.layout.width + x;
                if ((this.layout.pixelParts[index]! & this.selectedMask) === 0) continue;
                const storage = atlasToStorage(this.layout, layer.target, index);
                if (storage >= 0) this.stroke.set(storage, 0);
            }
        }
        this.finishStroke(label);
    }

    flipSelection(direction: 'horizontal' | 'vertical') {
        const layer = this.canStartStroke();
        if (!layer) return;
        const rect = this.selection ?? {x: 0, y: 0, w: this.layout.width, h: this.layout.height};
        this.stroke = new PixelStroke(layer);
        const width = this.layout.width;
        const read = (x: number, y: number) => {
            const storage = atlasToStorage(this.layout, layer.target, y * width + x);
            return storage >= 0 ? this.stroke!.original(storage) : 0;
        };
        for (let y = rect.y; y < rect.y + rect.h; y++) {
            for (let x = rect.x; x < rect.x + rect.w; x++) {
                const storage = atlasToStorage(this.layout, layer.target, y * width + x);
                if (storage < 0) continue;
                const sx = direction === 'horizontal' ? rect.x + rect.w - 1 - (x - rect.x) : x;
                const sy = direction === 'vertical' ? rect.y + rect.h - 1 - (y - rect.y) : y;
                this.stroke.set(storage, read(sx, sy));
            }
        }
        this.finishStroke('pages.skineditor.history.flip');
    }

    mirrorToOtherSide() {
        const layer = this.canStartStroke();
        if (!layer) return;
        this.stroke = new PixelStroke(layer);
        const layout = this.layout;
        const count = layout.width * layout.height;
        const view = new Uint32Array(layer.pixels.buffer, layer.pixels.byteOffset, count);
        const snapshot = new Uint32Array(view);
        for (let i = 0; i < count; i++) {
            if (!layout.pixelActive[i] || (layout.pixelParts[i]! & this.selectedMask) === 0) continue;
            const target = layout.mirror[i]!;
            if (target < 0 || target === i) continue;
            if ((layout.pixelParts[target]! & this.selectedMask) !== 0 && !this.allPartsSelected) continue;
            const from = atlasToStorage(layout, layer.target, i);
            const to = atlasToStorage(layout, layer.target, target);
            if (from >= 0 && to >= 0) this.stroke.set(to, snapshot[from]!);
        }
        this.finishStroke('pages.skineditor.history.mirror');
    }

    private baseFileName(): string {
        const name = (this.fileName ?? this.doc.name ?? 'skin').replace(/\.(png|nexskin)$/i, '');
        return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'skin';
    }

    async open(): Promise<boolean> {
        try {
            const file = await openSkinFile();
            if (!file) return false;
            await this.openBytes(file.name, file.path, file.bytes);
            return true;
        } catch (error) {
            console.error('[SkinEditor] open failed', error);
            this.notify('pages.skineditor.messages.openFailed', 'error', {error: String((error as Error)?.message ?? error)});
            return false;
        }
    }

    async decodeFile(name: string, bytes: Uint8Array): Promise<SkinDocument> {
        const title = name.replace(/\.(png|nexskin)$/i, '');
        if (isNexSkin(bytes)) return readNexSkin(bytes);
        const image = await decodeImage(bytes);
        if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) {
            throw new Error(this.translate('pages.skineditor.messages.wrongSize', {width: image.width, height: image.height}));
        }
        const model = detectModel(image.data, image.width, image.height);
        return documentFromImage(title, image.data, image.height === 32 ? 'legacy' : 'modern', model, title + '-body', title + '-outer');
    }

    async openBytes(name: string, path: string | null, bytes: Uint8Array) {
        const doc = await this.decodeFile(name, bytes);
        if (isNexSkin(bytes)) {
            this.openTab(doc, path, name);
        } else {
            this.openTab(doc, null, name.replace(/\.png$/i, NEXSKIN_EXTENSION));
        }
        this.notify('pages.skineditor.messages.opened', 'success', {name});
    }

    async importAsLayers(name: string, bytes: Uint8Array) {
        const source = await this.decodeFile(name, bytes);
        if (source.format !== this.doc.format || source.model !== this.doc.model) {
            convertDocument(source, this.doc.format, this.doc.model);
        }
        if (!source.layers.length) return;
        this.structural('pages.skineditor.history.import', () => {
            const title = name.replace(/\.(png|nexskin)$/i, '');
            const node = source.layers.length === 1 ? source.layers[0]! : createGroup(title, source.layers);
            this.insertNode(node);
            this.activeLayerId = node.kind === 'group' ? (source.allLayers()[source.allLayers().length - 1]?.id ?? node.id) : node.id;
        });
        this.notify('pages.skineditor.messages.imported', 'success', {name});
    }

    async save(saveAs: boolean = false): Promise<boolean> {
        this.cancelStroke();
        const tabId = this.activeTabId;
        try {
            const bytes = writeNexSkin(this.doc);
            const path = this.filePath && this.filePath.toLowerCase().endsWith(NEXSKIN_EXTENSION) ? this.filePath : null;
            const saved = await saveSkinFile(this.baseFileName() + NEXSKIN_EXTENSION, bytes, path, saveAs || !path);
            if (!saved) return false;
            if (tabId === this.activeTabId) {
                this.filePath = saved.path;
                this.fileName = saved.name;
                this.dirty = false;
                this.stashTab();
            } else {
                const tab = this.tabs.find(t => t.id === tabId);
                if (tab) {
                    tab.filePath = saved.path;
                    tab.fileName = saved.name;
                    tab.dirty = false;
                }
            }
            this.version++;
            this.scheduleDraft();
            this.notify('pages.skineditor.messages.saved', 'success', {name: saved.name});
            return true;
        } catch (error) {
            console.error('[SkinEditor] save failed', error);
            this.notify('pages.skineditor.messages.saveFailed', 'error', {error: String((error as Error)?.message ?? error)});
            return false;
        }
    }

    async exportPng(): Promise<boolean> {
        this.cancelStroke();
        try {
            const warnings = analyzeComposite(this.composite, this.layout);
            const bytes = encodePng(this.composite, this.layout.width, this.layout.height);
            const saved = await saveSkinFile(this.baseFileName() + '.png', bytes, null, true);
            if (!saved) return false;
            if (warnings.transparentBasePixels > 0) {
                this.notify('pages.skineditor.messages.exportedTransparent', 'warning', {count: warnings.transparentBasePixels});
            } else {
                this.notify('pages.skineditor.messages.exported', 'success', {name: saved.name});
            }
            return true;
        } catch (error) {
            console.error('[SkinEditor] export failed', error);
            this.notify('pages.skineditor.messages.saveFailed', 'error', {error: String((error as Error)?.message ?? error)});
            return false;
        }
    }

    private collectDraftTabs(): DraftTab[] {
        this.stashTab();
        const out: DraftTab[] = [];
        for (const tab of this.tabs) {
            if (!tab.dirty) continue;
            try {
                out.push({name: tab.fileName ?? tab.doc.name, path: tab.filePath, bytes: writeNexSkin(tab.doc)});
            } catch (error) {
                console.warn('[SkinEditor] draft failed', error);
            }
        }
        return out;
    }

    private writeDraft() {
        const tabs = this.collectDraftTabs();
        if (tabs.length) void saveDraft({savedAt: Date.now(), tabs});
        else void clearDraft();
    }

    private scheduleDraft() {
        if (this.draftTimer !== null) clearTimeout(this.draftTimer);
        this.draftTimer = window.setTimeout(() => {
            this.draftTimer = null;
            this.writeDraft();
        }, 2500);
    }

    async restoreDraft(): Promise<boolean> {
        const draft = await loadDraft();
        if (!draft) return false;
        let restored = 0;
        for (const tab of draft.tabs) {
            try {
                this.openTab(readNexSkin(tab.bytes), tab.path, tab.name, true);
                restored++;
            } catch {
                // skip broken drafts
            }
        }
        if (!restored) void clearDraft();
        return restored > 0;
    }

    discardDraft() {
        void clearDraft();
    }

    dispose() {
        if (this.draftTimer !== null) {
            clearTimeout(this.draftTimer);
            this.draftTimer = null;
            this.writeDraft();
        }
        if (this.messageTimer !== null) clearTimeout(this.messageTimer);
    }

    selectToolByKey(letter: string, cycle: boolean): boolean {
        const group = TOOLS.filter(tool => tool.key.toLowerCase() === letter.toLowerCase());
        if (!group.length) return false;
        const current = group.findIndex(tool => tool.id === this.tool);
        let next: ToolId;
        if (cycle && current >= 0) next = group[(current + 1) % group.length]!.id;
        else next = this.lastToolOfGroup[group[0]!.key] ?? group[0]!.id;
        this.setTool(next);
        return true;
    }

    setTool(tool: ToolId) {
        this.tool = tool;
        const info = TOOLS.find(t => t.id === tool);
        if (info) this.lastToolOfGroup = {...this.lastToolOfGroup, [info.key]: tool};
    }

    get navigating(): boolean {
        return this.navigationHeld || this.tool === 'hand';
    }

    requestView(kind: ViewRequest) {
        this.viewRequest = {kind, serial: (this.viewRequest?.serial ?? 0) + 1};
    }

    resetColors() {
        this.primaryColor = pack(0, 0, 0);
        this.secondaryColor = pack(255, 255, 255);
    }

    groupActive() {
        const location = this.doc.find(this.activeLayerId);
        if (!location) return;
        this.structural('pages.skineditor.history.group', () => {
            const group = createGroup(this.translate('pages.skineditor.layers.defaultGroup'), [location.node]);
            location.siblings.splice(location.index, 1, group);
            this.activeLayerId = group.id;
        });
    }

    ungroupActive() {
        let location = this.doc.find(this.activeLayerId);
        if (location && location.node.kind !== 'group' && location.parent) location = this.doc.find(location.parent.id);
        if (!location || location.node.kind !== 'group') return;
        const group = location.node;
        this.structural('pages.skineditor.history.ungroup', () => {
            location!.siblings.splice(location!.index, 1, ...group.children);
            if (this.activeLayerId === group.id) this.activeLayerId = group.children[0]?.id ?? null;
        });
    }

    layerVia(cut: boolean) {
        const layer = this.activeLayer;
        if (!layer) return;
        const location = this.doc.find(layer.id)!;
        if (!this.selection) {
            if (!cut) this.duplicateNode(layer.id);
            return;
        }
        const rect = this.selection;
        this.structural(cut ? 'pages.skineditor.history.layerViaCut' : 'pages.skineditor.history.layerViaCopy', () => {
            const count = this.layout.width * this.layout.height;
            const source = new Uint32Array(layer.pixels.buffer, layer.pixels.byteOffset, count);
            const copy = createPixelLayer(this.nextLayerName(), layer.target, this.doc.width, this.doc.height);
            const target = new Uint32Array(copy.pixels.buffer);
            for (let y = rect.y; y < rect.y + rect.h; y++) {
                for (let x = rect.x; x < rect.x + rect.w; x++) {
                    const storage = atlasToStorage(this.layout, layer.target, y * this.layout.width + x);
                    if (storage < 0) continue;
                    target[storage] = source[storage]!;
                    if (cut) source[storage] = 0;
                }
            }
            copy.blend = layer.blend;
            location.siblings.splice(location.index, 0, copy);
            this.activeLayerId = copy.id;
        });
    }

    mergeVisible() {
        const flat = this.doc.allLayers().filter(layer => this.doc.isEffectivelyVisible(layer.id));
        if (flat.length < 2) {
            this.notify('pages.skineditor.messages.mergeImpossible', 'warning');
            return;
        }
        this.structural('pages.skineditor.history.mergeVisible', () => {
            const merged = createPixelLayer(this.translate('pages.skineditor.layers.merged'), 'atlas', this.doc.width, this.doc.height,
                compositeDocument(this.doc, this.layout));
            const ids = new Set(flat.map(layer => layer.id));
            const topmost = this.doc.find(flat[0]!.id)!;
            topmost.siblings.splice(topmost.index, 0, merged);
            const prune = (nodes: LayerNode[]): LayerNode[] => nodes
                .filter(node => !ids.has(node.id))
                .map(node => node.kind === 'group' ? {...node, children: prune(node.children)} : node)
                .filter(node => node.kind !== 'group' || node.children.length > 0);
            this.doc.layers = prune(this.doc.layers);
            this.activeLayerId = merged.id;
        });
    }

    moveNodeToEnd(id: string, end: 'top' | 'bottom') {
        const location = this.doc.find(id);
        if (!location) return;
        const targetIndex = end === 'top' ? 0 : location.siblings.length - 1;
        if (targetIndex === location.index) return;
        this.structural('pages.skineditor.history.move', () => {
            const [node] = location.siblings.splice(location.index, 1);
            location.siblings.splice(targetIndex, 0, node!);
        });
    }

    selectAdjacentNode(direction: -1 | 1) {
        const rows: LayerNode[] = [];
        const walk = (nodes: LayerNode[]) => {
            for (const node of nodes) {
                rows.push(node);
                if (node.kind === 'group' && !node.collapsed) walk(node.children);
            }
        };
        walk(this.doc.layers);
        const index = rows.findIndex(node => node.id === this.activeLayerId);
        const next = rows[Math.max(0, Math.min(rows.length - 1, index + direction))];
        if (next) this.activeLayerId = next.id;
    }

    fillSelection(color: PackedColor) {
        const layer = this.canStartStroke();
        if (!layer) return;
        this.stroke = new PixelStroke(layer);
        const count = this.layout.width * this.layout.height;
        for (let i = 0; i < count; i++) {
            const storage = this.paintableStorage(i, undefined, false);
            if (storage >= 0) this.stroke.set(storage, color);
        }
        this.finishStroke('pages.skineditor.history.fill');
    }

    setActiveOpacity(digit: number) {
        const node = this.activeNode;
        if (!node) return;
        this.setNodeProperty(node.id, 'opacity', digit === 0 ? 1 : digit / 10);
    }

    notify(key: string, kind: EditorMessage['kind'] = 'info', params?: Record<string, unknown>) {
        this.message = {key, kind, params};
        if (this.messageTimer !== null) clearTimeout(this.messageTimer);
        this.messageTimer = window.setTimeout(() => {
            this.message = null;
            this.messageTimer = null;
        }, kind === 'error' || kind === 'warning' ? 6000 : 3000);
    }

    handleKey(event: KeyboardEvent): boolean {
        const key = event.key.toLowerCase();
        const code = event.code;
        const ctrl = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;
        const alt = event.altKey;
        const digit = /^(Digit|Numpad)[0-9]$/.test(code) ? Number(code.slice(-1)) : null;
        const bracket = key === '[' || (code === 'BracketLeft' && key !== '+') ? '['
            : key === ']' || (code === 'BracketRight' && key !== '+') ? ']' : null;

        if (ctrl && !alt) {
            if (key === '+' || key === '=' || code === 'NumpadAdd') {
                this.requestView('zoomIn');
                return true;
            }
            if (key === '-' || code === 'NumpadSubtract') {
                this.requestView('zoomOut');
                return true;
            }
            if (digit === 0) {
                this.requestView('fit');
                return true;
            }
            if (bracket) {
                const id = this.activeLayerId;
                if (!id) return true;
                if (shift) this.moveNodeToEnd(id, bracket === ']' ? 'top' : 'bottom');
                else this.moveNodeStep(id, bracket === ']' ? -1 : 1);
                return true;
            }
            switch (key) {
                case 'z':
                    if (shift) this.redo();
                    else this.undo();
                    return true;
                case 'y':
                    this.redo();
                    return true;
                case 's':
                    void this.save(shift);
                    return true;
                case 'o':
                    void this.open();
                    return true;
                case 'n':
                    if (shift) {
                        this.addLayer();
                        return true;
                    }
                    return false;
                case 'j':
                    this.layerVia(shift);
                    return true;
                case 'e':
                    if (shift) this.mergeVisible();
                    else if (this.activeLayerId) this.mergeDown(this.activeLayerId);
                    return true;
                case 'g':
                    if (shift) this.ungroupActive();
                    else this.groupActive();
                    return true;
                case 'a':
                    this.selectAll();
                    return true;
                case 'd':
                    this.deselect();
                    return true;
                case 'c':
                    this.copySelection(false);
                    return true;
                case 'x':
                    this.copySelection(true);
                    return true;
                case 'v':
                    this.paste();
                    return true;
                case "'":
                case '#':
                    this.grid = !this.grid;
                    return true;
                case 'h':
                    this.guides = !this.guides;
                    return true;
                case 'backspace':
                case 'delete':
                    this.fillSelection(this.secondaryColor);
                    return true;
            }
            return false;
        }

        if (ctrl && alt) {
            if (key === 'z') {
                this.undo();
                return true;
            }
            if (shift && (key === 'w' || key === 's')) {
                void this.exportPng();
                return true;
            }
            return false;
        }

        if (alt) {
            if (digit !== null && digit <= 6) {
                if (digit === 0) this.selectAllParts();
                else this.selectPart(PART_IDS[digit - 1]!, shift);
                return true;
            }
            if (bracket) {
                this.selectAdjacentNode(bracket === ']' ? -1 : 1);
                return true;
            }
            if (key === 'backspace' || key === 'delete') {
                this.fillSelection(this.primaryColor);
                return true;
            }
            if (key === 's') {
                this.mirror = !this.mirror;
                return true;
            }
            return false;
        }

        switch (key) {
            case 'delete':
            case 'backspace':
                this.deleteSelection();
                return true;
            case 'escape':
                this.deselect();
                return true;
            case 'tab':
                this.panelsHidden = !this.panelsHidden;
                return true;
            case 'f':
                this.viewMode = this.viewMode === 'split' ? '3d' : this.viewMode === '3d' ? '2d' : 'split';
                return true;
            case 'x':
                this.swapColors();
                return true;
            case 'd':
                this.resetColors();
                return true;
        }
        if (bracket) {
            this.brushSize = Math.max(1, Math.min(8, this.brushSize + (bracket === ']' ? 1 : -1)));
            return true;
        }
        if (digit !== null) {
            this.setActiveOpacity(digit);
            return true;
        }
        if (this.tool === 'move' || this.selection) {
            const arrows: Record<string, [number, number]> = {arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1]};
            const arrow = arrows[key];
            if (arrow) {
                const step = shift ? 4 : 1;
                this.nudge(arrow[0] * step, arrow[1] * step);
                return true;
            }
        }
        if (/^[a-z]$/.test(key)) return this.selectToolByKey(key, shift);
        return false;
    }
}

export function detectModel(rgba: Uint8ClampedArray, width: number, height: number): 'classic' | 'slim' {
    if (width !== 64 || height < 32) return 'classic';
    for (let y = 20; y < 32; y++) {
        for (const x of [54, 55]) {
            if (rgba[(y * width + x) * 4 + 3] !== 0) return 'classic';
        }
    }
    return 'slim';
}

export function colorAt(editor: SkinEditor, x: number, y: number): PackedColor {
    const i = (y * editor.layout.width + x) * 4;
    const c = editor.composite;
    return pack(c[i]!, c[i + 1]!, c[i + 2]!, c[i + 3]!);
}


export function createSkinEditor(): SkinEditor {
    return shallowReactive(new SkinEditor()) as SkinEditor;
}
