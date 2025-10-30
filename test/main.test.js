import { describe, it, expect, beforeAll } from "vitest";

import {
    handleFrontMatter,
    configureMarked,
    renderMarkdown,
} from "../src/main.js";

const frontmatter = `---
title: 测试标题
cover: https://example.com/image.jpg
---
# 正文

Hello world!`;

beforeAll(async() => {
    await configureMarked();
});

describe("main.ts tests", () => {
    it("should parse frontmatter and return title, cover, and body", async () => {
        const result = await handleFrontMatter(frontmatter);
        expect(result.title).toBe("测试标题");
        expect(result.cover).toBe("https://example.com/image.jpg");
        expect(result.body).toContain("# 正文");
    });
    it("renderMarkdown image test1", async () => {
        const result = await renderMarkdown("![alt](https://example.com/image.jpg){width=100 height=200}");
        expect(result).equals('<p><img src="https://example.com/image.jpg" alt="alt" title="alt" style="width:100px; height:200px"></p>\n');
    });
    it("renderMarkdown image test2", async () => {
        const result = await renderMarkdown("![alt](https://example.com/image.jpg)");
        expect(result).equals('<p><img src="https://example.com/image.jpg" alt="alt" title="alt"></p>\n');
    });
    it("renderMarkdown image test3", async () => {
        const result = await renderMarkdown("![alt](/home/images/文颜.jpg)");
        expect(result).toContain('文颜.jpg');
    });
    it("renderMarkdown code test1", async () => {
        const result = await renderMarkdown("```javascript\nimport { Marked } from \"marked\";\n```");
        console.log(result);
        expect(result).toContain('<span class="hljs-keyword">');
    });
});
