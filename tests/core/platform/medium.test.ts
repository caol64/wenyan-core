import { describe, it, expect } from "vitest";
import { getContentForMedium } from "../../../src/core/platform/medium";

describe("platform/medium", () => {
    describe("getContentForMedium", () => {
        it("should process blockquotes", () => {
            const mockBlockquote = {
                querySelectorAll: () => [
                    {
                        textContent: "Quote text",
                        replaceWith: () => {},
                    },
                ],
            };

            const element = {
                querySelectorAll: (selector: string) => {
                    if (selector === "blockquote p") return mockBlockquote.querySelectorAll();
                    return [];
                },
                ownerDocument: {
                    createElement: (tag: string) => ({
                        textContent: "",
                    }),
                },
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForMedium(element)).not.toThrow();
        });

        it("should process code blocks", () => {
            const mockCode = {
                classList: {
                    forEach: (cb: (cls: string) => void) => cb("language-javascript"),
                    contains: () => true,
                },
                textContent: "const x = 1;\nconsole.log(x);",
            };

            const mockPre = {
                setAttribute: () => {},
                querySelector: () => mockCode,
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "pre" ? [mockPre] : []),
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForMedium(element)).not.toThrow();
        });

        it("should process tables", () => {
            const mockPre = {
                appendChild: () => {},
                setAttribute: () => {},
            };

            const mockTable = {
                querySelectorAll: (selector: string) => {
                    if (selector === "tr") {
                        return [
                            {
                                querySelectorAll: () => [
                                    { innerText: "Header 1" },
                                    { innerText: "Header 2" },
                                ],
                            },
                            {
                                querySelectorAll: () => [
                                    { innerText: "Cell 1" },
                                    { innerText: "Cell 2" },
                                ],
                            },
                        ];
                    }
                    return [];
                },
            };

            const mockDoc = {
                createElement: (tag: string) => {
                    if (tag === "pre") return mockPre;
                    return {
                        textContent: "",
                        appendChild: () => {},
                        setAttribute: () => {},
                    };
                },
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "table" ? [mockTable] : []),
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForMedium(element)).not.toThrow();
        });

        it("should process math elements", () => {
            const mockParent = {
                appendChild: () => {},
            };

            const mockMathContainer = {
                getAttribute: (attr: string) => (attr === "math" ? "E = mc^2" : null),
                parentElement: mockParent,
                remove: () => {},
                ownerDocument: {
                    createElement: () => ({
                        textContent: "",
                    }),
                },
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockMathContainer] : [],
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForMedium(element)).not.toThrow();
        });

        it("should process nested lists", () => {
            const mockNestedUl = {
                querySelectorAll: () => [],
                children: [],
                outerHTML: "",
            };

            const element = {
                querySelectorAll: (selector: string) => (selector === "ul ul" ? [mockNestedUl] : []),
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForMedium(element)).not.toThrow();
        });

        it("should return outerHTML after processing", () => {
            const element = {
                querySelectorAll: () => [],
                outerHTML: "<div>processed content</div>",
            } as any;

            const result = getContentForMedium(element);
            expect(result).toBe("<div>processed content</div>");
        });
    });
});
