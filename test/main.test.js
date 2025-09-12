import { describe, it, expect, beforeAll } from "vitest";
import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

import {
    handleFrontMatter,
    configureMarked,
    renderMarkdown,
    getContentForGzhBuiltinTheme,
} from "../dist/core.js";

const frontmatter = `---
title: 测试标题
cover: https://example.com/image.jpg
---
# 正文

Hello world!`;


beforeAll(() => {
    configureMarked();
});

describe("main.ts tests", () => {
    it("should parse frontmatter and return title, cover, and body", () => {
        const result = handleFrontMatter(frontmatter);
        expect(result.title).toBe("测试标题");
        expect(result.cover).toBe("https://example.com/image.jpg");
        expect(result.body).toContain("# 正文");
    });
    it("should convert markdown to HTML", async () => {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const md = await readFile(join(__dirname, "publish.md"), "utf8");
        const preHandlerContent = handleFrontMatter(md);
        const html = await renderMarkdown(preHandlerContent.body);
        const dom = new JSDOM(`<body><section id="wenyan">${html}</section></body>`);
        const document = dom.window.document;
        const wenyan = document.getElementById("wenyan");
        const result = await getContentForGzhBuiltinTheme(wenyan, "maize", "solarized-light", true, true);

        // console.log(html);

        const outputPath = join(__dirname, "publish.html");
        await writeFile(outputPath, result, "utf8");
        expect(result).toContain("</h2>");
    });
});
