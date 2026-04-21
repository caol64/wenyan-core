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
    });
});
