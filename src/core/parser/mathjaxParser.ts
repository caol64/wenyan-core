import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

import type { LiteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import type { MathDocument } from "mathjax-full/js/core/MathDocument.js";
import type { MathItem } from "mathjax-full/js/core/MathItem.js";

/* ---------------------------------- */
/* Types                              */
/* ---------------------------------- */

export interface MathJaxParserOptions {
    inlineMath?: [string, string][];
    displayMath?: [string, string][];
    fontCache?: "none" | "local" | "global";
}

/* ---------------------------------- */
/* Singleton HTML Handler Guard        */
/* ---------------------------------- */

// MathJax 的 HTMLHandler 是 **全局注册的**
let htmlHandlerRegistered = false;

/* ---------------------------------- */
/* Factory                            */
/* ---------------------------------- */

export function createMathJaxParser(options: MathJaxParserOptions = {}) {
    /* ---------- adaptor ---------- */

    const adaptor: LiteAdaptor = liteAdaptor();

    if (!htmlHandlerRegistered) {
        try {
            RegisterHTMLHandler(adaptor);
            htmlHandlerRegistered = true;
        } catch {
            // 已注册，忽略
        }
    }

    /* ---------- TeX / SVG ---------- */

    const tex = new TeX({
        inlineMath: options.inlineMath ?? [
            ["$", "$"],
            ["\\(", "\\)"],
        ],
        displayMath: options.displayMath ?? [
            ["$$", "$$"],
            ["\\[", "\\]"],
        ],
        processEscapes: true,
        packages: AllPackages,
    });

    const svg = new SVG({
        fontCache: options.fontCache ?? "none",
    });

    /* ---------- helpers ---------- */

    function addContainer(math: MathItem<any, any, any>, doc: MathDocument<any, any, any>) {
        const tag = math.display ? "section" : "span";
        const cls = math.display ? "block-equation" : "inline-equation";

        const container = math.typesetRoot;

        if (math.math) {
            doc.adaptor.setAttribute(container, "math", math.math);
        }

        const node = doc.adaptor.node(tag, { class: cls }, [container]);
        math.typesetRoot = node;
    }

    /* ---------- public API ---------- */

    return {
        parser(htmlString: string): string {
            const doc = mathjax.document(htmlString, {
                InputJax: tex,
                OutputJax: svg,
                renderActions: {
                    addContainer: [
                        190,
                        (doc: MathDocument<any, any, any>) => {
                            for (const math of doc.math) {
                                addContainer(math, doc);
                            }
                        },
                        addContainer,
                    ],
                },
            });

            doc.render();
            const body = adaptor.body(doc.document);
            return adaptor.innerHTML(body);
        },
    };
}
