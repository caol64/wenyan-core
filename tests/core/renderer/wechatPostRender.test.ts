import { describe, it, expect } from "vitest";
import { wechatPostRender } from "../../../src/core/renderer/wechatPostRender";

describe("wechatPostRender", () => {
    describe("wechatPostRender", () => {
        it("should process math elements", () => {
            const mockSvg = {
                style: {} as any,
                getAttribute: (attr: string) => (attr === "width" ? "100" : attr === "height" ? "50" : null),
                removeAttribute: () => {},
            };

            const mockMathContainer = {
                querySelector: () => mockSvg,
                parentElement: {
                    classList: {
                        contains: () => false,
                    },
                    appendChild: () => {},
                    setAttribute: () => {},
                },
                remove: () => {},
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockMathContainer] : [],
                style: {} as any,
            } as any;

            expect(() => wechatPostRender(element)).not.toThrow();
        });

        it("should process code elements", () => {
            const mockCodeElement = {
                innerHTML: "import sys\nprint('hello')",
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "pre code" ? [mockCodeElement] : []),
                style: {} as any,
            } as any;

            expect(() => wechatPostRender(element)).not.toThrow();
        });

        it("should process list elements", () => {
            const mockLiElement = {
                firstChild: null,
                appendChild: () => {},
            };

            const mockDoc = {
                createElement: () => ({
                    appendChild: () => {},
                }),
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "li" ? [mockLiElement] : []),
                ownerDocument: mockDoc,
                style: {} as any,
            } as any;

            expect(() => wechatPostRender(element)).not.toThrow();
        });

        it("should set font color to black", () => {
            const element = {
                querySelectorAll: () => [],
                style: {
                    color: "",
                    caretColor: "",
                },
            } as any;

            wechatPostRender(element);

            expect(element.style.color).toBe("rgb(0, 0, 0)");
            expect(element.style.caretColor).toBe("rgb(0, 0, 0)");
        });

        it("should handle block equation containers", () => {
            const mockSvg = {
                style: {} as any,
                getAttribute: (attr: string) => (attr === "width" ? "100" : attr === "height" ? "50" : null),
                removeAttribute: () => {},
            };

            const mockParent = {
                classList: {
                    contains: (cls: string) => cls === "block-equation",
                },
                appendChild: () => {},
                setAttribute: () => {},
            };

            const mockMathContainer = {
                querySelector: () => mockSvg,
                parentElement: mockParent,
                remove: () => {},
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockMathContainer] : [],
                style: {} as any,
            } as any;

            expect(() => wechatPostRender(element)).not.toThrow();
        });

        it("should handle empty element", () => {
            const element = {
                querySelectorAll: () => [],
                style: {
                    color: "",
                    caretColor: "",
                },
            } as any;

            expect(() => wechatPostRender(element)).not.toThrow();
        });
    });
});
