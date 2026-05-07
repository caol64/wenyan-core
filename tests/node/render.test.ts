import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderStyledContent, prepareRenderContext } from "../../src/node/render.js";
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

    describe("renderStyledContent", () => {
        it("should render styled content with wrapper section", async () => {
            const markdown = "# Test\n\nParagraph.";
            const result = await renderStyledContent(markdown, {
                themeId: "phycat",
                hlThemeId: "solarized-light",
                isMacStyle: true,
                isAddFootnote: false,
            });

            expect(result).toContain('id="wenyan"');
        });

        it("should return default StyledContent structure", async () => {
            const markdown = "# Test";
            const result = await renderStyledContent(markdown, {
                themeId: "phycat",
                hlThemeId: "solarized-light",
            });

            expect(typeof result).toBe("string");
            expect(result).toContain('id="wenyan"');
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

        describe("type: image transformation", () => {
            it("should extract markdown images and inject image_list", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: Photo Post\ntype: image\n---\nSome text before.\n\n![alt1](photo1.jpg)\n\n![alt2](photo2.png)\n\nSome text after.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toEqual(["photo1.jpg", "photo2.png"]);
                expect(result.gzhContent.content).not.toContain("![");
                expect(result.gzhContent.content).toContain("Some text before.");
                expect(result.gzhContent.content).toContain("Some text after.");
            });

            it("should extract Obsidian embed images", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: Obsidian Photos\ntype: image\n---\n![[image1.png]]\n![[image2.jpg|description]]\nText between images.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toEqual(["image1.png", "image2.jpg"]);
                expect(result.gzhContent.content).not.toContain("![[");
                expect(result.gzhContent.content).toContain("Text between images.");
            });

            it("should extract WikiLinks image with pixel width as src (not alt)", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: WikiLinks Width\ntype: image\n---\n\n![[banner.png|300]]\n\nCaption.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toEqual(["banner.png"]);
                expect(result.gzhContent.image_list).not.toContain("300");
                expect(result.gzhContent.content).toContain("Caption.");
            });

            it("should decode URL-encoded spaces in image src", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: Spaces\ntype: image\n---\n\n![[my photo.png]]\n\nCaption.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toEqual(["my photo.png"]);
            });

            it("should extract mixed markdown and Obsidian images", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: Mixed Images\ntype: image\n---\n![](md.jpg)\n![[obsidian.png]]\nText.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toEqual(["md.jpg", "obsidian.png"]);
            });

            it("should not transform when type is not image", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: Normal Post\ntype: article\n---\n![](photo.jpg)\nText.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toBeUndefined();
            });

            it("should not transform when image_list already exists in frontmatter", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: Manual Image List\ntype: image\nimage_list:\n  - custom1.jpg\n  - custom2.jpg\n---\n![](photo.jpg)\nText.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toEqual(["custom1.jpg", "custom2.jpg"]);
            });

            it("should not transform when body has no images", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "---\ntitle: No Images\ntype: image\n---\nJust text, no images.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toBeUndefined();
                expect(result.gzhContent.content).toContain("Just text, no images.");
            });

            it("should not transform when frontmatter is absent", async () => {
                const getInputContent = vi.fn().mockResolvedValue({
                    content: "![](photo.jpg)\nJust text.",
                    absoluteDirPath: "/test/path",
                });

                const result = await prepareRenderContext(
                    undefined,
                    { theme: "phycat", highlight: "solarized-light", macStyle: false, footnote: false },
                    getInputContent,
                );

                expect(result.gzhContent.image_list).toBeUndefined();
            });
        });
    });
});
