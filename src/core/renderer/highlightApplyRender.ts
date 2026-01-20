import { createCssApplier } from "../parser/cssParser.js";

export function renderHighlightTheme(wenyanElement: HTMLElement, highlightCss: string): void {
    createCssApplier(highlightCss)(wenyanElement);
}
