import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/main.js"),
            name: "WenyanCore", // 浏览器全局变量名
            fileName: () => `wenyan-core.js`,
            formats: ["iife"],
        },
        sourcemap: false,
        rollupOptions: {},
        outDir: 'dist/browser',
    },
});
