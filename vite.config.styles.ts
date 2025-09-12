import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/styles.js"),
            name: "WenyanStyles", // 浏览器全局变量名
            fileName: () => `wenyan-styles.js`,
            formats: ["iife"],
        },
        sourcemap: false,
        outDir: "dist/styles",
        rollupOptions: {},
    },
});
