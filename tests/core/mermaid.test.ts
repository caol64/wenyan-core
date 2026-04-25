import { describe, expect, it, vi } from "vitest";
import { createWenyanCore, type MermaidRenderer } from "../../src/core";

describe("core Mermaid integration", () => {
    it("should call the injected Mermaid renderer for Mermaid code blocks", async () => {
        const renderer: MermaidRenderer = {
            renderHtml: vi.fn(async () => '<figure data-wenyan-diagram="mermaid"><svg></svg></figure>'),
        };
        const instance = await createWenyanCore({
            isConvertMathJax: false,
            mermaid: {
                enabled: true,
                renderer,
            },
        });

        const result = await instance.renderMarkdown("```mermaid\ngraph TD\nA-->B\n```");

        expect(renderer.renderHtml).toHaveBeenCalledOnce();
        expect(result).toContain('data-wenyan-diagram="mermaid"');
        expect(result).toContain("<svg");
    });

    it("should run Mermaid after MathJax", async () => {
        const renderer: MermaidRenderer = {
            renderHtml: vi.fn(async (html) => html),
        };
        const instance = await createWenyanCore({
            mermaid: {
                enabled: true,
                renderer,
            },
        });

        await instance.renderMarkdown("```mermaid\ngraph TD\nA-->B\n```\n\n$x = 1$");

        expect(renderer.renderHtml).toHaveBeenCalledOnce();
        expect(vi.mocked(renderer.renderHtml).mock.calls[0]?.[0]).toContain("mjx-container");
    });

    it("should throw when Mermaid is enabled without a renderer", async () => {
        const instance = await createWenyanCore({
            isConvertMathJax: false,
            mermaid: true,
        });

        await expect(instance.renderMarkdown("```mermaid\ngraph TD\nA-->B\n```")).rejects.toThrow(
            "Mermaid 渲染已启用，但未配置 renderer",
        );
    });

    it("should leave Mermaid code blocks untouched when Mermaid is disabled", async () => {
        const instance = await createWenyanCore({
            isConvertMathJax: false,
            mermaid: false,
        });

        const result = await instance.renderMarkdown("```mermaid\ngraph TD\nA-->B\n```");

        expect(result).toContain("language-mermaid");
        expect(result).not.toContain('data-wenyan-diagram="mermaid"');
    });
});
