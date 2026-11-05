import {
    BufferAttribute,
    BufferGeometry,
    DataTexture,
    DoubleSide,
    FrontSide,
    Group,
    LineBasicMaterial,
    LineLoop,
    Mesh,
    MeshBasicMaterial,
    MOUSE,
    NearestFilter,
    PerspectiveCamera,
    Raycaster,
    RGBAFormat,
    Scene,
    SRGBColorSpace,
    UnsignedByteType,
    Vector2,
    Vector3,
    WebGLRenderer
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import type {LayerTarget, PartId} from "./types.ts";
import {type BoxDef, inflatedFacePoint, type SkinLayout} from "./layout.ts";
import type {HiddenPartMode} from "./editor.ts";

export interface Hit3D {
    x: number;
    y: number;
    part: PartId;
    box: BoxDef;
    faceIndex: number;
}

export interface PartViewState {
    selected: PartId[];
    overlay: Record<PartId, boolean>;
    mode: HiddenPartMode;
}

export type CameraPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'iso';

const FACE_SHADE: Record<string, number> = {top: 1, bottom: 0.55, front: 0.86, back: 0.86, right: 0.72, left: 0.72};

const TARGET_Y = 16;

export class SkinRenderer3D {

    readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene = new Scene();
    private readonly camera = new PerspectiveCamera(32, 1, 1, 1000);
    private readonly controls: OrbitControls;
    private readonly raycaster = new Raycaster();
    private readonly model = new Group();
    private readonly hoverLine: LineLoop;
    private readonly resizeObserver: ResizeObserver;

    private layout: SkinLayout | null = null;
    private texture: DataTexture | null = null;
    private textureData: Uint8Array | null = null;
    private meshes: Mesh[] = [];
    private baseMaterial: MeshBasicMaterial | null = null;
    private overlayMaterial: MeshBasicMaterial | null = null;
    private ghostMaterial: MeshBasicMaterial | null = null;
    private lockedMaterial: MeshBasicMaterial | null = null;
    private lockedOverlayMaterial: MeshBasicMaterial | null = null;
    private partState: PartViewState | null = null;
    private shading = true;
    private renderQueued = false;
    private disposed = false;

    constructor(container: HTMLElement) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'skin-editor-canvas-3d';
        container.appendChild(this.canvas);

        this.renderer = new WebGLRenderer({canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'low-power'});
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = SRGBColorSpace;

        this.scene.add(this.model);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.target.set(0, TARGET_Y, 0);
        this.controls.enableDamping = false;
        this.controls.minDistance = 25;
        this.controls.maxDistance = 220;
        this.controls.rotateSpeed = 0.9;
        this.controls.zoomSpeed = 1.2;
        this.setLeftMouseNavigation(false);
        this.controls.addEventListener('change', () => this.requestRender());

        const lineGeometry = new BufferGeometry();
        lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(12), 3));
        this.hoverLine = new LineLoop(lineGeometry, new LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.9, depthTest: true}));
        this.hoverLine.visible = false;
        this.hoverLine.renderOrder = 10;
        this.scene.add(this.hoverLine);

        this.setCameraPreset('iso');

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container);
        this.resize();
    }

    static isSupported(): boolean {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
        } catch {
            return false;
        }
    }

    setLeftMouseNavigation(navigate: boolean) {
        this.controls.mouseButtons = {
            LEFT: navigate ? MOUSE.ROTATE : null,
            MIDDLE: MOUSE.PAN,
            RIGHT: MOUSE.ROTATE
        };
    }

    setCameraPreset(preset: CameraPreset) {
        const distance = 78;
        const positions: Record<CameraPreset, [number, number, number]> = {
            front: [0, TARGET_Y, distance],
            back: [0, TARGET_Y, -distance],
            left: [distance, TARGET_Y, 0],
            right: [-distance, TARGET_Y, 0],
            top: [0, TARGET_Y + distance, 0.01],
            iso: [distance * 0.55, TARGET_Y + distance * 0.3, distance * 0.78]
        };
        const [x, y, z] = positions[preset];
        this.camera.position.set(x, y, z);
        this.controls.target.set(0, TARGET_Y, 0);
        this.controls.update();
        this.requestRender();
    }

    private resize() {
        const parent = this.canvas.parentElement;
        if (!parent || this.disposed) return;
        const width = Math.max(1, parent.clientWidth);
        const height = Math.max(1, parent.clientHeight);
        this.renderer.setSize(width, height, false);
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.requestRender();
    }

    setLayout(layout: SkinLayout) {
        if (this.layout === layout) return;
        const sizeChanged = !this.layout || this.layout.width !== layout.width || this.layout.height !== layout.height;
        this.layout = layout;
        if (sizeChanged) this.createTexture(layout.width, layout.height);
        this.buildMeshes();
        this.applyPartState();
    }

    private createTexture(width: number, height: number) {
        this.texture?.dispose();
        this.textureData = new Uint8Array(width * height * 4);
        this.texture = new DataTexture(this.textureData, width, height, RGBAFormat, UnsignedByteType);
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = NearestFilter;
        this.texture.generateMipmaps = false;
        this.texture.flipY = false;
        this.texture.colorSpace = SRGBColorSpace;
        this.texture.needsUpdate = true;

        for (const material of [this.baseMaterial, this.overlayMaterial, this.ghostMaterial, this.lockedMaterial, this.lockedOverlayMaterial]) material?.dispose();
        this.baseMaterial = new MeshBasicMaterial({map: this.texture, vertexColors: true, side: FrontSide});
        this.overlayMaterial = new MeshBasicMaterial({map: this.texture, vertexColors: true, side: DoubleSide, transparent: true, alphaTest: 0.004});
        this.ghostMaterial = new MeshBasicMaterial({map: this.texture, vertexColors: true, side: FrontSide, transparent: true, opacity: 0.16, depthWrite: false});
        this.lockedMaterial = new MeshBasicMaterial({map: this.texture, vertexColors: true, side: FrontSide, color: 0x5c5c66});
        this.lockedOverlayMaterial = new MeshBasicMaterial({map: this.texture, vertexColors: true, side: DoubleSide, transparent: true, alphaTest: 0.004, color: 0x5c5c66});
    }

    private buildMeshes() {
        for (const mesh of this.meshes) {
            this.model.remove(mesh);
            mesh.geometry.dispose();
        }
        this.meshes = [];
        const layout = this.layout;
        if (!layout) return;
        for (const box of layout.boxes) {
            const geometry = buildBoxGeometry(box, layout, this.shading);
            const mesh = new Mesh(geometry, box.kind === 'overlay' ? this.overlayMaterial! : this.baseMaterial!);
            mesh.userData = {box};
            mesh.renderOrder = box.kind === 'overlay' ? 2 : 1;
            this.meshes.push(mesh);
            this.model.add(mesh);
        }
        this.requestRender();
    }

    setShading(enabled: boolean) {
        if (this.shading === enabled) return;
        this.shading = enabled;
        for (const mesh of this.meshes) {
            const box = mesh.userData.box as BoxDef;
            const colors = mesh.geometry.getAttribute('color') as BufferAttribute;
            box.faces.forEach((face, faceIndex) => {
                const value = enabled ? FACE_SHADE[face.dir] ?? 1 : 1;
                for (let v = 0; v < 4; v++) colors.setXYZ(faceIndex * 4 + v, value, value, value);
            });
            colors.needsUpdate = true;
        }
        this.requestRender();
    }

    updateTexture(composite: Uint8ClampedArray) {
        const layout = this.layout;
        const data = this.textureData;
        if (!layout || !data || !this.texture || data.length !== composite.length) return;
        const width = layout.width;
        for (let i = 0; i < layout.width * layout.height; i++) {
            const o = i * 4;
            const alpha = composite[o + 3]!;
            if (layout.pixelKind[i] === 1 && alpha < 255) {
                const x = i % width, y = Math.floor(i / width);
                const checker = (x + y) % 2 === 0 ? 92 : 70;
                const a = alpha / 255;
                data[o] = composite[o]! * a + checker * (1 - a);
                data[o + 1] = composite[o + 1]! * a + checker * (1 - a);
                data[o + 2] = composite[o + 2]! * a + checker * (1 - a);
                data[o + 3] = 255;
            } else {
                data[o] = composite[o]!;
                data[o + 1] = composite[o + 1]!;
                data[o + 2] = composite[o + 2]!;
                data[o + 3] = alpha;
            }
        }
        this.texture.needsUpdate = true;
        this.requestRender();
    }

    setPartState(state: PartViewState) {
        this.partState = state;
        this.applyPartState();
    }

    private applyPartState() {
        const state = this.partState;
        for (const mesh of this.meshes) {
            const box = mesh.userData.box as BoxDef;
            const selected = !state || state.selected.includes(box.part);
            const overlayOn = !state || state.overlay[box.part];
            const isOverlay = box.kind === 'overlay';
            mesh.visible = true;
            mesh.material = isOverlay ? this.overlayMaterial! : this.baseMaterial!;
            if (isOverlay && !overlayOn) {
                mesh.visible = false;
                continue;
            }
            if (selected || !state) continue;
            if (state.mode === 'hide') {
                mesh.visible = false;
            } else if (state.mode === 'ghost') {
                if (isOverlay) mesh.visible = false;
                else mesh.material = this.ghostMaterial!;
            } else {
                mesh.material = isOverlay ? this.lockedOverlayMaterial! : this.lockedMaterial!;
            }
        }
        this.requestRender();
    }

    pick(clientX: number, clientY: number, target: LayerTarget, composite: Uint8ClampedArray | null): Hit3D | null {
        const layout = this.layout;
        if (!layout) return null;
        const rect = this.canvas.getBoundingClientRect();
        const pointer = new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        this.raycaster.setFromCamera(pointer, this.camera);
        const state = this.partState;
        const candidates = this.meshes.filter(mesh => mesh.visible && mesh.material !== this.ghostMaterial);
        const hits = this.raycaster.intersectObjects(candidates, false);
        for (const hit of hits) {
            const box = (hit.object as Mesh).userData.box as BoxDef;
            if (!hit.uv || hit.faceIndex === undefined || hit.faceIndex === null) continue;
            const faceIndex = Math.floor(hit.faceIndex / 2);
            const face = box.faces[faceIndex];
            if (!face) continue;
            const x = clamp(Math.floor(hit.uv.x * layout.width), face.rect.x, face.rect.x + face.rect.w - 1);
            const y = clamp(Math.floor(hit.uv.y * layout.height), face.rect.y, face.rect.y + face.rect.h - 1);
            const locked = !!state && !state.selected.includes(box.part);

            if (box.kind === 'overlay') {
                if (target === 'base') continue;
                if (target === 'atlas') {
                    const alpha = composite ? composite[(y * layout.width + x) * 4 + 3]! : 255;
                    if (alpha === 0) continue;
                }
            } else if (target === 'overlay') {
                // the overlay shell of this part is hidden, nothing to paint on
                return null;
            }
            if (locked) return null;
            return {x, y, part: box.part, box, faceIndex};
        }
        return null;
    }

    pickPart(clientX: number, clientY: number): PartId | null {
        const rect = this.canvas.getBoundingClientRect();
        const pointer = new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        this.raycaster.setFromCamera(pointer, this.camera);
        const hits = this.raycaster.intersectObjects(this.meshes.filter(mesh => mesh.visible), false);
        const box = hits[0] ? (hits[0].object as Mesh).userData.box as BoxDef : null;
        return box?.part ?? null;
    }

    setHover(hit: Hit3D | null) {
        if (!hit) {
            if (this.hoverLine.visible) {
                this.hoverLine.visible = false;
                this.requestRender();
            }
            return;
        }
        const face = hit.box.faces[hit.faceIndex]!;
        const s = hit.x - face.rect.x, t = hit.y - face.rect.y;
        const lift = 0.02;
        const corners = [
            inflatedFacePoint(hit.box, face, s, t, 0),
            inflatedFacePoint(hit.box, face, s + 1, t, 0),
            inflatedFacePoint(hit.box, face, s + 1, t + 1, 0),
            inflatedFacePoint(hit.box, face, s, t + 1, 0)
        ];
        const positions = this.hoverLine.geometry.getAttribute('position') as BufferAttribute;
        corners.forEach((corner, i) => {
            positions.setXYZ(i, corner[0] + face.normal[0] * lift, corner[1] + face.normal[1] * lift, corner[2] + face.normal[2] * lift);
        });
        positions.needsUpdate = true;
        this.hoverLine.geometry.computeBoundingSphere();
        this.hoverLine.visible = true;
        this.requestRender();
    }

    requestRender() {
        if (this.renderQueued || this.disposed) return;
        this.renderQueued = true;
        requestAnimationFrame(() => {
            this.renderQueued = false;
            if (!this.disposed) this.renderer.render(this.scene, this.camera);
        });
    }

    dispose() {
        this.disposed = true;
        this.resizeObserver.disconnect();
        this.controls.dispose();
        for (const mesh of this.meshes) mesh.geometry.dispose();
        this.hoverLine.geometry.dispose();
        (this.hoverLine.material as LineBasicMaterial).dispose();
        for (const material of [this.baseMaterial, this.overlayMaterial, this.ghostMaterial, this.lockedMaterial, this.lockedOverlayMaterial]) material?.dispose();
        this.texture?.dispose();
        this.renderer.dispose();
        this.canvas.remove();
    }
}

