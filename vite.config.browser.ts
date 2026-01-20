import { resolve } from "path";
import { defineConfig } from "vite";

const macStyle = resolve(__dirname, "src/assets/mac_style.css?raw");
const theme = resolve(__dirname, "src/theme.js");
const hlTheme = resolve(__dirname, "src/hltheme.js");
const math = resolve(__dirname, "src/math.js");

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/main.js"),
            name: "WenyanCore", // 浏览器全局变量名
            fileName: () => "wenyan-core.js",
            formats: ["iife"],
        },
        sourcemap: false,
        outDir: "dist/browser",
        rollupOptions: {
            external: [
                "highlight.js",
                "./assets/mac_style.css?raw",
                "./theme.js",
                "./hltheme.js",
                "css-tree",
                "./math.js",
            ],
            output: {
                globals: {
                    "highlight.js": "hljs",
                    [macStyle]: "macStyleCss",
                    [theme]: "themes",
                    [hlTheme]: "hlThemes",
                    "css-tree": "csstree",
                    [math]: "WenyanMath",
                },
            },
        },
    },
});
