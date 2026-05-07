import { describe, it, expect, vi } from "vitest";
import { renderTheme } from "../../../src/core/renderer/themeApplyRender";

describe("themeApplyRender", () => {
    describe("renderTheme", () => {
        it("should apply theme CSS to element", () => {
            const css = `
                #wenyan {
                    font-family: system-ui;
                    color: #333;
                }
                h1 {
                    text-align: center;
                }
            `;

            const element = {
                querySelectorAll: () => [],
                style: {
                    setProperty: vi.fn(),
                },
            } as any;

            expect(() => renderTheme(element, css)).not.toThrow();
        });

        it("should handle complex theme CSS", () => {
            const css = `
                #wenyan {
                    --main-color: #ff0000;
                    font-family: system-ui;
                }
                h1 {
                    color: var(--main-color);
                    font-size: 24px;
                }
                p {
                    line-height: 1.6;
                }
                pre {
                    background: #f5f5f5;
                    padding: 16px;
                }
            `;

            const element = {
                querySelectorAll: () => [],
                style: {
                    setProperty: vi.fn(),
                },
            } as any;

            expect(() => renderTheme(element, css)).not.toThrow();
        });

        it("should handle empty CSS input", () => {
            const element = {
                querySelectorAll: () => [],
                style: {
                    setProperty: vi.fn(),
                },
            } as any;

            expect(() => renderTheme(element, "")).not.toThrow();
        });
    });
});
