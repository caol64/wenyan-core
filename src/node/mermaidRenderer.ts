import { JSDOM } from "jsdom";
import {
    createMermaidConfig,
    createMermaidRenderError,
    replaceMermaidCodeBlocks,
    type MermaidRenderer,
    type MermaidRendererFactoryOptions,
} from "../core/mermaid.js";

type MermaidModule = typeof import("mermaid");
type MermaidLike = MermaidModule["default"];
type MermaidRuntimeWindow = Window &
    typeof globalThis & {
        Element: typeof Element;
        HTMLElement: typeof HTMLElement;
        SVGElement: typeof SVGElement;
        Node: typeof Node;
        Document: typeof Document;
        DOMParser: typeof DOMParser;
        XMLSerializer: typeof XMLSerializer;
    };

export function createNodeMermaidRenderer(
    options: MermaidRendererFactoryOptions = {},
): MermaidRenderer {
    const dom = new JSDOM("<body></body>", { pretendToBeVisual: true });
    const runtimeWindow = dom.window as unknown as MermaidRuntimeWindow;
    let renderQueue: Promise<void> = Promise.resolve();
    let mermaidPromise: Promise<MermaidLike> | null = null;

    installMermaidGlobals(runtimeWindow);

    return {
        async renderHtml(html: string): Promise<string> {
            const task = renderQueue.then(async () => {
                const mermaid = await getMermaid();

                dom.window.document.body.innerHTML = html;

                try {
                    await replaceMermaidCodeBlocks(dom.window.document.body, async ({ id, code }) => {
                        const { svg } = await mermaid.render(id, code);
                        return svg;
                    });

                    return dom.window.document.body.innerHTML;
                } catch (error) {
                    throw createMermaidRenderError(error);
                } finally {
                    dom.window.document.body.innerHTML = "";
                }
            });

            renderQueue = task.then(
                () => undefined,
                () => undefined,
            );

            return await task;
        },
    };

    async function getMermaid(): Promise<MermaidLike> {
        if (!mermaidPromise) {
            mermaidPromise = import("mermaid").then((module) => module.default);
        }

        const mermaid = await mermaidPromise;

        mermaid.initialize(createMermaidConfig(options.mermaidConfig));

        return mermaid;
    }
}

function installMermaidGlobals(window: MermaidRuntimeWindow): void {
    ensureSvgPolyfills(window);

    const globals: Array<[keyof typeof globalThis, unknown]> = [
        ["window", window],
        ["document", window.document],
        ["navigator", window.navigator],
        ["Element", window.Element],
        ["HTMLElement", window.HTMLElement],
        ["SVGElement", window.SVGElement],
        ["Node", window.Node],
        ["Document", window.Document],
        ["DOMParser", window.DOMParser],
        ["XMLSerializer", window.XMLSerializer],
        ["getComputedStyle", window.getComputedStyle.bind(window)],
    ];

    for (const [key, value] of globals) {
        Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value,
        });
    }
}

function ensureSvgPolyfills(window: MermaidRuntimeWindow): void {
    const svgElementPrototype = window.SVGElement.prototype as SVGElement & {
        getBBox?: () => DOMRect;
        getComputedTextLength?: () => number;
    };

    if (!svgElementPrototype.getBBox) {
        Object.defineProperty(svgElementPrototype, "getBBox", {
            configurable: true,
            writable: true,
            value(this: SVGElement) {
                const tagName = this.tagName.toLowerCase();

                // 1. 文本元素：按字数估算宽高
                if (tagName === "text" || tagName === "tspan") {
                    const text = this.textContent ?? "";
                    const width = Math.max(text.length * 8, 16);
                    return {
                        x: 0, y: -16, width, height: 16,
                        top: -16, right: width, bottom: 0, left: 0,
                        toJSON() { return this; },
                    } satisfies DOMRect;
                }

                // 2. 隐藏或非结构元素：跳过
                if (tagName === "style" || tagName === "defs" || tagName === "marker") {
                    return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON() { return this; } };
                }

                // 3. 基础图形元素：尝试读取自身属性
                if (tagName === "rect" || tagName === "image") {
                    const w = parseFloat(this.getAttribute("width") || "0");
                    const h = parseFloat(this.getAttribute("height") || "0");
                    const x = parseFloat(this.getAttribute("x") || "0");
                    const y = parseFloat(this.getAttribute("y") || "0");
                    return { x, y, width: w, height: h, top: y, right: x + w, bottom: y + h, left: x, toJSON() { return this; } };
                }

                // 4. 容器元素 (<svg>, <g>)：递归计算子元素边界的并集
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                let hasChildren = false;

                for (let i = 0; i < this.children.length; i++) {
                    const child = this.children[i] as SVGElement & { getBBox?: () => DOMRect };
                    if (!child.getBBox) continue;

                    const childBox = child.getBBox();
                    if (childBox.width === 0 && childBox.height === 0) continue;

                    // 简单解析 Mermaid 常用的 translate 变换
                    let tx = 0, ty = 0;
                    const transform = child.getAttribute("transform");
                    if (transform) {
                        const match = transform.match(/translate\(([-0-9.]+)(?:[,\s]+([-0-9.]+))?\)/);
                        if (match) {
                            tx = parseFloat(match[1]);
                            ty = match[2] ? parseFloat(match[2]) : 0;
                        }
                    }

                    minX = Math.min(minX, childBox.x + tx);
                    minY = Math.min(minY, childBox.y + ty);
                    maxX = Math.max(maxX, childBox.x + childBox.width + tx);
                    maxY = Math.max(maxY, childBox.y + childBox.height + ty);
                    hasChildren = true;
                }

                if (!hasChildren) {
                    return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON() { return this; } };
                }

                return {
                    x: minX, y: minY, width: maxX - minX, height: maxY - minY,
                    top: minY, right: maxX, bottom: maxY, left: minX,
                    toJSON() { return this; },
                } satisfies DOMRect;
            },
        });
    }

    if (!svgElementPrototype.getComputedTextLength) {
        Object.defineProperty(svgElementPrototype, "getComputedTextLength", {
            configurable: true,
            writable: true,
            value(this: SVGElement) {
                const text = this.textContent ?? "";
                return Math.max(text.length * 8, 16);
            },
        });
    }
}
