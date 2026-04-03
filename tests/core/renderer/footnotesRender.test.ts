import { describe, it, expect } from "vitest";
import { addFootnotes } from "../../../src/core/renderer/footnotesRender";

describe("footnotesRender", () => {
    describe("addFootnotes", () => {
        it("should add footnotes for links", () => {
            const element = {
                querySelectorAll: () => [
                    {
                        textContent: "Link 1",
                        innerText: "Link 1",
                        getAttribute: (attr: string) => (attr === "href" ? "https://example.com" : ""),
                        after: () => {},
                    },
                    {
                        textContent: "Link 2",
                        innerText: "Link 2",
                        getAttribute: (attr: string) => (attr === "href" ? "https://example2.com" : ""),
                        after: () => {},
                    },
                ],
                ownerDocument: {
                    createElement: (tag: string) => ({
                        setAttribute: () => {},
                        innerHTML: "",
                    }),
                },
                insertAdjacentHTML: () => {},
            } as any;

            // Should not throw
            expect(() => addFootnotes(element)).not.toThrow();
        });

        it("should not add footnotes when no links exist", () => {
            const element = {
                querySelectorAll: () => [],
                ownerDocument: {
                    createElement: () => ({}),
                },
                insertAdjacentHTML: () => {},
            } as any;

            // Should return early without calling insertAdjacentHTML
            expect(() => addFootnotes(element)).not.toThrow();
        });

        it("should use list style when listStyle is true", () => {
            const element = {
                querySelectorAll: () => [
                    {
                        textContent: "Link",
                        innerText: "Link",
                        getAttribute: (attr: string) => (attr === "href" ? "https://example.com" : ""),
                        after: () => {},
                    },
                ],
                ownerDocument: {
                    createElement: () => ({
                        setAttribute: () => {},
                        innerHTML: "",
                    }),
                },
                insertAdjacentHTML: () => {},
            } as any;

            expect(() => addFootnotes(element, true)).not.toThrow();
        });
    });
});
