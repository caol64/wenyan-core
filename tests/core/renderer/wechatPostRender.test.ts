import { JSDOM } from "jsdom";
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

        it("should inline Mermaid styles into the SVG tree", () => {
            const dom = new JSDOM(`<!DOCTYPE html>
                <section id="wenyan">
                    <figure data-wenyan-diagram="mermaid">
                        <svg id="wenyan-mermaid-1" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid red;">
                            <style>
                                #wenyan-mermaid-1 { font-family: "trebuchet ms"; fill: #333; }
                                #wenyan-mermaid-1 .node rect { fill: #ECECFF; stroke: #9370DB; stroke-width: 1px; }
                                #wenyan-mermaid-1 .label span { color: #333; }
                                :root { --mermaid-font-family: "trebuchet ms"; }
                                @keyframes dash { to { stroke-dashoffset: 0; } }
                            </style>
                            <g class="node">
                                <rect style="opacity: 0.5;"></rect>
                            </g>
                            <foreignObject width="20" height="20">
                                <div xmlns="http://www.w3.org/1999/xhtml" class="label">
                                    <span style="font-weight: 600;">A</span>
                                </div>
                            </foreignObject>
                        </svg>
                    </figure>
                </section>`);
            const element = dom.window.document.getElementById("wenyan") as HTMLElement;

            wechatPostRender(element);

            const svg = element.querySelector("svg") as SVGSVGElement;
            const rect = svg.querySelector("rect");
            const span = svg.querySelector("span");

            expect(svg.querySelector("style")).toBeNull();
            expect(svg.style.maxWidth).toBe("100%");
            expect(svg.style.height).toBe("auto");
            expect(svg.style.getPropertyValue("font-family")).toContain("trebuchet ms");
            expect(svg.style.getPropertyValue("fill")).toBe("#333");
            expect(svg.style.getPropertyValue("--mermaid-font-family")).toContain("trebuchet ms");
            expect(rect?.style.getPropertyValue("opacity")).toBe("0.5");
            expect(rect?.style.getPropertyValue("fill")).toBe("#ECECFF");
            expect(rect?.style.getPropertyValue("stroke")).toBe("#9370DB");
            expect(rect?.style.getPropertyValue("stroke-width")).toBe("1px");
            expect(span?.style.getPropertyValue("font-weight")).toBe("600");
            expect(span?.style.getPropertyValue("color")).toBe("rgb(51, 51, 51)");
        });

        it("should flatten Mermaid markers into regular SVG shapes", () => {
            const dataPoints = Buffer.from(
                JSON.stringify([
                    { x: 10, y: 10 },
                    { x: 10, y: 40 },
                ]),
                "utf8",
            ).toString("base64");
            const dom = new JSDOM(`<!DOCTYPE html>
                <section id="wenyan">
                    <figure data-wenyan-diagram="mermaid">
                        <svg xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" style="fill: #333333; stroke: #333333;">
                                    <path d="M 0 0 L 10 5 L 0 10 z" style="stroke-width: 1;"></path>
                                </marker>
                                <path
                                    d="M10,10L10,40"
                                    data-points="${dataPoints}"
                                    marker-end="url(#arrow-end)"
                                    style="stroke: #333333; fill: none;"
                                ></path>
                            </g>
                        </svg>
                    </figure>
                </section>`);
            const element = dom.window.document.getElementById("wenyan") as HTMLElement;

            wechatPostRender(element);

            const svg = element.querySelector("svg") as SVGSVGElement;
            const edge = svg.querySelector("path[d='M10,10L10,40']");
            const flattenedMarker = svg.querySelector('[data-wenyan-marker="end"]');

            expect(edge?.hasAttribute("marker-end")).toBe(false);
            expect(svg.querySelector("marker")).toBeNull();
            expect(flattenedMarker).not.toBeNull();
            expect(flattenedMarker?.getAttribute("transform")).toContain("translate(10 36)");
            expect(flattenedMarker?.getAttribute("transform")).toContain("rotate(90)");
            expect(flattenedMarker?.querySelector("path")?.getAttribute("d")).toBe("M 0 0 L 10 5 L 0 10 z");
        });
    });
});
