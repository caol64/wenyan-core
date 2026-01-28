import { createCssModifier, createCssApplier } from "../parser/cssParser.js";

const themeModifier = createCssModifier({});

export function renderTheme(wenyanElement: HTMLElement, themeCss: string): void {
    const modifiedCss = themeModifier(themeCss);
    createCssApplier(modifiedCss)(wenyanElement);
}
