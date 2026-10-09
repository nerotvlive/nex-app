export class settings {

    private classicMenu = false;
    private menuExpanded = false;

    private theme = "dark";
    private roundedCorners = 1.00;
    private backgroundColor = "#131316"
    private backgroundAccent = "#2e5ff5"
    private backgroundAccentOpacity = 0.25;
    private language = "en";

    constructor() {
        if(localStorage.getItem("useClassicMenu") === "true") {
            this.classicMenu = true;
        }
        const savedBgAccent = localStorage.getItem("backgroundAccent");
        if (savedBgAccent !== null) {
            this.backgroundAccent = savedBgAccent || "#FF00FF";
        }
        const savedBgColor = localStorage.getItem("backgroundColor");
        if (savedBgColor !== null) {
            this.backgroundColor = savedBgColor || "#202020";
        }
        const savedBgAccentOpacity = localStorage.getItem("backgroundAccentOpacity");
        if (savedBgAccentOpacity !== null) {
            this.backgroundAccentOpacity = parseFloat(savedBgAccentOpacity) || 0.25;
        }
        const savedRoundedCorners = localStorage.getItem("roundedCorners");
        if (savedRoundedCorners !== null) {
            if(savedRoundedCorners === "0") {
                document.documentElement.style.setProperty("--zyn-br", "0");
                this.roundedCorners = 0;
            } else {
                this.roundedCorners = parseFloat(savedRoundedCorners) || 1.00;
            }
        }
    }

    public get useClassicMenu(): boolean {
        return this.classicMenu;
    }

    public get isMenuExpanded(): boolean {
        return this.menuExpanded;
    }

    public getTheme(): string {
        return this.theme;
    }
    public getRoundedCorners(): number {
        return this.roundedCorners;
    }

    public getBackgroundColor(): string {
        return this.backgroundColor;
    }

    public getBackgroundAccent(): string {
        return this.backgroundAccent;
    }

    getBackgroundAccentOpacity(): number {
        return this.backgroundAccentOpacity;
    }

    public getLanguage(): string {
        return this.language;
    }

    public setClassicMenu(value: boolean) {
        this.classicMenu = value;
        localStorage.setItem("useClassicMenu", value.toString());
        const body = document.body;
        if (body) {
            if (value) {
                body.classList.add("classic-menu");
            } else {
                body.classList.remove("classic-menu");
            }
        }
    }

    private getOpacity(): string {
        let opacity = this.getBackgroundAccentOpacity();
        if (opacity < 0) opacity = 0;
        if (opacity > 1) opacity = 1;
        if (opacity >= 0.99) {
            return "99";
        }
        const percentValue = Math.round(opacity * 100);
        return percentValue.toString().padStart(2, '0');
    }

    public setRoundedCorners(changedViaRange:boolean,value: number) {
        this.roundedCorners = value;
        localStorage.setItem("roundedCorners", value.toString());
        console.log(value+" Saved: "+localStorage.getItem("roundedCorners"));
        if (changedViaRange) {
            const numberInput = document.getElementById("background-rounded-number") as HTMLInputElement;
            if (numberInput) {
                numberInput.value = value.toString();
            }
        } else {
            const rangeInput = document.getElementById("background-rounded-range") as HTMLInputElement;
            if (rangeInput) {
                rangeInput.value = value.toString();
            }
        }
        document.documentElement.style.setProperty("--zyn-br", value+"rem");
    }

    public setBackgroundColor(value: string) {
        this.backgroundColor = value;
        localStorage.setItem("backgroundColor", value);
        document.documentElement.style.setProperty("--zyn-background-color", value);
    }

    public setBackgroundAccent(value: string) {
        this.backgroundAccent = value;
        localStorage.setItem("backgroundAccent", value);
        value = value + this.getOpacity();
        document.documentElement.style.setProperty("--zyn-background-body", "radial-gradient(circle at bottom right, "+value+" 0%, var(--zyn-background-color) 90%)");
    }

    public setBackgroundAccentOpacity(changedViaRange:boolean,value: number) {
        this.backgroundAccentOpacity = value;
        localStorage.setItem("backgroundAccentOpacity", value.toString());
        if (changedViaRange) {
            const numberInput = document.getElementById("background-accOp-number") as HTMLInputElement;
            if (numberInput) {
                numberInput.value = value.toString();
            }
        } else {
            const rangeInput = document.getElementById("background-accOp-range") as HTMLInputElement;
            if (rangeInput) {
                rangeInput.value = value.toString();
            }
        }
        this.setBackgroundAccent(this.getBackgroundAccent());
    }

    public setMenuExpanded(value: boolean) {
        this.menuExpanded = value;
        const menu = document.getElementById("navigation");
        if(menu) {
            if(value) {
                menu.classList.add("active");
            } else {
                menu.classList.remove("active");
            }
        }
    }

    public toggleMenuExpanded() {
        this.setMenuExpanded(!this.isMenuExpanded);
    }
}

export const ZyneonSettings = new settings();