function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

function buildBoxGeometry(box: BoxDef, layout: SkinLayout, shading: boolean): BufferGeometry {
    const positions = new Float32Array(6 * 4 * 3);
    const uvs = new Float32Array(6 * 4 * 2);
    const colors = new Float32Array(6 * 4 * 3);
    const indices: number[] = [];
    box.faces.forEach((face, faceIndex) => {
        const {w, h} = face.rect;
        const corners: [number, number][] = [[0, 0], [w, 0], [0, h], [w, h]];
        corners.forEach(([s, t], v) => {
            const p = inflatedFacePoint(box, face, s, t);
            const vertex = faceIndex * 4 + v;
            positions.set(p, vertex * 3);
            uvs[vertex * 2] = (face.rect.x + s) / layout.width;
            uvs[vertex * 2 + 1] = (face.rect.y + t) / layout.height;
            const value = shading ? FACE_SHADE[face.dir] ?? 1 : 1;
            colors.set([value, value, value], vertex * 3);
        });
        const base = faceIndex * 4;
        const a = new Vector3(...inflatedFacePoint(box, face, 0, 0));
        const b = new Vector3(...inflatedFacePoint(box, face, w, 0));
        const c = new Vector3(...inflatedFacePoint(box, face, 0, h));
        const normal = new Vector3(...face.normal);
        const winding = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).dot(normal);
        if (winding > 0) indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
        else indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return geometry;
}

