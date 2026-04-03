import { describe, it, expect } from "vitest";
import { getContentForToutiao } from "../../../src/core/platform/toutiao";

describe("platform/toutiao", () => {
    describe("getContentForToutiao", () => {
        it("should convert math containers to images", () => {
            const mockSvg = {
                outerHTML: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>',
                hasAttribute: () => true,
                setAttribute: () => {},
                getAttribute: () => "vertical-align: middle",
            };

            const mockContainer = {
                querySelector: () => mockSvg,
                getAttribute: () => "Formula",
                replaceWith: () => {},
            };

            const mockDoc = {
                createElement: () => ({
                    src: "",
                    style: {
                        verticalAlign: "",
                    },
                    setAttribute: () => {},
                    alt: "",
                }),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockContainer] : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForToutiao(element)).not.toThrow();
        });

        it("should skip containers without svg", () => {
            const mockContainer = {
                querySelector: () => null,
                replaceWith: () => {},
            };

            const mockDoc = {
                createElement: () => ({}),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockContainer] : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForToutiao(element)).not.toThrow();
        });

        it("should add xmlns if not present", () => {
            let xmlnsAdded = false;

            const mockSvg = {
                outerHTML: "<svg>...</svg>",
                hasAttribute: (attr: string) => attr === "xmlns" ? false : true,
                setAttribute: (attr: string, value: string) => {
                    if (attr === "xmlns") xmlnsAdded = true;
                },
                getAttribute: () => null,
            };

            const mockContainer = {
                querySelector: () => mockSvg,
                getAttribute: () => null,
                replaceWith: () => {},
            };

            const mockDoc = {
                createElement: () => ({
                    src: "",
                    style: {
                        verticalAlign: "",
                    },
                    setAttribute: () => {},
                    alt: "",
                }),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockContainer] : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            getContentForToutiao(element);
            expect(xmlnsAdded).toBe(true);
        });

        it("should preserve aria-label for accessibility", () => {
            let imgAlt = "";

            const mockSvg = {
                outerHTML: '<svg>...</svg>',
                hasAttribute: () => true,
                setAttribute: () => {},
                getAttribute: () => null,
            };

            const mockContainer = {
                querySelector: () => mockSvg,
                getAttribute: (attr: string) => attr === "aria-label" ? "Math Formula" : null,
                replaceWith: function (img: any) {
                    imgAlt = img.alt;
                },
            };

            const mockDoc = {
                createElement: () => ({
                    src: "",
                    style: {
                        verticalAlign: "",
                    },
                    setAttribute: () => {},
                    alt: "",
                }),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? [mockContainer] : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            getContentForToutiao(element);
            expect(imgAlt).toBe("Math Formula");
        });

        it("should handle multiple math containers", () => {
            const mockContainers = [
                {
                    querySelector: () => ({
                        outerHTML: "<svg>...</svg>",
                        hasAttribute: () => true,
                        setAttribute: () => {},
                        getAttribute: () => null,
                    }),
                    getAttribute: () => null,
                    replaceWith: () => {},
                },
                {
                    querySelector: () => ({
                        outerHTML: "<svg>...</svg>",
                        hasAttribute: () => true,
                        setAttribute: () => {},
                        getAttribute: () => null,
                    }),
                    getAttribute: () => null,
                    replaceWith: () => {},
                },
            ];

            const mockDoc = {
                createElement: () => ({
                    src: "",
                    style: {
                        verticalAlign: "",
                    },
                    setAttribute: () => {},
                    alt: "",
                }),
            };

            const element = {
                querySelectorAll: (selector: string) =>
                    selector === "mjx-container" ? mockContainers : [],
                ownerDocument: mockDoc,
                outerHTML: "<div>test</div>",
            } as any;

            expect(() => getContentForToutiao(element)).not.toThrow();
        });

        it("should return outerHTML after processing", () => {
            const element = {
                querySelectorAll: () => [],
                outerHTML: "<div>processed content</div>",
            } as any;

            const result = getContentForToutiao(element);
            expect(result).toBe("<div>processed content</div>");
        });
    });
});
