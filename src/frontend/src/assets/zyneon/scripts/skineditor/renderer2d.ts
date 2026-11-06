import type {Rect} from "./types.ts";
import type {SkinLayout} from "./layout.ts";
import {maskOutline} from "./selection.ts";

export class SkinRenderer2D {

    readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly resizeObserver: ResizeObserver;
    private readonly atlasCanvas = document.createElement('canvas');
    private readonly maskCanvas = document.createElement('canvas');

    private layout: SkinLayout | null = null;
    private composite: Uint8ClampedArray | null = null;
    private editable: Uint8Array | null = null;
    private hover: { x: number, y: number, size: number } | null = null;
    private selection: Rect | null = null;
    private selectionOutline: number[] | null = null;
    private lasso: { x: number, y: number }[] = [];
    private problems: Uint8Array | null = null;
    private grid = true;
    private guides = true;
    private renderQueued = false;
    private disposed = false;
    private userMovedView = false;

    zoom = 8;
    panX = 0;
    panY = 0;

    constructor(container: HTMLElement) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'skin-editor-canvas-2d';
        container.appendChild(this.canvas);
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D is not available');
        this.context = context;
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container);
        this.resize();
    }

    private resize() {
        const parent = this.canvas.parentElement;
        if (!parent || this.disposed) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, parent.clientWidth), height = Math.max(1, parent.clientHeight);
        this.canvas.width = Math.round(width * ratio);
        this.canvas.height = Math.round(height * ratio);
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        if (!this.userMovedView) this.fit();
        this.requestRender();
    }

    private get viewWidth(): number {
        return this.canvas.clientWidth || 1;
    }

    private get viewHeight(): number {
        return this.canvas.clientHeight || 1;
    }

    fit() {
        const width = this.layout?.width ?? 64, height = this.layout?.height ?? 64;
        const zoom = Math.max(1, Math.floor(Math.min((this.viewWidth - 32) / width, (this.viewHeight - 32) / height)));
        this.zoom = zoom;
        this.panX = Math.round((this.viewWidth - width * zoom) / 2);
        this.panY = Math.round((this.viewHeight - height * zoom) / 2);
        this.userMovedView = false;
        this.requestRender();
    }

    zoomAt(clientX: number, clientY: number, factor: number) {
        const rect = this.canvas.getBoundingClientRect();
        const px = clientX - rect.left, py = clientY - rect.top;
        const scaled = Math.round(this.zoom * factor);
        const stepped = factor > 1 ? Math.max(this.zoom + 1, scaled) : Math.min(this.zoom - 1, scaled);
        const next = Math.max(1, Math.min(64, stepped));
        if (next === this.zoom) return;
        // keep the atlas point under the cursor in place
        const ax = (px - this.panX) / this.zoom, ay = (py - this.panY) / this.zoom;
        this.zoom = next;
        this.panX = px - ax * next;
        this.panY = py - ay * next;
        this.userMovedView = true;
        this.requestRender();
    }

    panBy(dx: number, dy: number) {
        this.panX += dx;
        this.panY += dy;
        this.userMovedView = true;
        this.requestRender();
    }

    screenToAtlas(clientX: number, clientY: number): { x: number, y: number } | null {
        if (!this.layout) return null;
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left - this.panX) / this.zoom);
        const y = Math.floor((clientY - rect.top - this.panY) / this.zoom);
        if (x < 0 || y < 0 || x >= this.layout.width || y >= this.layout.height) return null;
        return {x, y};
    }

    setLayout(layout: SkinLayout) {
        const sizeChanged = !this.layout || this.layout.height !== layout.height;
        this.layout = layout;
        this.atlasCanvas.width = this.maskCanvas.width = layout.width;
        this.atlasCanvas.height = this.maskCanvas.height = layout.height;
        if (sizeChanged && !this.userMovedView) this.fit();
        if (this.composite) this.drawAtlas();
        if (this.editable) this.drawMask();
        this.requestRender();
    }

    setComposite(composite: Uint8ClampedArray) {
        this.composite = composite;
        this.drawAtlas();
        this.requestRender();
    }

    setEditable(editable: Uint8Array) {
        this.editable = editable;
        this.drawMask();
        this.requestRender();
    }

    setHover(hover: { x: number, y: number, size: number } | null) {
        const same = hover === this.hover || (hover && this.hover && hover.x === this.hover.x && hover.y === this.hover.y && hover.size === this.hover.size);
        if (same) return;
        this.hover = hover;
        this.requestRender();
    }

    setSelection(selection: Rect | null, mask: Uint8Array | null = null) {
        this.selection = selection;
        this.selectionOutline = selection && mask && this.layout ? maskOutline(mask, this.layout.width, this.layout.height) : null;
        this.requestRender();
    }

    setLasso(points: { x: number, y: number }[]) {
        this.lasso = points;
        this.requestRender();
    }

    setProblems(problems: Uint8Array | null) {
        this.problems = problems;
        this.requestRender();
    }

    setGrid(grid: boolean, guides: boolean) {
        this.grid = grid;
        this.guides = guides;
        this.requestRender();
    }

    private drawAtlas() {
        const layout = this.layout, composite = this.composite;
        if (!layout || !composite || composite.length !== layout.width * layout.height * 4) return;
        const context = this.atlasCanvas.getContext('2d');
        if (!context) return;
        context.putImageData(new ImageData(new Uint8ClampedArray(composite), layout.width, layout.height), 0, 0);
    }

    private drawMask() {
        const layout = this.layout, editable = this.editable;
        if (!layout || !editable || editable.length !== layout.width * layout.height) return;
        const context = this.maskCanvas.getContext('2d');
        if (!context) return;
        const data = new Uint8ClampedArray(layout.width * layout.height * 4);
        for (let i = 0; i < editable.length; i++) {
            if (editable[i]) continue;
            // not editable: darken, unused pixels a bit more
            data[i * 4 + 3] = layout.pixelActive[i] ? 115 : 190;
        }
        context.putImageData(new ImageData(data, layout.width, layout.height), 0, 0);
    }

    requestRender() {
        if (this.renderQueued || this.disposed) return;
        this.renderQueued = true;
        requestAnimationFrame(() => {
            this.renderQueued = false;
            if (!this.disposed) this.render();
        });
    }

    private render() {
        const context = this.context;
        const ratio = this.canvas.width / this.viewWidth;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const layout = this.layout;
        if (!layout) return;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.imageSmoothingEnabled = false;

        const zoom = this.zoom;
        const x0 = Math.round(this.panX), y0 = Math.round(this.panY);
        const width = layout.width * zoom, height = layout.height * zoom;

        const tile = Math.max(4, Math.round(zoom / 2));
        context.save();
        context.beginPath();
        context.rect(x0, y0, width, height);
        context.clip();
        context.fillStyle = '#2b2b31';
        context.fillRect(x0, y0, width, height);
        context.fillStyle = '#35353c';
        for (let ty = 0; ty * tile < height; ty++) {
            for (let tx = (ty % 2); tx * tile < width; tx += 2) {
                context.fillRect(x0 + tx * tile, y0 + ty * tile, tile, tile);
            }
        }
        context.restore();

        context.drawImage(this.atlasCanvas, x0, y0, width, height);
        if (this.editable) context.drawImage(this.maskCanvas, x0, y0, width, height);

        if (this.grid && zoom >= 6) {
            context.beginPath();
            for (let x = 0; x <= layout.width; x++) {
                context.moveTo(x0 + x * zoom + 0.5, y0);
                context.lineTo(x0 + x * zoom + 0.5, y0 + height);
            }
            for (let y = 0; y <= layout.height; y++) {
                context.moveTo(x0, y0 + y * zoom + 0.5);
                context.lineTo(x0 + width, y0 + y * zoom + 0.5);
            }
            context.strokeStyle = 'rgba(255,255,255,0.06)';
            context.lineWidth = 1;
            context.stroke();
        }

        if (this.guides) {
            context.beginPath();
            for (const box of layout.boxes) {
                for (const face of box.faces) {
                    const r = face.rect;
                    if (r.y >= layout.height) continue;
                    context.rect(x0 + r.x * zoom + 0.5, y0 + r.y * zoom + 0.5, r.w * zoom - 1, r.h * zoom - 1);
                }
            }
            context.strokeStyle = 'rgba(160,120,255,0.35)';
            context.lineWidth = 1;
            context.stroke();
        }

        context.strokeStyle = 'rgba(255,255,255,0.25)';
        context.strokeRect(x0 - 0.5, y0 - 0.5, width + 1, height + 1);

        if (this.problems) {
            context.save();
            context.strokeStyle = 'rgba(255,70,70,0.9)';
            context.lineWidth = 1;
            for (let i = 0; i < this.problems.length; i++) {
                if (!this.problems[i]) continue;
                const px = x0 + (i % layout.width) * zoom, py = y0 + Math.floor(i / layout.width) * zoom;
                context.fillStyle = 'rgba(255,40,40,0.28)';
                context.fillRect(px, py, zoom, zoom);
                context.beginPath();
                context.moveTo(px, py + zoom);
                context.lineTo(px + zoom, py);
                context.stroke();
            }
            context.restore();
        }

        if (this.lasso.length > 1) {
            context.beginPath();
            this.lasso.forEach((point, index) => {
                const px = x0 + (point.x + 0.5) * zoom, py = y0 + (point.y + 0.5) * zoom;
                if (index === 0) context.moveTo(px, py);
                else context.lineTo(px, py);
            });
            context.closePath();
            context.setLineDash([4, 4]);
            context.strokeStyle = '#fff';
            context.lineWidth = 1;
            context.stroke();
            context.setLineDash([]);
        }

        if (this.selection && this.selectionOutline) {
            const segments = this.selectionOutline;
            context.beginPath();
            for (let i = 0; i < segments.length; i += 4) {
                context.moveTo(x0 + segments[i]! * zoom + 0.5, y0 + segments[i + 1]! * zoom + 0.5);
                context.lineTo(x0 + segments[i + 2]! * zoom + 0.5, y0 + segments[i + 3]! * zoom + 0.5);
            }
            context.lineWidth = 1;
            context.setLineDash([4, 4]);
            context.strokeStyle = '#000';
            context.stroke();
            context.lineDashOffset = 4;
            context.strokeStyle = '#fff';
            context.stroke();
            context.setLineDash([]);
            context.lineDashOffset = 0;
        } else if (this.selection) {
            const s = this.selection;
            const sx = x0 + s.x * zoom + 0.5, sy = y0 + s.y * zoom + 0.5;
            context.lineWidth = 1;
            context.setLineDash([4, 4]);
            context.strokeStyle = '#000';
            context.strokeRect(sx, sy, s.w * zoom - 1, s.h * zoom - 1);
            context.lineDashOffset = 4;
            context.strokeStyle = '#fff';
            context.strokeRect(sx, sy, s.w * zoom - 1, s.h * zoom - 1);
            context.setLineDash([]);
            context.lineDashOffset = 0;
        }

        if (this.hover) {
            const size = this.hover.size;
            const start = -Math.floor((size - 1) / 2);
            const hx = x0 + (this.hover.x + start) * zoom, hy = y0 + (this.hover.y + start) * zoom;
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(0,0,0,0.8)';
            context.strokeRect(hx - 0.5, hy - 0.5, size * zoom + 1, size * zoom + 1);
            context.strokeStyle = '#fff';
            context.strokeRect(hx + 0.5, hy + 0.5, size * zoom - 1, size * zoom - 1);
        }
    }

    dispose() {
        this.disposed = true;
        this.resizeObserver.disconnect();
        this.canvas.remove();
    }
}
