/// <reference types="vitest" />
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        build: {
            lib: {
                entry: {
                    core: resolve(__dirname, "src/main.js"),
                    publish: resolve(__dirname, "src/publish.ts"),
                    wrapper: resolve(__dirname, "src/wrapper.ts"),
                    theme: resolve(__dirname, "src/theme.ts"),
                    hltheme: resolve(__dirname, "src/hltheme.ts"),
                },
                fileName: (format, entryName) => `${entryName}.js`,
                formats: ["es"],
            },
            sourcemap: false,
            ssr: true,
            rollupOptions: {
                external: [
                    "marked",
                    "marked-highlight",
                    "highlight.js",
                    "front-matter",
                    "formdata-node",
                    "css-tree",
                    "jsdom",
                    "mathjax-full/js/mathjax.js",
                    "mathjax-full/js/input/tex.js",
                    "mathjax-full/js/output/svg.js",
                    "mathjax-full/js/adaptors/liteAdaptor.js",
                    "mathjax-full/js/handlers/html.js",
                    "mathjax-full/js/input/tex/AllPackages.js",
                ],
            },
        },
        test: {
            // globals: true,
            include: ["test/**/*.test.js"],
            env,
        },
    };
});
