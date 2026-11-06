import type {BlendMode, LayerTarget, SkinFormat, SkinModel} from "./types.ts";
import {skinHeight} from "./layout.ts";

export interface LayerNodeBase {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
}

export interface PixelLayer extends LayerNodeBase {
    kind: 'layer';
    target: LayerTarget;
    blend: BlendMode;
    clip: boolean;
    pixels: Uint8ClampedArray;
}

export interface LayerGroup extends LayerNodeBase {
    kind: 'group';
    collapsed: boolean;
    children: LayerNode[];
}

export type LayerNode = PixelLayer | LayerGroup;

export interface NodeLocation {
    node: LayerNode;
    siblings: LayerNode[];
    index: number;
    parent: LayerGroup | null;
}

export interface DocumentSnapshot {
    name: string;
    format: SkinFormat;
    model: SkinModel;
    layers: LayerNode[];
}

let idCounter = 0;

export function createId(): string {
    idCounter++;
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    }
    return Date.now().toString(36) + idCounter.toString(36) + Math.random().toString(36).substring(2, 6);
}

export function createPixelLayer(name: string, target: LayerTarget, width: number, height: number, pixels?: Uint8ClampedArray): PixelLayer {
    return {
        id: createId(),
        kind: 'layer',
        name,
        visible: true,
        locked: false,
        opacity: 1,
        target,
        blend: 'normal',
        clip: false,
        pixels: pixels ?? new Uint8ClampedArray(width * height * 4)
    };
}

export function createGroup(name: string, children: LayerNode[] = []): LayerGroup {
    return {
        id: createId(),
        kind: 'group',
        name,
        visible: true,
        locked: false,
        opacity: 1,
        collapsed: false,
        children
    };
}

export function cloneNode(node: LayerNode, keepIds: boolean = true): LayerNode {
    if (node.kind === 'layer') {
        return {...node, id: keepIds ? node.id : createId(), pixels: new Uint8ClampedArray(node.pixels)};
    }
    return {...node, id: keepIds ? node.id : createId(), children: node.children.map(child => cloneNode(child, keepIds))};
}

export class SkinDocument {

    name: string;
    format: SkinFormat;
    model: SkinModel;
    layers: LayerNode[];

    constructor(name: string, format: SkinFormat, model: SkinModel, layers: LayerNode[] = []) {
        this.name = name;
        this.format = format;
        this.model = model;
        this.layers = layers;
    }

    get width(): number {
        return 64;
    }

    get height(): number {
        return skinHeight(this.format);
    }

    static createEmpty(name: string, format: SkinFormat = 'modern', model: SkinModel = 'classic', layerName: string = 'Layer 1'): SkinDocument {
        const doc = new SkinDocument(name, format, model);
        doc.layers.push(createPixelLayer(layerName, 'base', 64, skinHeight(format)));
        return doc;
    }

    static fromImage(name: string, rgba: Uint8ClampedArray, width: number, height: number, model: SkinModel, layerName: string): SkinDocument {
        if (width !== 64 || (height !== 64 && height !== 32)) {
            throw new Error(`Unsupported skin size ${width}x${height}, expected 64x64 or 64x32`);
        }
        const format: SkinFormat = height === 32 ? 'legacy' : 'modern';
        const doc = new SkinDocument(name, format, model);
        doc.layers.push(createPixelLayer(layerName, 'atlas', width, height, new Uint8ClampedArray(rgba)));
        return doc;
    }

    find(id: string | null | undefined): NodeLocation | null {
        if (!id) return null;
        const search = (siblings: LayerNode[], parent: LayerGroup | null): NodeLocation | null => {
            for (let i = 0; i < siblings.length; i++) {
                const node = siblings[i]!;
                if (node.id === id) return {node, siblings, index: i, parent};
                if (node.kind === 'group') {
                    const found = search(node.children, node);
                    if (found) return found;
                }
            }
            return null;
        };
        return search(this.layers, null);
    }

    findLayer(id: string | null | undefined): PixelLayer | null {
        const location = this.find(id);
        return location && location.node.kind === 'layer' ? location.node : null;
    }

    allLayers(): PixelLayer[] {
        const out: PixelLayer[] = [];
        const walk = (nodes: LayerNode[]) => {
            for (const node of nodes) {
                if (node.kind === 'layer') out.push(node);
                else walk(node.children);
            }
        };
        walk(this.layers);
        return out;
    }

    isEffectivelyLocked(id: string): boolean {
        let location = this.find(id);
        while (location) {
            if (location.node.locked) return true;
            location = location.parent ? this.find(location.parent.id) : null;
        }
        return false;
    }

    isEffectivelyVisible(id: string): boolean {
        let location = this.find(id);
        while (location) {
            if (!location.node.visible) return false;
            location = location.parent ? this.find(location.parent.id) : null;
        }
        return true;
    }

    contains(ancestorId: string, id: string): boolean {
        if (ancestorId === id) return true;
        const ancestor = this.find(ancestorId);
        if (!ancestor || ancestor.node.kind !== 'group') return false;
        const walk = (nodes: LayerNode[]): boolean => nodes.some(node => node.id === id || (node.kind === 'group' && walk(node.children)));
        return walk(ancestor.node.children);
    }

    snapshot(): DocumentSnapshot {
        return {
            name: this.name,
            format: this.format,
            model: this.model,
            layers: this.layers.map(node => cloneNode(node))
        };
    }

    restore(snapshot: DocumentSnapshot) {
        this.name = snapshot.name;
        this.format = snapshot.format;
        this.model = snapshot.model;
        this.layers = snapshot.layers.map(node => cloneNode(node));
    }
}
