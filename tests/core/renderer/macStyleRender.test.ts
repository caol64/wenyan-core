import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderMacStyle } from "../../../src/core/renderer/macStyleRender";
import * as macStyleRegistry from "../../../src/core/theme/macStyleRegistry";

describe("macStyleRender", () => {
    describe("renderMacStyle", () => {
        beforeEach(() => {
            vi.spyOn(macStyleRegistry, "getMacStyleCss").mockReturnValue(`
                pre {
                    border-radius: 5px;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.55);
                }
            `);
        });

        it("should apply mac style CSS to element", () => {
            const element = {
                querySelectorAll: () => [],
                style: {
                    setProperty: vi.fn(),
                },
            } as any;

            expect(() => renderMacStyle(element)).not.toThrow();
        });

        it("should handle element with pre tags", () => {
            const mockPreElement = {
                style: {
                    setProperty: vi.fn(),
                },
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "pre" ? [mockPreElement] : []),
                style: {
                    setProperty: vi.fn(),
                },
            } as any;

            expect(() => renderMacStyle(element)).not.toThrow();
        });
    });
});
