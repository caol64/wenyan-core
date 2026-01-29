import macStyleCssRaw from "../../assets/mac_style.css?raw";

export interface MacStyle {
    getCss(): string;
}

const registry = new Map<string, MacStyle>();

export function registerMacStyle(macStyle: MacStyle) {
    registry.set("macStyle", macStyle);
}

export function getMacStyle(): MacStyle | undefined {
    return registry.get("macStyle");
}

export function registerBuiltInMacStyle() {
    registerMacStyle({ getCss: () => macStyleCssRaw });
}

export function getMacStyleCss() {
    return getMacStyle()?.getCss() ?? "";
}
