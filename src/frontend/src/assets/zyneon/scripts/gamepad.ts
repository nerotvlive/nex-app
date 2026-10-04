import { onMounted, onUnmounted } from 'vue'

export function useGlobalGamepadNavigation() {
    let animationFrameId: number
    let gamepadIndex: number | null = null
    let lastNavTime = 0
    const navDelay = 180
    const previousButtonStates = new Map<number, boolean>()
    const getFocusableElements = (): HTMLElement[] => {
        const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        return Array.from(document.querySelectorAll(selector)) as HTMLElement[]
    }

    const focusNext = (direction: 'next' | 'prev' | 'up' | 'down') => {
        const focusables = getFocusableElements()
        if (focusables.length === 0) return

        const currentIndex = focusables.indexOf(document.activeElement as HTMLElement)

        let nextIndex = 0

        if (direction === 'next' || direction === 'down') {
            nextIndex = currentIndex === -1 || currentIndex >= focusables.length - 1 ? 0 : currentIndex + 1
        } else {
            nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1
        }

        focusables[nextIndex]?.focus()
    }

    const handleGamepadConnected = (e: GamepadEvent) => {
        gamepadIndex = e.gamepad.index
        if (!document.activeElement || document.activeElement === document.body) {
            const focusables = getFocusableElements()
            if (focusables.length > 0) focusables[0].focus()
        }
    }

    const handleGamepadDisconnected = (e: GamepadEvent) => {
        if (e.gamepad.index === gamepadIndex) {
            gamepadIndex = null
        }
    }

    const pollGamepads = () => {
        if (gamepadIndex !== null) {
            const gamepads = navigator.getGamepads()
            const gp = gamepads[gamepadIndex]
            if (gp) {
                const now = performance.now()
                const dpadUp = gp.buttons[12]?.pressed || gp.axes[1] < -0.5
                const dpadDown = gp.buttons[13]?.pressed || gp.axes[1] > 0.5
                const dpadLeft = gp.buttons[14]?.pressed || gp.axes[0] < -0.5
                const dpadRight = gp.buttons[15]?.pressed || gp.axes[0] > 0.5
                if (now - lastNavTime > navDelay) {
                    if (dpadDown || dpadRight) {
                        focusNext('next')
                        lastNavTime = now
                    } else if (dpadUp || dpadLeft) {
                        focusNext('prev')
                        lastNavTime = now
                    }
                }
                const buttonA = gp.buttons[0]?.pressed
                const wasButtonAPressed = previousButtonStates.get(0) || false

                if (buttonA && !wasButtonAPressed) {
                    const activeEl = document.activeElement as HTMLElement
                    if (activeEl) {
                        activeEl.click()
                    }
                }
                previousButtonStates.set(0, !!buttonA)
            }
        }

        animationFrameId = requestAnimationFrame(pollGamepads)
    }

    onMounted(() => {
        window.addEventListener('gamepadconnected', handleGamepadConnected)
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)
        animationFrameId = requestAnimationFrame(pollGamepads)
    })

    onUnmounted(() => {
        window.removeEventListener('gamepadconnected', handleGamepadConnected)
        window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
        cancelAnimationFrame(animationFrameId)
    })
}