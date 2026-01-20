import * as csstree from "css-tree";
import { parseOptions } from "../parser/cssParser.js";

type PseudoType = "before" | "after";

type PseudoStyleMap = Map<string, string>;

type PseudoRule = {
    before: PseudoStyleMap;
    after: PseudoStyleMap;
};

type PseudoRuleTable = Map<string, PseudoRule>;

export function applyPseudoElements(element: HTMLElement, themeCss: string): void {
    const ast = csstree.parse(themeCss, parseOptions);

    const rules = extractPseudoRules(ast);

    rules.forEach((rule, tag) => {
        const elements = element.querySelectorAll<HTMLElement>(tag);

        elements.forEach((el) => {
            const doc = el.ownerDocument;

            if (rule.before.size > 0) {
                el.insertBefore(buildPseudoElement(rule.before, doc), el.firstChild);
            }

            if (rule.after.size > 0) {
                el.appendChild(buildPseudoElement(rule.after, doc));
            }
        });
    });
}

function buildPseudoElement(originalResults: PseudoStyleMap, document: Document): HTMLElement {
    // 【核心修复】：克隆 Map，防止修改原始引用导致后续元素无法获取样式
    const beforeResults = new Map(originalResults);
    // 创建一个新的 <section> 元素
    const section: HTMLElement = document.createElement("section");

    // 将伪类的内容和样式应用到元素
    const content = beforeResults.get("content");
    if (content) {
        // 移除引号
        section.textContent = content.replace(/['"]/g, "");
        beforeResults.delete("content");
    }

    for (const [k, v] of beforeResults) {
        if (v.includes("url(")) {
            // RegExpMatchArray | null
            const svgMatch = v.match(/data:image\/svg\+xml;utf8,(.*<\/svg>)/);
            const base64SvgMatch = v.match(/data:image\/svg\+xml;base64,([^"'\)]*)["']?\)/);
            const httpMatch = v.match(/(?:"|')?(https?[^"'\)]*)(?:"|')?\)/);

            if (svgMatch) {
                const svgCode = decodeURIComponent(svgMatch[1]);
                section.innerHTML = svgCode;
            } else if (base64SvgMatch) {
                // atob 是浏览器环境的全局函数
                const decodedString = atob(base64SvgMatch[1]);
                section.innerHTML = decodedString;
            } else if (httpMatch) {
                const img: HTMLImageElement = document.createElement("img");
                img.src = httpMatch[1];
                img.setAttribute("style", "vertical-align: top;");
                section.appendChild(img);
            }

            // 处理完特殊 url 样式后，将其从 Map 中删除，以免后续被作为普通 CSS 文本写入 style
            beforeResults.delete(k);
        }
    }

    // 将剩余的 Map 条目转换为 CSS 字符串
    const entries = Array.from(beforeResults.entries());
    const cssString = entries.map(([key, value]) => `${key}: ${value}`).join("; ");

    section.style.cssText = cssString;

    return section;
}

function extractPseudoRules(ast: csstree.CssNode): PseudoRuleTable {
    const table: PseudoRuleTable = new Map();

    csstree.walk(ast, {
        visit: "Rule",
        enter(node) {
            const selector = csstree.generate(node.prelude);

            const match = selector.match(/(^|\s)(h[1-6]|blockquote|pre)::(before|after)\b/);
            if (!match) return;

            const tag = match[2];
            const pseudo = match[3] as PseudoType;

            let record = table.get(tag);
            if (!record) {
                record = {
                    before: new Map(),
                    after: new Map(),
                };
                table.set(tag, record);
            }

            extractDeclarations(node, record[pseudo]);
        },
    });

    return table;
}

function extractDeclarations(ruleNode: csstree.Rule, result: PseudoStyleMap): void {
    csstree.walk(ruleNode.block, {
        visit: "Declaration",
        enter(decl) {
            const property = decl.property;
            const value = csstree.generate(decl.value);
            result.set(property, value);
        },
    });
}
