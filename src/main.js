import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import fm from "front-matter";
import * as csstree from "css-tree";

import { renderMathInHtml } from "./math.js";
import macStyleCss from "./mac_style.css?raw";
import { themes } from "./theme.js";
import { hlThemes } from "./hltheme.js";

// --- Constants ---
export const serif = "Georgia, Cambria, 'Noto Serif', 'Times New Roman', serif";
export const sansSerif = "system-ui, 'Apple Color Emoji', 'Segoe UI', 'Segoe UI Symbol', 'Noto Sans', 'Roboto', sans-serif";
export const monospace = "Menlo, Monaco, Consolas, 'Liberation Mono', 'Roboto Mono', 'Courier New', 'Microsoft YaHei', monospace";

// --- Marked.js Configuration ---
export function configureMarked() {
    // marked.setOptions(marked.getDefaults());
    // ----------- 代码高亮 -----------
    const highlightExtension = markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: "hljs language-",
        highlight: function(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    });

    marked.use(highlightExtension);

    // ----------- 自定义图片语法扩展 ![](){...} -----------
    const attributeImageExtension = {
        name: "attributeImage",
        level: "inline",
        start(src) {
            return src.indexOf("![");
        },
        tokenizer(src) {
            const rule = /^!\[([^\]]*)\]\(([^)]+)\)\{(.*?)\}/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: "attributeImage",
                    raw: match[0],
                    alt: match[1],
                    href: match[2],
                    attrs: match[3],
                };
            }
        },
        renderer(token) {
            const attrs = stringToMap(token.attrs);
            const attrStr = Array.from(attrs)
                .map(([k, v]) =>
                    /^\d+$/.test(v) ? `${k}:${v}px` : `${k}:${v}`
                )
                .join("; ");
            return `<img src="${token.href}" alt="${token.alt || ""}" title="${token.alt || ""}" style="${attrStr}">`;
        },
    };

    marked.use({ extensions: [attributeImageExtension] });

    // ----------- 自定义渲染器 -----------
    const renderer = marked.Renderer;
    const parser = marked.Parser;

    // 重写渲染标题的方法（h1 ~ h6）
    renderer.heading = function (heading) {
        const text = parser.parseInline(heading.tokens);
        const level = heading.depth;
        return `<h${level}><span>${text}</span></h${level}>\n`;
    };

    // 重写渲染paragraph的方法以更好的显示行间公式
    renderer.paragraph = function (paragraph) {
        const text = paragraph.text;
        if (text.length > 4 && (/\$\$[\s\S]*?\$\$/g.test(text) || /\\\[[\s\S]*?\\\]/g.test(text))) {
            return `${text}\n`;
        } else {
            return `<p>${parser.parseInline(paragraph.tokens)}</p>\n`;
        }
    };

    renderer.image = function (token, title, text) {
        const src = token.href;
        return `<img src="${src}" alt="${token.text || ""}" title="${token.text || ""}">`;
    };

    marked.use({ renderer });
}

// 辅助函数：把 "{width=100 height=200}" 字符串转成 Map
function stringToMap(str) {
    const map = new Map();
    str.split(/\s+/).forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key && value) {
            map.set(key, value.replace(/^["']|["']$/g, "")); // 去掉引号
        }
    });
    return map;
}

export function handleFrontMatter(markdown) {
    const { attributes, body } = fm(markdown);
    const result = {};
    let head = "";
    const { title, description, cover } = attributes;
    if (title) {
        result.title = title;
    }
    if (description) {
        head += "> " + description + "\n\n";
        result.description = description;
    }
    if (cover) {
        result.cover = cover;
    }
    result.body = head + body;
    return result;
}

export async function renderMarkdown(content) {
    const html = marked.parse(content);
    const htmlWithMath = await renderMathInHtml(html);
    return htmlWithMath;
}

