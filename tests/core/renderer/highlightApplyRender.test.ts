import { describe, it, expect, vi } from "vitest";
import { renderHighlightTheme } from "../../../src/core/renderer/highlightApplyRender";

describe("highlightApplyRender", () => {
    describe("renderHighlightTheme", () => {
        it("should apply highlight CSS to element", () => {
            const css = `
                .hljs {
                    background: #f5f5f5;
                    color: #333;
                }
                .hljs-keyword {
                    color: #d73a49;
                }
            `;

            const element = {
                querySelectorAll: () => [],
                style: {
                    setProperty: vi.fn(),
                },
            } as any;

            // Should not throw
            expect(() => renderHighlightTheme(element, css)).not.toThrow();
        });

        it("should handle empty CSS input", () => {
            const element = {
                querySelectorAll: () => [],
                style: {
                    setProperty: vi.fn(),
                },
            } as any;

            expect(() => renderHighlightTheme(element, "")).not.toThrow();
        });
    });
});
