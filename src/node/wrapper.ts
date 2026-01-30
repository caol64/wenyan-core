import { JSDOM } from "jsdom";
import { ApplyStylesOptions, createWenyanCore } from "../core/index.js";

export interface StyledContent {
    content: string;
    title?: string;
    cover?: string;
    description?: string;
}

const wenyanCoreInstance = await createWenyanCore();

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
    };
}

// 兼容旧版本
export async function getGzhContent(
    content: string,
    themeId: string,
    hlThemeId: string,
    isMacStyle: boolean = true,
    isAddFootnote: boolean = true,
): Promise<StyledContent> {
    return await renderStyledContent(content, {
        themeId,
        hlThemeId,
        isMacStyle,
        isAddFootnote,
    });
}

export * from "./configStore.js";
export * from "./runtimeEnv.js";