export async function getContentForGzhBuiltinTheme(wenyanElement, themeId, hlThemeId, isMacStyle = true, isAddFootnote = true) {
    let theme = themes["default"];
    if (themeId) {
        theme = themes[themeId];
        if (!theme) {
            theme = Object.values(themes).find(
                t => t.name.toLowerCase() === themeId.toLowerCase()
            );
        }
    }
    if (!theme) {
        throw new Error("主题不存在");
    }
    if (!(hlThemeId in hlThemes)) {
        throw new Error("代码块主题不存在");
    }
    const customCss = replaceCSSVariables(await theme.getCss());
    const hlTheme = hlThemes[hlThemeId];
    const highlightCss = await hlTheme.getCss();
    return getContentForGzhCustomCss(wenyanElement, customCss, highlightCss, isMacStyle, isAddFootnote);
}

export async function getContentForGzhCustomCss(wenyanElement, customCss, highlightCss, isMacStyle = true, isAddFootnote = true) {
    if (isAddFootnote) {
        addFootnotes(false, wenyanElement);
    }
    customCss = modifyCss(customCss, {
        '#wenyan pre code': [
            {
                property: 'font-family',
                value: monospace,
                append: true
            }
        ],
        '#wenyan pre': [
            {
                property: 'font-size',
                value: "12px",
                append: true
            }
        ]
    });
    const ast = csstree.parse(customCss, {
        context: "stylesheet",
        positions: false,
        parseAtrulePrelude: false,
        parseCustomProperty: false,
        parseValue: false,
    });

    const ast1 = csstree.parse(highlightCss, {
        context: "stylesheet",
        positions: false,
        parseAtrulePrelude: false,
        parseCustomProperty: false,
        parseValue: false,
    });

    ast.children.appendList(ast1.children);

    if (isMacStyle) {
        const ast2 = csstree.parse(macStyleCss, {
            context: 'stylesheet',
            positions: false,
            parseAtrulePrelude: false,
            parseCustomProperty: false,
            parseValue: false
        });
        ast.children.appendList(ast2.children);
    }

    csstree.walk(ast, {
        visit: "Rule",
        enter(node, item, list) {
            const selectorList = node.prelude.children;
            if (selectorList) {
                selectorList.forEach((selectorNode) => {
                    const selector = csstree.generate(selectorNode);
                    const declarations = node.block.children.toArray();
                    if (selector === "#wenyan") {
                        declarations.forEach((decl) => {
                            const value = csstree.generate(decl.value);
                            wenyanElement.style[decl.property] = value;
                        });
                    } else {
                        const elements = wenyanElement.querySelectorAll(selector);
                        elements.forEach((element) => {
                            declarations.forEach((decl) => {
                                const value = csstree.generate(decl.value);
                                element.style[decl.property] = value;
                            });
                        });
                    }
                });
            }
        },
    });

    // 处理公式
    let elements = wenyanElement.querySelectorAll("mjx-container");
    elements.forEach((element) => {
        const svg = element.querySelector("svg");
        svg.style.width = svg.getAttribute("width");
        svg.style.height = svg.getAttribute("height");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        const parent = element.parentElement;
        element.remove();
        parent.appendChild(svg);
        if (parent.classList.contains('block-equation')) {
            parent.setAttribute("style", "text-align: center; margin-bottom: 1rem;");
        }
    });
    // 处理代码块
    elements = wenyanElement.querySelectorAll("pre code");
    elements.forEach(element => {
        element.innerHTML = element.innerHTML
                .replace(/\n/g, '<br>')
                .replace(/(>[^<]+)|(^[^<]+)/g, str => str.replace(/\s/g, '&nbsp;'));
    });
    // 公众号不支持css伪元素，将伪元素样式提取出来拼接成一个span
    elements = wenyanElement.querySelectorAll('h1, h2, h3, h4, h5, h6, blockquote, pre');
    elements.forEach((element) => {
        const afterResults = new Map();
        const beforeResults = new Map();
        csstree.walk(ast, {
            visit: "Rule",
            enter(node) {
                const selector = csstree.generate(node.prelude); // 生成选择器字符串
                const tagName = element.tagName.toLowerCase();

                // 检查是否匹配 ::after 或 ::before
                if (selector.includes(`${tagName}::after`)) {
                    extractDeclarations(node, afterResults);
                } else if (selector.includes(`${tagName}::before`)) {
                    extractDeclarations(node, beforeResults);
                }
            },
        });
        if (afterResults.size > 0) {
            element.appendChild(buildPseudoSpan(afterResults, wenyanElement.ownerDocument));
        }
        if (beforeResults.size > 0) {
            element.insertBefore(buildPseudoSpan(beforeResults, wenyanElement.ownerDocument), element.firstChild);
        }
    });
    // 列表
    elements = wenyanElement.querySelectorAll("li");
    elements.forEach(li => {
        const section = wenyanElement.ownerDocument.createElement("section");
        // 将 li 的所有子节点移动进 section
        while (li.firstChild) {
            section.appendChild(li.firstChild);
        }
        li.appendChild(section);
    });
    wenyanElement.setAttribute("data-provider", "WenYan");
    return `${wenyanElement.outerHTML.replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"')}`;
}

