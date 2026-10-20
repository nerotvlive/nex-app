declare global {
    interface Window {
        startWindowDrag?: () => void;
        closeWindow?: () => void;
        reloadWindow?: () => void;
        restartWindow?: () => void;
        toggleMaximizeWindow?: () => void;
        maximizeWindow?: () => void;
        unmaximizeWindow?: () => void;
        toggleMinimizeWindow?: () => void;
        minimizeWindow?: () => void;
        unminimizeWindow?: () => void;
        toggleHideWindow?: () => void;
        hideWindow?: () => void;
        showWindow?: () => void;
        reloadMain?: () => void;
        reloadAll?: () => void;
        openMain?: () => void;
        toggleNativeWindow?: () => void;
        pageLoadEvent?: (href: string) => void;
        openSecondaryFrame?: (tool: any) => void;
        openOldWindow?: () => void;
        finishIntro?: () => void;
        setup?: () => void;
        showNotifications?: () => void;
        hideNotifications?: () => void;
        toggleNotifications?: () => void;
        showFriends?: () => void;
        hideFriends?: () => void;
        toggleFriends?: () => void;
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

    pageLoadEvent(): void {
        if(window.pageLoadEvent) {
            window.pageLoadEvent(window.location.href);
        }
    }

    openSecondaryFrame(tool: any): void {
        if(window.openSecondaryFrame) {
            window.openSecondaryFrame(tool);
        }
    }

    reloadMain(): void {
        if(window.reloadMain) {
            window.reloadMain();
        }
    }

    openMain(): void {
        if(window.openMain) {
            window.openMain();
        }
    }

    openOld(): void {
        if(window.openOldWindow) {
            window.openOldWindow();
        }
    }

    async minimize(): Promise<void> {
        if (window.minimizeWindow) {
            window.minimizeWindow();
        }
    }

    async unminimize(): Promise<void> {
        if (window.unminimizeWindow) {
            window.unminimizeWindow();
        }
    }

    async toggleMinimize(): Promise<void> {
        if (window.toggleMinimizeWindow) {
            window.toggleMinimizeWindow();
        }
    }

    async hide(): Promise<void> {
        if (window.hideWindow) {
            window.hideWindow();
        }
    }

    async show(): Promise<void> {
        if (window.showWindow) {
            window.showWindow();
        }
    }

    async toggleHidden(): Promise<void> {
        if (window.toggleHideWindow) {
            window.toggleHideWindow();
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

    async toggleNative(): Promise<void> {
        if (window.toggleNativeWindow) {
            window.toggleNativeWindow();
        }
    }

    async reload(): Promise<void> {
        if (window.reloadWindow) {
            window.reloadWindow();
        }
    }

    async reloadAll(): Promise<void> {
        if (window.reloadAll) {
            window.reloadAll();
        }
    }

    async restart(): Promise<void> {
        if (window.restartWindow) {
            window.restartWindow();
        }
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