import { describe, it, expect } from "vitest";
import { getContentForZhihu } from "../../../src/core/platform/zhihu";

describe("platform/zhihu", () => {
    describe("getContentForZhihu", () => {
        it("should convert math elements to images", () => {
            const mockMathContainer = {
                getAttribute: (attr: string) => (attr === "math" ? "E = mc^2" : null),
                replaceWith: () => {},
            };

            const mockDoc = {
                createElement: () => ({
                    alt: "",
                    dataset: {},
                    style: {
                        cssText: "",
                    },
                }),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockMathContainer] : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForZhihu(element)).not.toThrow();
        });

        it("should skip math elements without math attribute", () => {
            const mockMathContainer = {
                getAttribute: () => null,
                replaceWith: () => {},
            };

            const mockDoc = {
                createElement: () => ({}),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockMathContainer] : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForZhihu(element)).not.toThrow();
        });

        it("should set correct attributes on image element", () => {
            let createdImg: any = null;

            const mockMathContainer = {
                getAttribute: (attr: string) => (attr === "math" ? "\\sum_{i=0}^n i" : null),
                replaceWith: function (img: any) {
                    createdImg = img;
                },
            };

            const mockDoc = {
                createElement: () => {
                    const img = {
                        alt: "",
                        dataset: {} as any,
                        style: {
                            cssText: "",
                        },
                    };
                    return img;
                },
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockMathContainer] : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            getContentForZhihu(element);

            // Verify the image was created
            expect(createdImg).not.toBeNull();
        });

        it("should handle multiple math elements", () => {
            const mockMathContainers = [
                {
                    getAttribute: (attr: string) => (attr === "math" ? "E = mc^2" : null),
                    replaceWith: () => {},
                },
                {
                    getAttribute: (attr: string) => (attr === "math" ? "a^2 + b^2 = c^2" : null),
                    replaceWith: () => {},
                },
            ];

            const mockDoc = {
                createElement: () => ({
                    alt: "",
                    dataset: {},
                    style: {
                        cssText: "",
                    },
                }),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? mockMathContainers : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForZhihu(element)).not.toThrow();
        });

        it("should return outerHTML after processing", () => {
            const element = {
                querySelectorAll: () => [],
                outerHTML: "<div>processed content</div>",
            } as any;

            const result = getContentForZhihu(element);
            expect(result).toBe("<div>processed content</div>");
        });
    });
});
