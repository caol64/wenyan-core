import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/math.js"),
            name: "WenyanMath", // 浏览器全局变量名
            fileName: () => `wenyan-math.js`,
            formats: ["iife"],
        },
        sourcemap: false,
        outDir: "dist/math",
        rollupOptions: {},
    },
});
