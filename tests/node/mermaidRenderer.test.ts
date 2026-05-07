import { describe, expect, it } from "vitest";
import { createWenyanCore } from "../../src/core";
import { createNodeMermaidRenderer } from "../../src/node/mermaidRenderer";

describe("node Mermaid renderer", () => {
    it("should render Mermaid HTML blocks into SVG", async () => {
        const renderer = createNodeMermaidRenderer();

        const result = await renderer.renderHtml(
            "<pre><code class=\"hljs language-mermaid\">graph TD\nA--&gt;B\n</code></pre>",
        );

        expect(result).toContain('data-wenyan-diagram="mermaid"');
        expect(result).toContain("<svg");
        expect(result).not.toContain("language-mermaid");
        expect(result).not.toContain("foreignObject");
    });

    it("should integrate with the core render pipeline", async () => {
        const instance = await createWenyanCore({
            isConvertMathJax: false,
            mermaid: {
                enabled: true,
                renderer: createNodeMermaidRenderer(),
            },
        });

        const result = await instance.renderMarkdown("```mermaid\ngraph TD\nA-->B\n```");

        expect(result).toContain('data-wenyan-diagram="mermaid"');
        expect(result).toContain("<svg");
        expect(result).not.toContain("foreignObject");
    });

    it("should allow callers to opt back into htmlLabels", async () => {
        const renderer = createNodeMermaidRenderer({
            mermaidConfig: {
                htmlLabels: true,
                flowchart: {
                    htmlLabels: true,
                },
            },
        });

        const result = await renderer.renderHtml(
            "<pre><code class=\"hljs language-mermaid\">graph TD\nA--&gt;B\n</code></pre>",
        );

        expect(result).toContain("foreignObject");
    });

    it("should surface Mermaid syntax errors", async () => {
        const instance = await createWenyanCore({
            isConvertMathJax: false,
            mermaid: {
                enabled: true,
                renderer: createNodeMermaidRenderer(),
            },
        });

        await expect(instance.renderMarkdown("```mermaid\ngraph TD\nA-->\n```")).rejects.toThrow(
            "Mermaid 图表渲染失败",
        );
    });

    it("should reserve more width for CJK labels", async () => {
        const renderer = createNodeMermaidRenderer();

        const result = await renderer.renderHtml(
            "<pre><code class=\"hljs language-mermaid\">graph LR\nA[中文节点] --> B[第二个节点]\n</code></pre>",
        );

        const widths = Array.from(
            result.matchAll(/<rect class="basic label-container"[^>]* width="([^"]+)"/g),
            (match) => Number.parseFloat(match[1]),
        );

        expect(widths[0]).toBeGreaterThan(110);
        expect(widths[1]).toBeGreaterThan(125);
    });
});