export function replaceCSSVariables(css) {
    // 正则表达式用于匹配变量定义，例如 --sans-serif-font: ...
    const variablePattern = /--([a-zA-Z0-9\-]+):\s*([^;()]*\((?:[^()]*|\([^()]*\))*\)[^;()]*|[^;]+);/g;
    // 正则表达式用于匹配使用 var() 的地方
    const varPattern = /var\(--([a-zA-Z0-9\-]+)\)/g;

    const cssVariables = {};

    // 1. 提取变量定义并存入字典
    let match;
    while ((match = variablePattern.exec(css)) !== null) {
        const variableName = match[1];
        const variableValue = match[2].trim().replaceAll("\n", "");

        // 将变量存入字典
        cssVariables[variableName] = variableValue;
    }

    if (!cssVariables['sans-serif-font']) {
        cssVariables['sans-serif-font'] = sansSerif;
    }

    if (!cssVariables['monospace-font']) {
        cssVariables['monospace-font'] = monospace;
    }

    // 2. 递归解析 var() 引用为字典中对应的值
    function resolveVariable(value, variables, resolved = new Set()) {
        // 如果已经解析过这个值，则返回原始值以避免死循环
        if (resolved.has(value)) return value;

        resolved.add(value);
        let resolvedValue = value;

        // 解析变量
        let match;
        while ((match = varPattern.exec(resolvedValue)) !== null) {
            const varName = match[1];

            // 查找对应的变量值，如果变量引用另一个变量，递归解析
            if (variables[varName]) {
                const resolvedVar = resolveVariable(variables[varName], variables, resolved);
                resolvedValue = resolvedValue.replace(match[0], resolvedVar);
            }
        }
        return resolvedValue;
    }

    // 3. 替换所有变量引用
    for (const key in cssVariables) {
        const resolvedValue = resolveVariable(cssVariables[key], cssVariables);
        cssVariables[key] = resolvedValue;
    }

    // 4. 替换 CSS 中的 var() 引用
    let modifiedCSS = css;
    while ((match = varPattern.exec(css)) !== null) {
        const varName = match[1];

        // 查找对应的变量值
        if (cssVariables[varName]) {
            modifiedCSS = modifiedCSS.replace(match[0], cssVariables[varName]);
        }
    }

    return modifiedCSS.replace(/:root\s*\{[^}]*\}/g, '');
}

export function modifyCss(customCss, updates) {
    const ast = csstree.parse(customCss, {
        context: 'stylesheet',
        positions: false,
        parseAtrulePrelude: false,
        parseCustomProperty: false,
        parseValue: false
    });

    csstree.walk(ast, {
        visit: 'Rule',
        leave: (node, item, list) => {
            if (node.prelude.type !== 'SelectorList') return;

            const selectors = node.prelude.children.toArray().map(sel => csstree.generate(sel));
            if (selectors) {
                const selector = selectors[0];
                const update = updates[selector];
                if (!update) return;

                for (const { property, value, append } of update) {
                    if (value) {
                        let found = false;
                        csstree.walk(node.block, decl => {
                            if (decl.type === 'Declaration' && decl.property === property) {
                                decl.value = csstree.parse(value, { context: 'value' });
                                found = true;
                            }
                        });
                        if (!found && append) {
                            node.block.children.prepend(
                                list.createItem({
                                    type: 'Declaration',
                                    property,
                                    value: csstree.parse(value, { context: 'value' })
                                })
                            );
                        }
                    }
                }
            }
        }
    });

    return csstree.generate(ast);
}

