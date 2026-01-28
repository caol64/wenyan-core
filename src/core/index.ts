import { monospace, replaceCSSVariables, sansSerif } from "./utils.js";
import { registerBuiltInHlThemes, getHlTheme, getAllHlThemes } from "./theme/hlThemeRegistry.js";
import { addFootnotes } from "./renderer/footnotesRender.js";
import { FrontMatterResult, handleFrontMatter } from "./parser/frontMatterParser.js";
import { renderHighlightTheme } from "./renderer/highlightApplyRender.js";
import { renderMacStyle } from "./renderer/macStyleRender.js";
import { createMarkedClient } from "./parser/markedParser.js";
import { createMathJaxParser } from "./parser/mathjaxParser.js";
import { wechatPostRender } from "./renderer/wechatPostRender.js";
import { renderTheme } from "./renderer/themeApplyRender.js";
import { registerAllBuiltInThemes, getTheme, getAllGzhThemes } from "./theme/themeRegistry.js";
import { applyPseudoElements } from "./renderer/pseudoApplyRender.js";
import { createCssModifier } from "./parser/cssParser.js";

export interface WenyanOptions {
    isConvertMathJax?: boolean;
    isWechat?: boolean;
}

export interface ApplyStylesOptions {
    themeId?: string;
    hlThemeId?: string;
    themeCss?: string;
    hlThemeCss?: string;
    isMacStyle?: boolean;
    isAddFootnote?: boolean;
}

export async function createWenyanCore(options: WenyanOptions = {}) {
    const { isConvertMathJax = true, isWechat = true } = options;
    const markedClient = createMarkedClient();
    const mathJaxParser = createMathJaxParser();
    registerAllBuiltInThemes();
    registerBuiltInHlThemes();
    return {
        async handleFrontMatter(markdown: string): Promise<FrontMatterResult> {
            return await handleFrontMatter(markdown);
        },
        async renderMarkdown(markdown: string): Promise<string> {
            const html = await markedClient.parse(markdown);
            if (isConvertMathJax) {
                return mathJaxParser.parser(html);
            }
            return html;
        },
        async applyStylesWithTheme(wenyanElement: HTMLElement, options: ApplyStylesOptions = {}): Promise<string> {
            const {
                themeId = "default",
                themeCss,
                hlThemeId = "solarized-light",
                hlThemeCss,
                isMacStyle = true,
                isAddFootnote = true,
            } = options;
            const [resolvedThemeCss, resolvedHlThemeCss] = await Promise.all([
                // 任务 1: 解析文章主题
                resolveCssContent(
                    themeCss,
                    themeId,
                    getTheme,
                    (id) => getAllGzhThemes().find((t) => t.meta.name.toLowerCase() === id.toLowerCase()),
                    `主题不存在: ${themeId}`,
                ),
                // 任务 2: 解析代码高亮主题
                resolveCssContent(
                    hlThemeCss,
                    hlThemeId,
                    getHlTheme,
                    (id) => getAllHlThemes().find((t) => t.id.toLowerCase() === id.toLowerCase()),
                    `代码主题不存在: ${hlThemeId}`,
                ),
            ]);
            const modifiedCss = createCssModifier({
                "#wenyan": [
                    {
                        property: "font-family",
                        value: sansSerif,
                        append: false,
                    },
                ],
                "#wenyan pre code": [
                    {
                        property: "font-family",
                        value: monospace,
                        append: false,
                    },
                ],
                "#wenyan pre": [
                    {
                        property: "font-size",
                        value: "12px",
                        append: false,
                    },
                ],
            })(resolvedThemeCss);
            return this.applyStylesWithResolvedCss(wenyanElement, {
                themeCss: modifiedCss,
                hlThemeCss: resolvedHlThemeCss,
                isMacStyle,
                isAddFootnote,
            });
        },
        async applyStylesWithResolvedCss(
            wenyanElement: HTMLElement,
            options: {
                themeCss: string;
                hlThemeCss: string;
                isMacStyle: boolean;
                isAddFootnote: boolean;
            },
        ): Promise<string> {
            const { themeCss = "", hlThemeCss = "", isMacStyle = true, isAddFootnote = true } = options;
            if (!wenyanElement) {
                throw new Error("wenyanElement不能为空");
            }
            if (isAddFootnote) {
                addFootnotes(wenyanElement);
            }
            if (isMacStyle) {
                renderMacStyle(wenyanElement);
            }
            if (themeCss) {
                renderTheme(wenyanElement, themeCss);
                applyPseudoElements(wenyanElement, themeCss);
            }
            if (hlThemeCss) {
                renderHighlightTheme(wenyanElement, hlThemeCss);
            }
            if (isWechat) {
                wechatPostRender(wenyanElement);
                wenyanElement.setAttribute("data-provider", "WenYan");
                return `${wenyanElement.outerHTML
                    .replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"')
                    .replace(/\n<li/g, "<li")
                    .replace(/<\/li>\n/g, "<\/li>")}`;
            }
            return wenyanElement.outerHTML;
        },
    };
}

async function resolveCssContent<T extends { getCss: () => Promise<string> }>(
    directCss: string | undefined, // 直接传入的 CSS
    id: string, // ID
    finder: (id: string) => T | undefined, // 精确查找函数 (getTheme)
    fallbackFinder: (id: string) => T | undefined, // 模糊查找函数 (find in array)
    errorMessage: string, // 报错信息
): Promise<string> {
    // 1. 如果有直接传入的 CSS，直接处理返回（同步操作）
    if (directCss) {
        return replaceCSSVariables(directCss);
    }

    // 2. 查找主题对象
    let theme = finder(id);
    if (!theme) {
        theme = fallbackFinder(id);
    }

    // 3. 依然没找到，抛错
    if (!theme) {
        throw new Error(errorMessage);
    }

    // 4. 异步获取 CSS 并处理
    const rawCss = await theme.getCss();
    return replaceCSSVariables(rawCss);
}

export * from "./theme/themeRegistry.js";
export * from "./theme/hlThemeRegistry.js";
export { serif, sansSerif, monospace } from "./utils.js";
export { createCssModifier } from "./parser/cssParser.js";
export { macStyleCss } from "./renderer/macStyleRender.js";
export * from "./platform/medium.js";
export * from "./platform/zhihu.js";
export * from "./platform/toutiao.js";
