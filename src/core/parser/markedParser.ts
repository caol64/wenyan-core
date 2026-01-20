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

            // ----------- 2. 自定义图片语法扩展 ![](){...} -----------
            md.use({
                extensions: [
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

                            return `<img src="${token.href}" alt="${token.text || ""}" title="${token.text || ""}" style="${styleStr}">`;
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
                        return `<img src="${token.href}" alt="${token.text || ""}" title="${token.title || token.text || ""}">`;
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
            return md.parse(markdown) as Promise<string>;
        },
    };
}
