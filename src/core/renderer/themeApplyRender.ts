import { createCssModifier, createCssApplier } from "../parser/cssParser.js";
import { monospace } from "../utils.js";

const themeModifier = createCssModifier({
    "#wenyan pre code": [
        {
            property: "font-family",
            value: monospace,
            append: true,
        },
    ],
    "#wenyan pre": [
        {
            property: "font-size",
            value: "12px",
            append: true,
        },
    ],
});

export function renderTheme(wenyanElement: HTMLElement, themeCss: string): void {
    const modifiedCss = themeModifier(themeCss);
    createCssApplier(modifiedCss)(wenyanElement);
}
