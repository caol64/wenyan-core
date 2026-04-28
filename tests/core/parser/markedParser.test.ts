import { describe, it, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { createMarkedClient } from "../../../src/core/parser/markedParser";

// 模拟 DOM 环境（解决 hljs 运行需要 document）
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
(globalThis as any).document = dom.window.document;
(globalThis as any).window = dom.window;
(globalThis as any).HTMLElement = dom.window.HTMLElement;

describe("core/marked/client", () => {
    let client: ReturnType<typeof createMarkedClient>;

    beforeEach(() => {
        client = createMarkedClient();
    });

    // ----------------------------------------------------
    // 1. 基础解析
    // ----------------------------------------------------
    it("应该正常解析普通 Markdown", async () => {
        const html = await client.parse("# 测试\n普通段落");
        expect(html).toContain("<h1><span>测试</span></h1>");
        expect(html).toContain("<p>普通段落</p>");
    });

    // ----------------------------------------------------
    // 2. 标题渲染 <h1><span>text</span></h1>
    // ----------------------------------------------------
    it("应该将标题包裹 span", async () => {
        const html = await client.parse("# H1\n## H2\n### H3");
        expect(html).toContain("<h1><span>H1</span></h1>");
        expect(html).toContain("<h2><span>H2</span></h2>");
        expect(html).toContain("<h3><span>H3</span></h3>");
    });

    // ----------------------------------------------------
    // 3. 代码高亮
    // ----------------------------------------------------
    it("应该给代码块添加高亮类", async () => {
        const md = "```typescript\nconst a = 1;\n```";
        const html = await client.parse(md);
        expect(html).toContain('class="hljs language-typescript"');
    });

    it("未知语言使用 plaintext", async () => {
        const md = "```\ncode\n```";
        const html = await client.parse(md);
        expect(html).toContain('class="hljs"');
    });

    // ----------------------------------------------------
    // 4. 自定义图片语法 ![](){width=100 height=200}
    // ----------------------------------------------------
    it("应该解析自定义属性图片并生成 style", async () => {
        const md = "![图片](test.png){width=100 height=200 margin=10}";
        const html = await client.parse(md);

        expect(html).toContain('src="test.png"');
        expect(html).toContain('alt="图片"');
        expect(html).toContain('style="width:100px; height:200px; margin:10px"');
    });

    it("无属性图片正常渲染", async () => {
        const md = "![](test.png)";
        const html = await client.parse(md);
        expect(html).toContain('<img src="test.png"');
    });

    // ----------------------------------------------------
    // 5. 段落：块级公式 $$...$$ 不包裹 <p>
    // ----------------------------------------------------
    it("块级公式 $$...$$ 不包裹 p 标签", async () => {
        const md = "$$E=mc^2$$";
        const html = await client.parse(md);
        expect(html).toBe("$$E=mc^2$$\n");
    });

    it("\\[...\\] 块级公式不包裹 p 标签", async () => {
        const md = "\\[x + y\\]";
        const html = await client.parse(md);
        expect(html).toBe("\\[x + y\\]\n");
    });

    it("普通文本正常包裹 p 标签", async () => {
        const md = "普通段落";
        const html = await client.parse(md);
        expect(html).toContain("<p>普通段落</p>");
    });

    // ----------------------------------------------------
    // 6. 原生图片渲染
    // ----------------------------------------------------
    it("原生图片正确渲染 alt 和 title", async () => {
        const md = '![图片文字](img.jpg "标题")';
        const html = await client.parse(md);
        expect(html).toContain('src="img.jpg"');
        expect(html).toContain('alt="图片文字"');
        expect(html).toContain('title="标题"');
    });

    // ----------------------------------------------------
    // 7. Obsidian WikiLinks 图片语法 ![[...]]
    // ----------------------------------------------------
    it("WikiLinks 基础图片 ![[filename]] 正常渲染", async () => {
        const html = await client.parse("![[image.png]]");
        expect(html).toContain('src="image.png"');
        expect(html).not.toContain("alt=");
        expect(html).not.toContain("style=");
    });

    it("WikiLinks 图片带 alt ![[filename|alt text]]", async () => {
        const html = await client.parse("![[photo.jpg|我的照片]]");
        expect(html).toContain('src="photo.jpg"');
        expect(html).toContain('alt="我的照片"');
        expect(html).toContain('title="我的照片"');
    });

    it("WikiLinks 图片带宽度 ![[filename|200]]", async () => {
        const html = await client.parse("![[banner.png|200]]");
        expect(html).toContain('src="banner.png"');
        expect(html).toContain('style="width:200px"');
        expect(html).not.toContain("alt=");
    });

    it("WikiLinks 图片带宽高 ![[filename|200x300]]", async () => {
        const html = await client.parse("![[cover.jpg|200x300]]");
        expect(html).toContain('src="cover.jpg"');
        expect(html).toContain('style="width:200px; height:300px"');
    });

    it("WikiLinks 图片路径中含空格正常编码", async () => {
        const html = await client.parse("![[my image.png]]");
        expect(html).toContain("my%20image.png");
    });

    it("WikiLinks 仅宽度 modifier 不作为 alt 输出", async () => {
        const html = await client.parse("![[logo.svg|150]]");
        expect(html).not.toContain('alt="150"');
        expect(html).toContain('style="width:150px"');
    });
});
