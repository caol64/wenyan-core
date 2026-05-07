import { describe, it, expect } from "vitest";
import { applyPseudoElements } from "../../../src/core/renderer/pseudoApplyRender";

describe("pseudoApplyRender", () => {
    describe("applyPseudoElements", () => {
        it("should apply pseudo elements to matching elements", () => {
            const css = `
                h1::before {
                    content: "Chapter";
                    color: blue;
                }
                h1::after {
                    content: "";
                    display: block;
                }
            `;

            const mockH1Element = {
                ownerDocument: {
                    createElement: () => ({
                        textContent: "",
                        style: {
                            cssText: "",
                        },
                    }),
                },
                firstChild: null,
                insertBefore: () => {},
                appendChild: () => {},
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "h1" ? [mockH1Element] : []),
            } as any;

            expect(() => applyPseudoElements(element, css)).not.toThrow();
        });

        it("should handle blockquote pseudo elements", () => {
            const css = `
                blockquote::before {
                    content: """;
                    font-size: 24px;
                }
            `;

            const mockBlockquoteElement = {
                ownerDocument: {
                    createElement: () => ({
                        textContent: "",
                        style: {
                            cssText: "",
                        },
                    }),
                },
                firstChild: null,
                insertBefore: () => {},
                appendChild: () => {},
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "blockquote" ? [mockBlockquoteElement] : [],
            } as any;

            expect(() => applyPseudoElements(element, css)).not.toThrow();
        });

        it("should handle pre pseudo elements", () => {
            const css = `
                pre::before {
                    content: "";
                    background: #f5f5f5;
                }
            `;

            const mockPreElement = {
                ownerDocument: {
                    createElement: () => ({
                        textContent: "",
                        style: {
                            cssText: "",
                        },
                    }),
                },
                firstChild: null,
                insertBefore: () => {},
                appendChild: () => {},
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "pre" ? [mockPreElement] : []),
            } as any;

            expect(() => applyPseudoElements(element, css)).not.toThrow();
        });

        it("should handle URL-based content", () => {
            const css = `
                h1::before {
                    content: url("https://example.com/icon.svg");
                }
            `;

            const mockH1Element = {
                ownerDocument: {
                    createElement: () => ({
                        textContent: "",
                        style: {
                            cssText: "",
                        },
                        appendChild: () => {},
                    }),
                },
                firstChild: null,
                insertBefore: () => {},
                appendChild: () => {},
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "h1" ? [mockH1Element] : []),
            } as any;

            expect(() => applyPseudoElements(element, css)).not.toThrow();
        });

        it("should handle empty CSS", () => {
            const element = {
                querySelectorAll: () => [],
            } as any;

            expect(() => applyPseudoElements(element, "")).not.toThrow();
        });
    });
});
