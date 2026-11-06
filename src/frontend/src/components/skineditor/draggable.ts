import type {Directive} from "vue";

interface DragState {
    x: number;
    y: number;
    clamp: () => void;
    cleanup: () => void;
}

const states = new WeakMap<HTMLElement, DragState>();

export const vDraggable: Directive<HTMLElement> = {
    mounted(element) {
        const handle = element.querySelector<HTMLElement>('header') ?? element;
        handle.classList.add('skin-editor-drag-handle');
        const state: DragState = {x: 0, y: 0, clamp: () => {}, cleanup: () => {}};

        const apply = (x: number, y: number) => {
            const bounds = (element.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
            const rect = element.getBoundingClientRect();
            const baseLeft = rect.left - state.x, baseTop = rect.top - state.y;
            state.x = Math.min(Math.max(x, bounds.left - baseLeft), Math.max(bounds.left - baseLeft, bounds.right - baseLeft - rect.width));
            state.y = Math.min(Math.max(y, bounds.top - baseTop), Math.max(bounds.top - baseTop, bounds.bottom - baseTop - rect.height));
            element.style.translate = `${state.x}px ${state.y}px`;
        };
        state.clamp = () => apply(state.x, state.y);

        const onPointerDown = (event: PointerEvent) => {
            if (event.button !== 0 || (event.target as HTMLElement).closest('button, input, select, textarea')) return;
            event.preventDefault();
            const startX = event.clientX - state.x, startY = event.clientY - state.y;
            handle.setPointerCapture(event.pointerId);
            const move = (e: PointerEvent) => apply(e.clientX - startX, e.clientY - startY);
            const up = () => {
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', up);
                handle.removeEventListener('pointercancel', up);
            };
            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up);
            handle.addEventListener('pointercancel', up);
        };

        handle.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('resize', state.clamp);
        state.cleanup = () => {
            handle.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('resize', state.clamp);
        };
        states.set(element, state);
    },
    unmounted(element) {
        states.get(element)?.cleanup();
        states.delete(element);
    }
};
