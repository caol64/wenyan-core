import { getMacStyleCss } from "../theme/macStyleRegistry.js";
import { applyPseudoElements } from "./pseudoApplyRender.js";

export function renderMacStyle(wenyanElement: HTMLElement): void {
    const macStyleCss = getMacStyleCss();
    applyPseudoElements(wenyanElement, macStyleCss);
}
