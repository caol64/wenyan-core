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
                },
                name: "WenyanCore", // 浏览器全局变量名
                fileName: (format, entryName) => `${entryName}.js`,
                formats: ["es"],
            },
            sourcemap: true,
            rollupOptions: {
                external: [
                    "fs",
                    "fs/promises",
                    "path",
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
                // output: {
                //     globals: {
                //         marked: "marked",
                //         "marked-highlight": "markedHighlight",
                //         "mathjax-full": "mathjax",
                //         "highlight.js": "hljs",
                //         "front-matter": "frontMatter",
                //         "formdata-node": "FormDataNode",
                //         "css-tree": "csstree",
                //         jsdom: "jsdom",
                //     },
                // },
            },
        },
        test: {
            // globals: true,
            include: ["test/**/*.test.js"],
            env,
        },
    };
});
