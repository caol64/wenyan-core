import { describe, it, expect, beforeEach } from "vitest";
import { createWenyanCore, WenyanCoreInstance, registerAllBuiltInThemes } from "../../src/core";

describe("core/index", () => {
    let instance: WenyanCoreInstance;

    beforeEach(async () => {
        registerAllBuiltInThemes();
        instance = await createWenyanCore();
    });

    describe("createWenyanCore", () => {
        it("should create an instance with default options", async () => {
            expect(instance).toBeDefined();
            expect(instance).toHaveProperty("handleFrontMatter");
            expect(instance).toHaveProperty("renderMarkdown");
            expect(instance).toHaveProperty("applyStylesWithTheme");
            expect(instance).toHaveProperty("applyStylesWithResolvedCss");
        });

        it("should create an instance with custom options", async () => {
            const customInstance = await createWenyanCore({
                isConvertMathJax: false,
                isWechat: false,
            });

            expect(customInstance).toBeDefined();
        });
    });

    describe("handleFrontMatter", () => {
        it("should parse front matter from markdown", async () => {
            const markdown = `---
title: Test Post
description: A test post
---
Content here`;

            const result = await instance.handleFrontMatter(markdown);

            expect(result.title).toBe("Test Post");
            expect(result.description).toBe("A test post");
            expect(result.content).toContain("Content here");
        });

        it("should handle markdown without front matter", async () => {
            const markdown = "# Hello World\n\nSome content";

            const result = await instance.handleFrontMatter(markdown);

            expect(result.title).toBeUndefined();
            expect(result.content).toBe(markdown);
        });
    });

    describe("renderMarkdown", () => {
        it("should render markdown to HTML", async () => {
            const markdown = "# Hello World\n\nThis is a test.";

            const result = await instance.renderMarkdown(markdown);

            expect(result).toContain("<h1");
            expect(result).toContain("Hello World");
            expect(result).toContain("<p");
            expect(result).toContain("This is a test");
        });

        it("should render code blocks with syntax highlighting", async () => {
            const markdown = `
\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`
`;

            const result = await instance.renderMarkdown(markdown);

            expect(result).toContain("hljs");
            expect(result).toContain("language-javascript");
        });

        it("should process MathJax by default", async () => {
            const markdown = "This is $x = 1$ inline math.";

            const result = await instance.renderMarkdown(markdown);

            // MathJax should process this by default
            expect(result).toBeDefined();
        });

        it("should skip MathJax when isConvertMathJax is false", async () => {
            const customInstance = await createWenyanCore({
                isConvertMathJax: false,
            });

            const markdown = "This is $x = 1$ inline math.";
            const result = await customInstance.renderMarkdown(markdown);

            // Should return HTML without MathJax processing
            expect(result).toContain("$x = 1$");
        });
    });

    describe("applyStylesWithTheme", () => {
        it("should apply styles with default theme", async () => {
            // Create a mock HTMLElement using JSDOM
            const { JSDOM } = await import("jsdom");
            const dom = new JSDOM("<!DOCTYPE html><section id='wenyan'><p>Test</p></section>");
            const element = dom.window.document.getElementById("wenyan") as HTMLElement;

            const result = await instance.applyStylesWithTheme(element, {
                themeId: "default",
                hlThemeId: "github",
                isMacStyle: true,
                isAddFootnote: false,
            });

            expect(result).toContain("id=\"wenyan\"");
            expect(result).toContain("data-provider=\"WenYan\"");
        });

        it("should throw error for non-existent theme", async () => {
            const { JSDOM } = await import("jsdom");
            const dom = new JSDOM("<!DOCTYPE html><section id='wenyan'><p>Test</p></section>");
            const element = dom.window.document.getElementById("wenyan") as HTMLElement;

            await expect(
                instance.applyStylesWithTheme(element, {
                    themeId: "non-existent-theme",
                    hlThemeId: "github",
                }),
            ).rejects.toThrow();
        });
    });

    describe("applyStylesWithResolvedCss", () => {
        it("should apply styles with provided CSS", async () => {
            const { JSDOM } = await import("jsdom");
            const dom = new JSDOM("<!DOCTYPE html><section id='wenyan'><p>Test</p></section>");
            const element = dom.window.document.getElementById("wenyan") as HTMLElement;

            const result = await instance.applyStylesWithResolvedCss(element, {
                themeCss: "#wenyan { color: red; }",
                hlThemeCss: ".hljs { background: #f5f5f5; }",
                isMacStyle: false,
                isAddFootnote: false,
            });

            expect(result).toContain("id=\"wenyan\"");
            expect(result).toContain("data-provider=\"WenYan\"");
        });

        it("should throw error when element is null", async () => {
            await expect(
                instance.applyStylesWithResolvedCss(null as any, {
                    themeCss: "",
                    hlThemeCss: "",
                    isMacStyle: false,
                    isAddFootnote: false,
                }),
            ).rejects.toThrow("wenyanElement不能为空");
        });

        it("should add footnotes when isAddFootnote is true", async () => {
            const { JSDOM } = await import("jsdom");
            const dom = new JSDOM(
                "<!DOCTYPE html><section id='wenyan'><p><a href='https://example.com'>Link</a></p></section>",
            );
            const element = dom.window.document.getElementById("wenyan") as HTMLElement;

            const result = await instance.applyStylesWithResolvedCss(element, {
                themeCss: "",
                hlThemeCss: "",
                isMacStyle: false,
                isAddFootnote: true,
            });

            expect(result).toContain("footnote");
        });

        it("should apply mac style when isMacStyle is true", async () => {
            const { JSDOM } = await import("jsdom");
            const dom = new JSDOM(
                "<!DOCTYPE html><section id='wenyan'><pre><code>const x = 1;</code></pre></section>",
            );
            const element = dom.window.document.getElementById("wenyan") as HTMLElement;

            const result = await instance.applyStylesWithResolvedCss(element, {
                themeCss: "",
                hlThemeCss: "",
                isMacStyle: true,
                isAddFootnote: false,
            });

            expect(result).toBeDefined();
        });
    });
});