export function extractDeclarations(ruleNode, resultMap) {
    csstree.walk(ruleNode.block, {
        visit: 'Declaration',
        enter(declNode) {
            const property = declNode.property;
            const value = csstree.generate(declNode.value);
            resultMap.set(property, value);
        }
    });
}

export function buildPseudoSpan(beforeRresults, document) {
    // 创建一个新的 <span> 元素
    const span = document.createElement('section');
    // 将伪类的内容和样式应用到 <span> 标签
    if (beforeRresults.get("content")) {
        span.textContent = beforeRresults.get("content").replace(/['"]/g, '');
        beforeRresults.delete("content");
    }
    for (const [k, v] of beforeRresults) {
        if (v.includes("url(")) {
            const svgMatch = v.match(/data:image\/svg\+xml;utf8,(.*<\/svg>)/);
            const base64SvgMatch = v.match(/data:image\/svg\+xml;base64,([^"'\)]*)["']?\)/);
            const httpMatch = v.match(/(?:"|')?(https?[^"'\)]*)(?:"|')?\)/);
            if (svgMatch) {
                const svgCode = decodeURIComponent(svgMatch[1]);
                span.innerHTML = svgCode;
            } else if (base64SvgMatch) {
                const decodedString = atob(base64SvgMatch[1]);
                span.innerHTML = decodedString;
            } else if (httpMatch) {
                const img = document.createElement('img');
                img.src = httpMatch[1];
                img.setAttribute("style", "vertical-align: top;");
                span.appendChild(img);
            }
            beforeRresults.delete(k);
        }
    }
    const entries = Array.from(beforeRresults.entries());
    const cssString = entries.map(([key, value]) => `${key}: ${value}`).join('; ');
    span.style.cssText = cssString;
    return span;
}

export function addFootnotes(listStyle, element) {
    let footnotes = [];
    let footnoteIndex = 0;
    const links = element.querySelectorAll('a[href]'); // 获取所有带有 href 的 a 元素
    links.forEach((linkElement) => {
        const title = linkElement.textContent || linkElement.innerText;
        const href = linkElement.getAttribute("href");

        // 添加脚注并获取脚注编号
        footnotes.push([++footnoteIndex, title, href]);

        // 在链接后插入脚注标记
        const footnoteMarker = element.ownerDocument.createElement('sup');
        footnoteMarker.setAttribute("class", "footnote");
        footnoteMarker.innerHTML = `[${footnoteIndex}]`;
        linkElement.after(footnoteMarker);
    });
    if (footnoteIndex > 0) {
        if (!listStyle) {
            let footnoteArray = footnotes.map((x) => {
                if (x[1] === x[2]) {
                    return `<p><span class="footnote-num">[${x[0]}]</span><span class="footnote-txt"><i>${x[1]}</i></span></p>`;
                }
                return `<p><span class="footnote-num">[${x[0]}]</span><span class="footnote-txt">${x[1]}: <i>${x[2]}</i></span></p>`;
            });
            const footnotesHtml = `<h3>引用链接</h3><section id="footnotes">${footnoteArray.join("")}</section>`;
            element.innerHTML += footnotesHtml;
        } else {
            let footnoteArray = footnotes.map((x) => {
                if (x[1] === x[2]) {
                    return `<li id="#footnote-${x[0]}">[${x[0]}]: <i>${x[1]}</i></li>`;
                }
                return `<li id="#footnote-${x[0]}">[${x[0]}] ${x[1]}: <i>${x[2]}</i></li>`;
            });
            const footnotesHtml = `<h3>引用链接</h3><div id="footnotes"><ul>${footnoteArray.join("")}</ul></div>`;
            element.innerHTML += footnotesHtml;
        }
    }
}
