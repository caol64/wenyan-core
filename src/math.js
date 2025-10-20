import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const texConfig = {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    packages: AllPackages
};

const svgConfig = {
    fontCache: 'none'
};

let adaptor;
if (!adaptor) {
    adaptor = liteAdaptor();
    try {
        RegisterHTMLHandler(adaptor);
    } catch (e) {
        // 已经注册过了就忽略
    }
}
RegisterHTMLHandler(adaptor);
const tex = new TeX(texConfig);
const svg = new SVG(svgConfig);

function addContainer(math, doc) {
    const tag = math.display ? 'section' : 'span';
    const cls = math.display ? 'block-equation' : 'inline-equation';
    const container = math.typesetRoot;
    if (math.math) {
        doc.adaptor.setAttribute(container, 'math', math.math);
    }
    const node = doc.adaptor.node(tag, { class: cls }, [container]);
    math.typesetRoot = node;
}

export async function renderMathInHtml(htmlString) {
    try {
        const html = mathjax.document(htmlString, {
            InputJax: tex,
            OutputJax: svg,
            renderActions: {
                addContainer: [190, (doc) => {for (const math of doc.math) {addContainer(math, doc)}}, addContainer]
            }
        });
        html.render();
        const body = adaptor.body(html.document);
        return adaptor.innerHTML(body);
    } catch (error) {
        console.error("Error rendering MathJax:", error);
        throw error;
    }
}
