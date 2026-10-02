declare global {
    interface Window {
        startWindowDrag?: () => void;
        closeWindow?: () => void;
        toggleMaximizeWindow?: () => void;
        maximizeWindow?: () => void;
        unmaximizeWindow?: () => void;
        minimizeWindow?: () => void;
        openTool?: (tool: string) => void;
    }
}

export class windowControls {

    constructor() {

    }

    async startDrag(): Promise<void> {
        if (window.startWindowDrag) {
            window.startWindowDrag();
        }
    };

    async minimize(): Promise<void> {
        if (window.minimizeWindow) {
            window.minimizeWindow();
        }
    }

    async maximize(): Promise<void> {
        if (window.maximizeWindow) {
            window.maximizeWindow();
        }
    }

    async unmaximize(): Promise<void> {
        if (window.unmaximizeWindow) {
            window.unmaximizeWindow();
        }
    }

    async toggleMaximize(): Promise<void> {
        if (window.toggleMaximizeWindow) {
            window.toggleMaximizeWindow();
        }
    }

    async enableFullscreen(): Promise<void> {
    }

    async disableFullscreen(): Promise<void> {
    }

    async toggleFullscreen(): Promise<void> {

    }

    async close(): Promise<void> {
        if (window.closeWindow) {
            window.closeWindow();
        }
    }

    openMenu(menuId: string): void {
        const nav = document.getElementById(menuId);
        if (nav) nav.classList.add("active");
    }

    closeMenu(menuId: string): void {
        const nav = document.getElementById(menuId);
        if (nav) nav.classList.remove("active");
    }

    toggleMenu(menuId: string): void {
        const nav = document.getElementById(menuId);
        if (nav) nav.classList.toggle("active");
    }
}

export const WindowControls = new windowControls();