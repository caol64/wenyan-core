import { WechatPublishResponse } from "../wechat.js";
import {
    getHeaders,
    getServerUrl,
    healthCheck,
    requestServerPublish,
    uploadCover,
    uploadImageList,
    uploadLocalImages,
    uploadStyledContent,
    verifyAuth,
} from "./clientPublish.js";
import { publishToWechatDraft, publishImageTextToWechatDraft } from "./publish.js";
import { prepareRenderContext } from "./render.js";
import { ClientPublishOptions, GetInputContentFn, PublishOptions } from "./types.js";

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
    let data: WechatPublishResponse;
    if (gzhContent.image_list && gzhContent.image_list.length > 0) {
        // 图片文章（小绿书）
        data = await publishImageTextToWechatDraft(
            {
                ...gzhContent,
                title: gzhContent.title!,
                images: gzhContent.image_list,
            },
            {
                appId: options.appId,
                relativePath: absoluteDirPath,
            },
        );
    } else {
        // 普通图文文章
        data = await publishToWechatDraft(
            {
                ...gzhContent,
                title: gzhContent.title!,
            },
            {
                appId: options.appId,
                relativePath: absoluteDirPath,
            },
        );
    }

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

    if (gzhContent.image_list && gzhContent.image_list.length > 0) {
        // 图片文章（小绿书）
        // 不处理正文中的图片
        // ==========================================
        // 2. 解析 image_list 中的所有本地图片上传并替换为服务器可访问的 URL
        // ==========================================
        gzhContent.image_list = await uploadImageList(serverUrl, headers, gzhContent.image_list, absoluteDirPath);
    } else {
        // 普通图文文章
        // ==========================================
        // 2. 解析 HTML 中的所有本地图片上传并替换为服务器可访问的 URL
        // ==========================================
        gzhContent.content = await uploadLocalImages(gzhContent.content, serverUrl, headers, absoluteDirPath);
    }

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
export * from "./render.js";
export * from "./theme.js";
export * from "./types.js";
export * from "./utils.js";
export * from "./publish.js";
