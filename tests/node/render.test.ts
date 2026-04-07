import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithTheme, renderStyledContent, prepareRenderContext } from "../../src/node/render.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Theme, HlTheme, registerHlTheme, registerTheme } from "../../src/core";
import { MacStyle, registerMacStyle } from "../../src/core/theme/macStyleRegistry";

// 注册测试用的主题和高亮主题
const defaultTheme = readFileSync(resolve(__dirname, "../../src/assets/themes/phycat.css"), "utf-8");
const theme: Theme = {
    meta: {
        id: "phycat",
        name: "Phycat",
        description: "The phycat theme.",
        appName: "Wenyan",
        author: "Author Name",
    },
    getCss: async () => defaultTheme,
};

const defaultHlTheme = readFileSync(
    resolve(__dirname, "../../src/assets/highlight/styles/solarized-light.min.css"),
    "utf-8",
);
const hlTheme: HlTheme = {
    id: "solarized-light",
    getCss: async () => defaultHlTheme,
};

const defaultMacStyle = readFileSync(resolve(__dirname, "../../src/assets/mac_style.css"), "utf-8");
const macStyle: MacStyle = {
    getCss: () => defaultMacStyle,
};

registerTheme(theme);
registerHlTheme(hlTheme);
registerMacStyle(macStyle);

describe("render.ts tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("renderWithTheme", () => {
        it("should render markdown with theme", async () => {
            const markdown = "---\ntitle: Test Title\n---\n\nThis is test content.";
            const result = await renderWithTheme(markdown, {
                theme: "phycat",
                highlight: "solarized-light",
                macStyle: true,
                footnote: false,
            });

            expect(result).toHaveProperty("content");
            expect(result).toHaveProperty("title", "Test Title");
            expect(result.content).toContain("</section>");
        });

        it("should throw error when no content provided", async () => {
            await expect(
                renderWithTheme("", {
                    theme: "phycat",
                    highlight: "solarized-light",
                    macStyle: true,
                    footnote: false,
                }),
            ).rejects.toThrow("No content provided for rendering.");
        });

        it("should throw error when theme not found", async () => {
            await expect(
                renderWithTheme("# Test", {
                    theme: "non-existent",
                    highlight: "solarized-light",
                    macStyle: true,
                    footnote: false,
                }),
            ).rejects.toThrow(/主题不存在: non-existent/);
        });

        it("should render with custom theme from file path", async () => {
            // customTheme 传入的是文件路径，会被读取文件内容
            const tempThemeFile = resolve(__dirname, "../../src/assets/themes/phycat.css");
            const markdown = "# Custom Theme Test";
            const result = await renderWithTheme(markdown, {
                customTheme: tempThemeFile,
                highlight: "solarized-light",
                macStyle: false,
                footnote: false,
            });

            expect(result).toHaveProperty("content");
            // phycat.css 里包含具体的主题样式
            expect(result.content).toContain("</section>");
        });

        it("should extract front matter metadata", async () => {
            const markdown = `---
title: Front Matter Title
author: Test Author
cover: https://example.com/cover.jpg
---

# Content Title

Some content.`;

            const result = await renderWithTheme(markdown, {
                theme: "phycat",
                highlight: "solarized-light",
                macStyle: false,
                footnote: false,
            });

            expect(result.title).toBe("Front Matter Title");
            expect(result.author).toBe("Test Author");
            expect(result.cover).toBe("https://example.com/cover.jpg");
        });
    });

    describe("renderStyledContent", () => {
        it("should render styled content with wrapper section", async () => {
            const markdown = "# Test\n\nParagraph.";
            const result = await renderStyledContent(markdown, {
                themeId: "phycat",
                hlThemeId: "solarized-light",
                isMacStyle: true,
                isAddFootnote: false,
            });

            expect(result).toHaveProperty("content");
            expect(result.content).toContain('id="wenyan"');
        });

        it("should return default StyledContent structure", async () => {
            const markdown = "# Test";
            const result = await renderStyledContent(markdown, {
                themeId: "phycat",
                hlThemeId: "solarized-light",
            });

            expect(result).toHaveProperty("content");
            expect(result).toHaveProperty("title");
            expect(result).toHaveProperty("cover");
            expect(result).toHaveProperty("description");
            expect(result).toHaveProperty("author");
            expect(result).toHaveProperty("source_url");
        });
    });

    describe("prepareRenderContext", () => {
        it("should prepare render context with content and path", async () => {
            const getInputContent = vi.fn().mockResolvedValue({
                content: "---\ntitle: Test Markdown\n---\n\nContent",
                absoluteDirPath: "/test/path",
            });

            const result = await prepareRenderContext(
                undefined,
                {
                    theme: "phycat",
                    highlight: "solarized-light",
                    macStyle: true,
                    footnote: false,
                },
                getInputContent,
            );

            expect(result).toHaveProperty("gzhContent");
            expect(result).toHaveProperty("absoluteDirPath", "/test/path");
            expect(result.gzhContent.title).toBe("Test Markdown");
        });

        it("should use inputContent when getInputContent returns it", async () => {
            const getInputContent = vi.fn().mockResolvedValue({
                content: "---\ntitle: Direct Content\n---\n\nBody",
                absoluteDirPath: "/direct/path",
            });

            const result = await prepareRenderContext(
                undefined,
                {
                    theme: "phycat",
                    highlight: "solarized-light",
                    macStyle: false,
                    footnote: false,
                },
                getInputContent,
            );

            expect(result.gzhContent.title).toBe("Direct Content");
        });
    });
});
