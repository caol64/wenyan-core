import { ApplyStylesOptions, createWenyanCore, WenyanCoreInstance } from "../core/index.js";
import { configStore } from "./configStore.js";
import { GetInputContentFn, RenderContext, RenderOptions } from "./types.js";
import { getNormalizeFilePath, readFileContent } from "./utils.js";
import { JSDOM } from "jsdom";
import { createNodeMermaidRenderer } from "./mermaidRenderer.js";

/**
 * 从正文中提取图片路径并清理图片引用。
 * 支持标准 Markdown 图片 ![](path) 和 Obsidian 嵌入 ![[file.png|desc]]。
 */
function extractAndCleanImages(body: string): { imagePaths: string[]; cleanedBody: string } {
    const imagePaths: string[] = [];

    const mdImageRe = /!\[[^\]]*\]\(([^)]+)\)/g;
    const obsidianImageRe = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

    let match: RegExpExecArray | null;
    while ((match = mdImageRe.exec(body)) !== null) {
        imagePaths.push(match[1]);
    }
    while ((match = obsidianImageRe.exec(body)) !== null) {
        imagePaths.push(match[1].trim());
    }

    const cleanedBody = body
        .replace(/!\[[^\]]*\]\([^)]+\)\s*/g, "")
        .replace(/!\[\[[^\]]+\]\]\s*/g, "");

    return { imagePaths, cleanedBody };
}

const nodeMermaidRenderer = createNodeMermaidRenderer();
const wenyanCoreInstance = await createWenyanCore({
    mermaid: {
        enabled: true,
        renderer: nodeMermaidRenderer,
    },
});
const wenyanCoreInstanceWithoutMermaid = await createWenyanCore();

async function renderWithTheme(markdownContent: string, options: RenderOptions): Promise<string> {
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

    const coreInstance = options.mermaid === false ? wenyanCoreInstanceWithoutMermaid : wenyanCoreInstance;

    // 5. 执行核心渲染
    const gzhContent = await renderStyledContent(markdownContent, {
        themeId: theme,
        hlThemeId: highlight,
        isMacStyle: macStyle,
        isAddFootnote: footnote,
        themeCss: handledCustomTheme,
    }, coreInstance);

    return gzhContent;
}

export async function renderStyledContent(
    content: string,
    options: ApplyStylesOptions = {},
    coreInstance: WenyanCoreInstance = wenyanCoreInstance,
): Promise<string> {
    const html = await coreInstance.renderMarkdown(content);
    const dom = new JSDOM(`<body><section id="wenyan">${html}</section></body>`);
    const document = dom.window.document;
    const wenyan = document.getElementById("wenyan");
    const result = await coreInstance.applyStylesWithTheme(wenyan!, options);
    return result;
}

// --- 处理输入源、文件路径和主题 ---
export async function prepareRenderContext(
    inputContent: string | undefined,
    options: RenderOptions,
    getInputContent: GetInputContentFn,
): Promise<RenderContext> {
    const { content, absoluteDirPath } = await getInputContent(inputContent, options.file);
    const preHandlerContent = await wenyanCoreInstance.handleFrontMatter(content);
    // type: image 小绿书模式：自动从正文提取图片注入 image_list，并清理正文中的图片引用
    if (preHandlerContent.type === "image" && !preHandlerContent.image_list) {
        const { imagePaths, cleanedBody } = extractAndCleanImages(preHandlerContent.content);
        if (imagePaths.length > 0) {
            preHandlerContent.image_list = imagePaths;
            preHandlerContent.content = cleanedBody;
        }
    }
    if (preHandlerContent.image_list && preHandlerContent.image_list.length > 0) {
        // 图片文章（小绿书）不需要应用主题样式，直接返回内容
        return { gzhContent: preHandlerContent, absoluteDirPath };
    }
    const styledContent = await renderWithTheme(preHandlerContent.content, options);
    preHandlerContent.content = styledContent;
    return { gzhContent: preHandlerContent, absoluteDirPath };
}
