import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { stringToMap } from "../utils.js";
import type { Tokens, Renderer } from "marked";

export function createMarkedClient() {
    let configurePromise: Promise<void> | null = null;
    const md = new Marked();

    async function configure(): Promise<void> {
        if (configurePromise) {
            return configurePromise;
        }

        configurePromise = (async () => {
            // ----------- 1. 代码高亮扩展 -----------
            const highlightExtension = markedHighlight({
                emptyLangClass: "hljs",
                langPrefix: "hljs language-",
                highlight(code, lang) {
                    const language = hljs.getLanguage(lang) ? lang : "plaintext";
                    return hljs.highlight(code, { language }).value;
                },
            });

            md.use(highlightExtension);

            // ----------- 2. 自定义语法扩展 -----------
            md.use({
                extensions: [
                    // 宽松 link/image tokenizer，允许 URL 中包含空格（不要求用 <> 包裹）
                    {
                        name: "looseLink",
                        level: "inline",
                        start(src) {
                            return src.match(/!?\[/)?.index;
                        },
                        tokenizer(src) {
                            const rule = /^(!?)\[([^\]]*)\]\(([^)]+)\)/;
                            const match = rule.exec(src);
                            if (!match) return;

                            const isImage = !!match[1];
                            const text = match[2];
                            const inner = match[3].trim();

                            let href = "";
                            let title = "";

                            // 尝试分离末尾的 title
                            const titleMatch = inner.match(/(.*?)\s+["']([^"']*)["']$/);
                            if (titleMatch) {
                                href = titleMatch[1].trim();
                                title = titleMatch[2];
                            } else {
                                href = inner;
                            }

                            return {
                                type: isImage ? "image" : "link",
                                raw: match[0],
                                text: text,
                                href: href,
                                title: title,
                                tokens: this.lexer.inlineTokens(text),
                            };
                        },
                    },
                    // Obsidian WikiLinks 图片语法扩展 ![[filename]] / ![[filename|alt]] / ![[filename|width]] / ![[filename|widthxheight]]
                    {
                        name: "wikiImage",
                        level: "inline",
                        start(src) {
                            return src.match(/!\[\[/)?.index;
                        },
                        tokenizer(src) {
                            const rule = /^!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/;
                            const match = rule.exec(src);
                            if (!match) return;

                            const href = match[1].trim();
                            const modifier = match[2]?.trim() ?? "";

                            // modifier 可能是: "" | "alt text" | "200" | "200x300"
                            const dimOnly = /^(\d+)(?:x(\d+))?$/.exec(modifier);
                            const alt = dimOnly ? "" : modifier;
                            const width = dimOnly ? dimOnly[1] : "";
                            const height = dimOnly ? (dimOnly[2] ?? "") : "";

                            return {
                                type: "wikiImage",
                                raw: match[0],
                                href,
                                alt,
                                width,
                                height,
                                tokens: [],
                            };
                        },
                        renderer(token) {
                            const href = normalizeHref(token.href);
                            const altAttr = token.alt ? ` alt="${token.alt}"` : "";
                            const titleAttr = token.alt ? ` title="${token.alt}"` : "";
                            const styleParts: string[] = [];
                            if (token.width) styleParts.push(`width:${token.width}px`);
                            if (token.height) styleParts.push(`height:${token.height}px`);
                            const styleAttr = styleParts.length ? ` style="${styleParts.join("; ")}"` : "";
                            return `<img src="${href}"${altAttr}${titleAttr}${styleAttr}>`;
                        },
                    },

                    // 自定义图片语法扩展 ![](){...}
                    {
                        name: "attributeImage",
                        level: "inline",
                        start(src) {
                            return src.match(/!\[/)?.index;
                        },
                        tokenizer(src) {
                            // 匹配格式: ![alt](href){attrs}
                            // 1. ![  2. alt  3. ](  4. href  5. ){  6. attrs  7. }
                            const rule = /^!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/;
                            const match = rule.exec(src);

                            if (match) {
                                return {
                                    type: "attributeImage",
                                    raw: match[0],
                                    text: match[1], // alt 文本
                                    href: match[2], // 图片链接
                                    attrs: match[3], // 属性字符串
                                    tokens: [], //以此作为 inline token
                                };
                            }
                            return undefined;
                        },
                        renderer(token) {
                            const attrs = stringToMap(token.attrs);
                            const styleStr = Array.from(attrs)
                                .map(([k, v]) => (/^\d+$/.test(v) ? `${k}:${v}px` : `${k}:${v}`))
                                .join("; ");
                            const href = normalizeHref(token.href);

                            return `<img src="${href}" alt="${token.text || ""}" title="${token.text || ""}" style="${styleStr}">`;
                        },
                    },

                ],
            });

            // ----------- 3. 自定义渲染器 -----------
            md.use({
                renderer: {
                    // 重写标题 (h1 ~ h6)
                    heading(this: Renderer, token: Tokens.Heading) {
                        const text = this.parser.parseInline(token.tokens);
                        const level = token.depth;
                        return `<h${level}><span>${text}</span></h${level}>\n`;
                    },

                    // 重写段落 (处理行间公式)
                    paragraph(this: Renderer, token: Tokens.Paragraph) {
                        const text = token.text;

                        // 正则：匹配 $$...$$ 或 \[...\]
                        // 逻辑：如果段落包含块级公式，且文本较长（避免误判），则移除 <p> 标签
                        const hasBlockMath =
                            text.length > 4 && (/\$\$[\s\S]*?\$\$/g.test(text) || /\\\[[\s\S]*?\\\]/g.test(text));

                        if (hasBlockMath) {
                            // 如果不包裹 p 标签，直接返回文本（可能需要处理换行）
                            // 注意：这里我们不 parseInline，因为公式通常需要原样输出给 MathJax/KaTeX
                            // 如果公式混合了 Markdown 语法，可以考虑 return this.parser.parseInline(token.tokens) + '\n';
                            return `${text}\n`;
                        } else {
                            // 正常段落，包裹 <p>，并递归解析内部 Token
                            return `<p>${this.parser.parseInline(token.tokens)}</p>\n`;
                        }
                    },

                    // 重写普通图片 (处理标准 Markdown 图片)
                    image(this: Renderer, token: Tokens.Image) {
                        const href = normalizeHref(token.href);
                        return `<img src="${href}" alt="${token.text || ""}" title="${token.title || token.text || ""}">`;
                    },

                    link(this: Renderer, token: Tokens.Link) {
                        const href = normalizeHref(token.href);
                        return `<a href="${href}">${this.parser.parseInline(token.tokens)}</a>`;
                    },
                },
            });
        })();

        return configurePromise;
    }

    return {
        /**
         * 解析 Markdown 为 HTML
         */
        async parse(markdown: string): Promise<string> {
            await configure();
            // marked.parse 返回可能是 string | Promise<string>，这里强制转为 Promise 处理
            return await md.parse(markdown);
        },
    };
}

function normalizeHref(href: string): string {
    href = href.trim();
    if (href.startsWith("<") && href.endsWith(">")) {
        // 如果 href 被尖括号包裹，去掉尖括号
        href = href.slice(1, -1);
    }

    try {
        return encodeURI(href);
    } catch {
        return href;
    }
}
