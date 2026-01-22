import macStyleCss from "../../assets/mac_style.css?raw";
import { applyPseudoElements } from "./pseudoApplyRender.js";

export function renderMacStyle(wenyanElement: HTMLElement): void {
    applyPseudoElements(wenyanElement, macStyleCss);
}

export { macStyleCss };
