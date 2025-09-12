import macStyleCss from "./mac_style.css?raw";
import { themes } from "./theme.js";
import { hlThemes } from "./hltheme.js";

(function (global) {
    global.macStyleCss = macStyleCss;
    global.themes = themes;
    global.hlThemes = hlThemes;
})(typeof window !== "undefined" ? window : this);

export * from "./theme.js";
export * from "./hltheme.js";
