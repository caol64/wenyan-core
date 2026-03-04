import {
    getHeaders,
    getServerUrl,
    healthCheck,
    requestServerPublish,
    uploadCover,
    uploadLocalImages,
    uploadStyledContent,
    verifyAuth,
} from "./clientPublish.js";
import { publishToWechatDraft } from "./publish.js";
import { prepareRenderContext, renderStyledContent } from "./render.js";
import { ClientPublishOptions, GetInputContentFn, PublishOptions, StyledContent } from "./types.js";

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

export async function renderAndPublish(
    inputContent: string | undefined,
    options: PublishOptions,
    getInputContent: GetInputContentFn,
): Promise<string> {
    // ==========================================
    // 1. 读取 markdown 文件，获取其所在目录（用于解析相对图片路径），并渲染成 HTML 格式
    // ==========================================
    const { gzhContent, absoluteDirPath } = await prepareRenderContext(inputContent, options, getInputContent);
    if (!gzhContent.title) throw new Error("未能找到文章标题");

    // ==========================================
    // 2. 处理图片、封面图，上传到微信服务器获取 media_id，并发布到公众号草稿箱
    // ==========================================
    const data = await publishToWechatDraft(
        {
            title: gzhContent.title,
            content: gzhContent.content,
            cover: gzhContent.cover,
            author: gzhContent.author,
            source_url: gzhContent.source_url,
        },
        {
            relativePath: absoluteDirPath,
        },
    );

    if (data.media_id) {
        return data.media_id;
    } else {
        throw new Error(`发布到微信公众号失败，\n${data}`);
    }
}

export async function renderAndPublishToServer(
    inputContent: string | undefined,
    options: ClientPublishOptions,
    getInputContent: GetInputContentFn,
): Promise<string> {
    const serverUrl = getServerUrl(options);
    const headers = getHeaders(options);

    // ==========================================
    // 0. 连通性与鉴权测试 (Health & Auth Check)
    // ==========================================
    await healthCheck(serverUrl);
    await verifyAuth(serverUrl, headers);

    // ==========================================
    // 1. 读取 markdown 文件，获取其所在目录（用于解析相对图片路径），并渲染成 HTML 格式
    // ==========================================
    const { gzhContent, absoluteDirPath } = await prepareRenderContext(inputContent, options, getInputContent);
    if (!gzhContent.title) throw new Error("未能找到文章标题");

    // ==========================================
    // 2. 解析 HTML 中的所有本地图片上传并替换为服务器可访问的 URL
    // ==========================================
    gzhContent.content = await uploadLocalImages(gzhContent.content, serverUrl, headers, absoluteDirPath);

    // ==========================================
    // 3. 处理封面图片，同2
    // ==========================================
    gzhContent.cover = await uploadCover(serverUrl, headers, gzhContent.cover, absoluteDirPath);

    // ==========================================
    // 4. 将替换后的 HTML 及其元数据保存成临时文件/流，并上传
    // ==========================================
    const mdFileId = await uploadStyledContent(gzhContent, serverUrl, headers);

    // ==========================================
    // 5. 此时服务器上有渲染后的 HTML 文件、发布元数据、图片，调用服务端接口发布文章
    // ==========================================
    return await requestServerPublish(mdFileId, serverUrl, headers, options);
}

export * from "./configStore.js";
export * from "./uploadCacheStore.js";
export * from "./tokenStore.js";
export * from "./render.js";
export * from "./theme.js";
export * from "./types.js";
export * from "./utils.js";
