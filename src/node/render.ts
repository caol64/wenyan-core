import { ApplyStylesOptions, createWenyanCore } from "../core/index.js";
import { configStore } from "./configStore.js";
import { GetInputContentFn, RenderContext, RenderOptions, StyledContent } from "./types.js";
import { getNormalizeFilePath, readFileContent } from "./utils.js";
import { JSDOM } from "jsdom";

const wenyanCoreInstance = await createWenyanCore();

export async function renderWithTheme(markdownContent: string, options: RenderOptions): Promise<StyledContent> {
    if (!markdownContent) {
        throw new Error("No content provided for rendering.");
    }
    const { theme, customTheme, highlight, macStyle, footnote } = options;

    let handledCustomTheme: string | undefined = customTheme;
    // 当用户传入自定义主题路径时，优先级最高
    if (customTheme) {
        const normalizePath = getNormalizeFilePath(customTheme);
        handledCustomTheme = await readFileContent(normalizePath);
    } else if (theme) {
        // 否则尝试读取配置中的自定义主题
        handledCustomTheme = await configStore.getThemeById(theme);
    }

    if (!handledCustomTheme && !theme) {
        throw new Error(`theme "${theme}" not found.`);
    }

    // 5. 执行核心渲染
    const gzhContent = await renderStyledContent(markdownContent, {
        themeId: theme,
        hlThemeId: highlight,
        isMacStyle: macStyle,
        isAddFootnote: footnote,
        themeCss: handledCustomTheme,
    });

    return gzhContent;
}

export async function renderStyledContent(content: string, options: ApplyStylesOptions = {}): Promise<StyledContent> {
    const preHandlerContent = await wenyanCoreInstance.handleFrontMatter(content);
    const html = await wenyanCoreInstance.renderMarkdown(preHandlerContent.body);
    const dom = new JSDOM(`<body><section id="wenyan">${html}</section></body>`);
    const document = dom.window.document;
    const wenyan = document.getElementById("wenyan");
    const result = await wenyanCoreInstance.applyStylesWithTheme(wenyan!, options);
    return {
        content: result,
        title: preHandlerContent.title,
        cover: preHandlerContent.cover,
        description: preHandlerContent.description,
        author: preHandlerContent.author,
        source_url: preHandlerContent.source_url,
        need_open_comment: preHandlerContent.need_open_comment,
        only_fans_can_comment: preHandlerContent.only_fans_can_comment,
    };
}

// --- 处理输入源、文件路径和主题 ---
export async function prepareRenderContext(
    inputContent: string | undefined,
    options: RenderOptions,
    getInputContent: GetInputContentFn,
): Promise<RenderContext> {
    const { content, absoluteDirPath } = await getInputContent(inputContent, options.file);
    const gzhContent = await renderWithTheme(content, options);

    return { gzhContent, absoluteDirPath };
}
