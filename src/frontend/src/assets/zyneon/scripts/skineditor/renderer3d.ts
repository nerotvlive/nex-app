import {
    BufferAttribute,
    BufferGeometry,
    Color,
    DataTexture,
    DoubleSide,
    FrontSide,
    Group,
    LineBasicMaterial,
    LineLoop,
    Mesh,
    MeshBasicMaterial,
    type MeshBasicMaterialParameters,
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
import {PART_IDS, type LayerTarget, type PartId, type Vec3} from "./types.ts";
import {type BoxDef, buildFaces, inflatedFacePoint, type SkinLayout} from "./layout.ts";
import type {BackAccessory, HiddenPartMode, Pose} from "./editor.ts";

export interface TextureImage {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}

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
const TURNTABLE_POLAR = Math.PI / 2 - 0.18;
const TURNTABLE_AZIMUTH = 0.6;

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
    private readonly parts = {} as Record<PartId, Group>;
    private readonly back = new Group();
    private backMeshes: Mesh[] = [];
    private backTexture: DataTexture | null = null;
    private backMaterial: MeshBasicMaterial | null = null;
    private pose: Pose = 'stand';
    private animationFrame = 0;
    private animationStart = 0;
    private voxel = false;
    private voxelMeshes: Mesh[] = [];
    private readonly voxelMaterial = new MeshBasicMaterial({vertexColors: true});
    private readonly hiddenMaterial = new MeshBasicMaterial({visible: false});
    private lastComposite: Uint8ClampedArray | null = null;
    private renderQueued = false;
    private disposed = false;
    private turntable = false;

    constructor(container: HTMLElement) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'skin-editor-canvas-3d';
        container.appendChild(this.canvas);

        this.renderer = new WebGLRenderer({canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'low-power'});
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = SRGBColorSpace;

        this.scene.add(this.model);
        for (const part of PART_IDS) {
            const group = new Group();
            this.parts[part] = group;
            this.model.add(group);
        }
        this.parts.body.add(this.back);

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

    setTurntable(enabled: boolean) {
        this.turntable = enabled;
        this.controls.enablePan = !enabled;
        this.controls.enableZoom = !enabled;
        this.controls.minPolarAngle = enabled ? TURNTABLE_POLAR : 0;
        this.controls.maxPolarAngle = enabled ? TURNTABLE_POLAR : Math.PI;
        if (enabled) {
            this.controls.mouseButtons = {LEFT: MOUSE.ROTATE, MIDDLE: null, RIGHT: MOUSE.ROTATE};
            this.camera.position.set(-Math.sin(TURNTABLE_AZIMUTH), TARGET_Y, Math.cos(TURNTABLE_AZIMUTH));
            this.controls.target.set(0, TARGET_Y, 0);
            this.fitTurntable();
        } else {
            this.setLeftMouseNavigation(false);
            this.setCameraPreset('iso');
        }
    }

    private fitTurntable() {
        const halfFov = (this.camera.fov * Math.PI / 180) / 2;
        const height = 36, width = 22;
        const distance = Math.max(height / 2 / Math.tan(halfFov), width / 2 / (Math.tan(halfFov) * this.camera.aspect)) * 1.08;
        const angle = Math.atan2(this.camera.position.x - this.controls.target.x, this.camera.position.z - this.controls.target.z);
        const azimuth = Number.isFinite(angle) ? angle : 0.5;
        this.camera.position.set(Math.sin(azimuth) * Math.sin(TURNTABLE_POLAR) * distance, TARGET_Y + Math.cos(TURNTABLE_POLAR) * distance, Math.cos(azimuth) * Math.sin(TURNTABLE_POLAR) * distance);
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
        if (this.turntable) this.fitTurntable();
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
        this.baseMaterial = faceMaterial({map: this.texture, vertexColors: true, side: FrontSide});
        this.overlayMaterial = faceMaterial({map: this.texture, vertexColors: true, side: DoubleSide, transparent: true, alphaTest: 0.004});
        this.ghostMaterial = faceMaterial({map: this.texture, vertexColors: true, side: FrontSide, transparent: true, opacity: 0.16, depthWrite: false});
        this.lockedMaterial = faceMaterial({map: this.texture, vertexColors: true, side: FrontSide, color: 0x5c5c66});
        this.lockedOverlayMaterial = faceMaterial({map: this.texture, vertexColors: true, side: DoubleSide, transparent: true, alphaTest: 0.004, color: 0x5c5c66});
    }

    private buildMeshes() {
        for (const mesh of this.meshes) {
            mesh.removeFromParent();
            mesh.geometry.dispose();
        }
        this.meshes = [];
        const layout = this.layout;
        if (!layout) return;
        for (const part of PART_IDS) this.parts[part].position.set(...pivotOf(part, layout));
        for (const box of layout.boxes) {
            const geometry = buildBoxGeometry(box, layout.width, layout.height, this.shading);
            const mesh = new Mesh(geometry, box.kind === 'overlay' ? this.overlayMaterial! : this.baseMaterial!);
            mesh.userData = {box};
            mesh.renderOrder = box.kind === 'overlay' ? 2 : 1;
            const pivot = pivotOf(box.part, layout);
            mesh.position.set(-pivot[0], -pivot[1], -pivot[2]);
            this.meshes.push(mesh);
            this.parts[box.part].add(mesh);
        }
        this.back.position.set(0, 24 - 12, -2);
        this.applyPose(0);
        if (this.voxel && this.lastComposite) this.buildVoxels(this.lastComposite);
        this.requestRender();
    }

    setPose(pose: Pose) {
        if (this.pose === pose) return;
        this.pose = pose;
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
        if (pose === 'walk' || pose === 'idle') {
            this.animationStart = performance.now();
            const tick = () => {
                if (this.disposed || this.pose !== pose) return;
                this.applyPose((performance.now() - this.animationStart) / 1000);
                this.renderer.render(this.scene, this.camera);
                this.animationFrame = requestAnimationFrame(tick);
            };
            this.animationFrame = requestAnimationFrame(tick);
        } else {
            this.applyPose(0);
            this.requestRender();
        }
    }

    private applyPose(time: number) {
        for (const part of PART_IDS) this.parts[part].rotation.set(0, 0, 0);
        this.back.rotation.set(0.12, 0, 0);
        if (this.pose === 'walk') {
            const swing = Math.sin(time * 5.5) * 0.65;
            this.parts.rightLeg.rotation.x = swing;
            this.parts.leftLeg.rotation.x = -swing;
            this.parts.rightArm.rotation.x = -swing * 0.8;
            this.parts.leftArm.rotation.x = swing * 0.8;
            this.parts.head.rotation.y = Math.sin(time * 1.3) * 0.15;
            this.back.rotation.x = 0.2 + Math.abs(Math.sin(time * 5.5)) * 0.15;
        } else if (this.pose === 'idle') {
            const sway = Math.cos(time * 1.8) * 0.05 + 0.05;
            const drift = Math.sin(time * 1.34) * 0.05;
            this.parts.rightArm.rotation.set(drift, 0, -sway);
            this.parts.leftArm.rotation.set(-drift, 0, sway);
            this.parts.head.rotation.set(Math.sin(time * 0.45) * 0.05, Math.sin(time * 0.6) * 0.14, 0);
        } else if (this.pose === 'tpose') {
            this.parts.rightArm.rotation.z = -1.45;
            this.parts.leftArm.rotation.z = 1.45;
        }
        this.model.updateMatrixWorld(true);
    }

    setBackAccessory(kind: BackAccessory, image: TextureImage | null) {
        for (const mesh of this.backMeshes) {
            mesh.removeFromParent();
            mesh.geometry.dispose();
        }
        this.backMeshes = [];
        this.backTexture?.dispose();
        this.backMaterial?.dispose();
        this.backTexture = null;
        this.backMaterial = null;
        if (kind === 'none') {
            this.requestRender();
            return;
        }
        image ??= defaultCape();
        const width = Math.max(64, image.width), height = Math.max(32, image.height, width / 2);
        const data = new Uint8Array(width * height * 4);
        for (let y = 0; y < image.height; y++) data.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), y * width * 4);
        this.backTexture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType);
        this.backTexture.magFilter = NearestFilter;
        this.backTexture.minFilter = NearestFilter;
        this.backTexture.generateMipmaps = false;
        this.backTexture.flipY = false;
        this.backTexture.colorSpace = SRGBColorSpace;
        this.backTexture.needsUpdate = true;
        this.backMaterial = faceMaterial({map: this.backTexture, vertexColors: true, side: DoubleSide, alphaTest: 0.5});
        const add = (u: number, v: number, size: Vec3, min: Vec3, mirrored: boolean, rotation: Vec3, position: Vec3) => {
            const box: BoxDef = {id: -1, part: 'body', kind: 'base', min, size, inflate: 0, faces: buildFaces(u, v, size, min, mirrored)};
            const geometry = buildBoxGeometry(box, 64 * width / Math.max(64, width), 64 * height / Math.max(64, width), this.shading);
            const mesh = new Mesh(geometry, this.backMaterial!);
            mesh.rotation.set(...rotation);
            mesh.position.set(...position);
            this.back.add(mesh);
            this.backMeshes.push(mesh);
        };
        if (kind === 'cape') {
            add(0, 0, [10, 16, 1], [-5, -16, -0.5], false, [0, Math.PI, 0], [0, 0, -0.5]);
        } else {
            add(22, 0, [10, 20, 2], [-10, -20, -1], false, [0.26, 0, 0.26], [5, 0, -1]);
            add(22, 0, [10, 20, 2], [0, -20, -1], true, [0.26, 0, -0.26], [-5, 0, -1]);
        }
        this.applyPose(0);
        this.requestRender();
    }

    setVoxelOverlay(enabled: boolean) {
        if (this.voxel === enabled) return;
        this.voxel = enabled;
        if (enabled && this.lastComposite) this.buildVoxels(this.lastComposite);
        else this.clearVoxels();
        this.applyPartState();
    }

    private clearVoxels() {
        for (const mesh of this.voxelMeshes) {
            mesh.removeFromParent();
            mesh.geometry.dispose();
        }
        this.voxelMeshes = [];
    }

    private buildVoxels(composite: Uint8ClampedArray) {
        this.clearVoxels();
        const layout = this.layout;
        if (!layout) return;
        const color = new Color();
        for (const box of layout.boxes) {
            if (box.kind !== 'overlay') continue;
            const positions: number[] = [];
            const colors: number[] = [];
            for (const face of box.faces) {
                for (let t = 0; t < face.rect.h; t++) {
                    for (let s = 0; s < face.rect.w; s++) {
                        const index = (face.rect.y + t) * layout.width + face.rect.x + s;
                        if (index >= layout.width * layout.height || composite[index * 4 + 3]! < 128) continue;
                        color.setRGB(composite[index * 4]! / 255, composite[index * 4 + 1]! / 255, composite[index * 4 + 2]! / 255, SRGBColorSpace);
                        const inner = -box.inflate * 0.6, outer = box.inflate;
                        const corner = (cs: number, ct: number, extra: number) => inflatedFacePoint(box, face, cs, ct, extra);
                        const cube = [
                            corner(s, t, inner), corner(s + 1, t, inner), corner(s + 1, t + 1, inner), corner(s, t + 1, inner),
                            corner(s, t, outer), corner(s + 1, t, outer), corner(s + 1, t + 1, outer), corner(s, t + 1, outer)
                        ];
                        const quads: [number, number, number, number, number][] = [
                            [4, 5, 6, 7, 1], [0, 3, 2, 1, 0.5], [0, 1, 5, 4, 0.75], [1, 2, 6, 5, 0.75], [2, 3, 7, 6, 0.75], [3, 0, 4, 7, 0.75]
                        ];
                        for (const [a, b, c, d, light] of quads) {
                            for (const vertex of [a, b, c, a, c, d]) {
                                positions.push(...cube[vertex]!);
                                const value = this.shading ? light : 1;
                                colors.push(color.r * value, color.g * value, color.b * value);
                            }
                        }
                    }
                }
            }
            if (!positions.length) continue;
            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
            geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
            geometry.computeBoundingSphere();
            const material = this.voxelMaterial;
            material.side = DoubleSide;
            const mesh = new Mesh(geometry, material);
            const pivot = pivotOf(box.part, layout);
            mesh.position.set(-pivot[0], -pivot[1], -pivot[2]);
            mesh.userData = {voxelPart: box.part};
            this.parts[box.part].add(mesh);
            this.voxelMeshes.push(mesh);
        }
        this.applyVoxelVisibility();
    }

    private applyVoxelVisibility() {
        const state = this.partState;
        for (const mesh of this.voxelMeshes) {
            const part = mesh.userData.voxelPart as PartId;
            const selected = !state || state.selected.includes(part);
            mesh.visible = (!state || state.overlay[part]) && (selected || state.mode !== 'hide') && !(state && !selected && state.mode === 'ghost');
        }
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
        this.lastComposite = composite;
        if (this.voxel) this.buildVoxels(composite);
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
        if (this.voxel) {
            for (const mesh of this.meshes) {
                if ((mesh.userData.box as BoxDef).kind === 'overlay' && mesh.visible && mesh.material !== this.lockedOverlayMaterial) mesh.material = this.hiddenMaterial;
            }
            this.applyVoxelVisibility();
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
        const extra = this.voxel && hit.box.kind === 'overlay' ? hit.box.inflate : 0;
        const mesh = this.meshes.find(candidate => candidate.userData.box === hit.box);
        const corners = [
            inflatedFacePoint(hit.box, face, s, t, extra),
            inflatedFacePoint(hit.box, face, s + 1, t, extra),
            inflatedFacePoint(hit.box, face, s + 1, t + 1, extra),
            inflatedFacePoint(hit.box, face, s, t + 1, extra)
        ];
        const positions = this.hoverLine.geometry.getAttribute('position') as BufferAttribute;
        const point = new Vector3();
        corners.forEach((corner, i) => {
            point.set(corner[0] + face.normal[0] * lift, corner[1] + face.normal[1] * lift, corner[2] + face.normal[2] * lift);
            if (mesh) point.applyMatrix4(mesh.matrixWorld);
            positions.setXYZ(i, point.x, point.y, point.z);
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
        cancelAnimationFrame(this.animationFrame);
        this.clearVoxels();
        this.setBackAccessory('none', null);
        this.voxelMaterial.dispose();
        this.hiddenMaterial.dispose();
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

function defaultCape(): TextureImage {
    const width = 64, height = 32;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const shade = 0x58 + ((x * 7 + y * 13) % 5) * 4 - (y > 14 ? 12 : 0);
            const i = (y * width + x) * 4;
            data[i] = shade;
            data[i + 1] = shade - 10;
            data[i + 2] = shade + 26;
            data[i + 3] = 255;
        }
    }
    return {width, height, data};
}

function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

function pivotOf(part: PartId, layout: SkinLayout): Vec3 {
    const arm = layout.model === 'slim' ? 5.5 : 6;
    switch (part) {
        case 'head':
            return [0, 24, 0];
        case 'rightArm':
            return [-arm, 22, 0];
        case 'leftArm':
            return [arm, 22, 0];
        case 'rightLeg':
            return [-2, 12, 0];
        case 'leftLeg':
            return [2, 12, 0];
        default:
            return [0, 12, 0];
    }
}

function faceMaterial(parameters: MeshBasicMaterialParameters): MeshBasicMaterial {
    const material = new MeshBasicMaterial(parameters);
    material.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader
            .replace('void main() {', 'attribute vec4 uvBounds;\nvarying vec4 vUvBounds;\nvoid main() {')
            .replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvUvBounds = uvBounds;');
        shader.fragmentShader = shader.fragmentShader
            .replace('void main() {', 'varying vec4 vUvBounds;\nvoid main() {')
            .replace('#include <map_fragment>', '#ifdef USE_MAP\n\tdiffuseColor *= texture2D( map, clamp( vMapUv, vUvBounds.xy, vUvBounds.zw ) );\n#endif');
    };
    material.customProgramCacheKey = () => 'skin-face-clamp';
    return material;
}

function buildBoxGeometry(box: BoxDef, textureWidth: number, textureHeight: number, shading: boolean): BufferGeometry {
    const positions = new Float32Array(6 * 4 * 3);
    const uvs = new Float32Array(6 * 4 * 2);
    const bounds = new Float32Array(6 * 4 * 4);
    const colors = new Float32Array(6 * 4 * 3);
    const indices: number[] = [];
    box.faces.forEach((face, faceIndex) => {
        const {w, h} = face.rect;
        const corners: [number, number][] = [[0, 0], [w, 0], [0, h], [w, h]];
        corners.forEach(([s, t], v) => {
            const p = inflatedFacePoint(box, face, s, t);
            const vertex = faceIndex * 4 + v;
            positions.set(p, vertex * 3);
            uvs[vertex * 2] = (face.rect.x + s) / textureWidth;
            uvs[vertex * 2 + 1] = (face.rect.y + t) / textureHeight;
            bounds.set([(face.rect.x + 0.5) / textureWidth, (face.rect.y + 0.5) / textureHeight, (face.rect.x + Math.max(0.5, w - 0.5)) / textureWidth, (face.rect.y + Math.max(0.5, h - 0.5)) / textureHeight], vertex * 4);
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
    geometry.setAttribute('uvBounds', new BufferAttribute(bounds, 4));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return geometry;
}

