import { ApplyStylesOptions, createWenyanCore, WenyanCoreInstance } from "../core/index.js";
import { configStore } from "./configStore.js";
import { GetInputContentFn, RenderContext, RenderOptions } from "./types.js";
import { getNormalizeFilePath, readFileContent } from "./utils.js";
import { JSDOM } from "jsdom";
import { createNodeMermaidRenderer } from "./mermaidRenderer.js";

/**
 * 将 Markdown 正文渲染为 HTML，通过 JSDOM 提取所有 <img> 的 src 路径，
 * 然后从 DOM 中移除图片节点（若父 <p> 因此变空则一并移除），返回清理后的 HTML。
 * 支持标准 Markdown 图片和 Obsidian WikiLinks 图片（![[...]]），两者均由 markedParser 统一转换为 <img>。
 */
async function extractAndCleanImages(body: string): Promise<{ imagePaths: string[]; cleanedHtml: string }> {
    const html = await wenyanCoreInstance.renderMarkdown(body);
    const dom = new JSDOM(`<body><section id="wenyan">${html}</section></body>`);
    const document = dom.window.document;
    const wenyan = document.getElementById("wenyan");

    const images = Array.from(wenyan!.querySelectorAll("img"));
    const imagePaths = images
        .map((img) => img.getAttribute("src"))
        .filter((src): src is string => !!src)
        .map((src) => { try { return decodeURI(src); } catch { return src; } });

    for (const img of images) {
        const parent = img.parentElement;
        img.remove();
        if (parent && parent.tagName === "P" && parent.textContent?.trim() === "") {
            parent.remove();
        }
    }

    return { imagePaths, cleanedHtml: wenyan!.outerHTML };
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
        const { imagePaths, cleanedHtml } = await extractAndCleanImages(preHandlerContent.content);
        if (imagePaths.length > 0) {
            preHandlerContent.image_list = imagePaths;
            preHandlerContent.content = cleanedHtml;
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
