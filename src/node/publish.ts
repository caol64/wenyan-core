import { JSDOM } from "jsdom";
import { fileFromPath } from "formdata-node/file-from-path";
import path from "node:path";
import { stat } from "node:fs/promises";
import { RuntimeEnv } from "./runtimeEnv.js";
import {
    createWechatClient,
    WechatBatchGetMaterialOptions,
    WechatBatchGetMaterialResponse,
    WechatDraftCountResponse,
    WechatDraftDetailResponse,
    WechatDraftListOptions,
    WechatDraftListResponse,
    WechatDraftSwitchResponse,
    WechatDraftUpdateOptions,
    WechatMaterialCountResponse,
    WechatMaterialType,
    WechatOperationResponse,
    WechatPublishResponse,
    WechatPublishStatusResponse,
    WechatPublishedArticleResponse,
    WechatSubmitPublishResponse,
    WechatUploadArticleImageResponse,
    WechatUploadTemporaryMediaResponse,
    WechatUploadResponse,
} from "../wechat.js";
import { nodeHttpAdapter } from "./nodeHttpAdapter.js";
import { tokenStore } from "./tokenStore.js";
import { md5FromBuffer, md5FromFile } from "./utils.js";
import { uploadCacheStore } from "./uploadCacheStore.js";

const {
    uploadMaterial,
    publishArticle,
    fetchAccessToken,
    getMaterial,
    getMaterialCount,
    batchGetMaterial,
    uploadArticleImage,
    deleteMaterial,
    uploadTemporaryMaterial,
    getTemporaryMaterial,
    getHdVoice,
    draftSwitch,
    getDraftList,
    getDraftCount,
    getDraft,
    updateDraft,
    deleteDraft,
    submitPublish,
    getPublishStatus,
    getPublishedArticle,
} = createWechatClient(nodeHttpAdapter);
const mediaIdMapping = new Map<string, string>(); // 微信 url 和 media_id 的映射

export interface WechatPublishOptions {
    appId?: string;
    appSecret?: string;
    relativePath?: string;
}

export interface ArticleOptions {
    title: string;
    content: string;
    cover?: string;
    author?: string;
    source_url?: string;
}

async function uploadImage(
    imageUrl: string,
    accessToken: string,
    fileName?: string,
    relativePath?: string,
): Promise<WechatUploadResponse> {
    let fileData: Blob;
    let finalName: string;
    let md5: string;

    if (imageUrl.startsWith("http")) {
        // 远程 URL
        const response = await fetch(imageUrl);
        if (!response.ok || !response.body) {
            throw new Error(`下载图片失败 URL: ${imageUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
            throw new Error(`远程图片大小为0，无法上传: ${imageUrl}`);
        }
        const buffer = Buffer.from(arrayBuffer);
        md5 = md5FromBuffer(buffer);
        // 先查缓存
        const cached = await uploadCacheStore.get(md5);
        if (cached) {
            // 写入映射
            mediaIdMapping.set(cached.url, cached.media_id);
            return {
                media_id: cached.media_id,
                url: cached.url,
            };
        }

        const fileNameFromUrl = path.basename(imageUrl.split("?")[0]);
        const ext = path.extname(fileNameFromUrl);
        finalName = fileName ?? (ext === "" ? `${fileNameFromUrl}.jpg` : fileNameFromUrl);

        const contentType = response.headers.get("content-type") || "image/jpeg";
        fileData = new Blob([buffer], { type: contentType });
    } else {
        // 本地路径
        const resolvedPath = RuntimeEnv.resolveLocalPath(imageUrl, relativePath);
        const stats = await stat(resolvedPath);
        if (stats.size === 0) {
            throw new Error(`本地图片大小为0，无法上传: ${resolvedPath}`);
        }

        md5 = await md5FromFile(resolvedPath);

        // 查缓存
        const cached = await uploadCacheStore.get(md5);
        if (cached) {
            // 写入映射
            mediaIdMapping.set(cached.url, cached.media_id);
            return {
                media_id: cached.media_id,
                url: cached.url,
            };
        }

        const fileNameFromLocal = path.basename(resolvedPath);
        const ext = path.extname(fileNameFromLocal);
        finalName = fileName ?? (ext === "" ? `${fileNameFromLocal}.jpg` : fileNameFromLocal);
        const fileFromPathResult = await fileFromPath(resolvedPath);
        fileData = new Blob([await fileFromPathResult.arrayBuffer()], { type: fileFromPathResult.type });
    }

    // 上传
    const data = await uploadMaterial("image", fileData, finalName, accessToken);
    // 写入缓存
    await uploadCacheStore.set(md5, data.media_id, data.url);
    // 写入映射
    mediaIdMapping.set(data.url, data.media_id);
    return data;
}

async function uploadImages(
    content: string,
    accessToken: string,
    relativePath?: string,
): Promise<{ html: string; firstImageId: string }> {
    if (!content.includes("<img")) {
        return { html: content, firstImageId: "" };
    }

    const dom = new JSDOM(content);
    const document = dom.window.document;
    const images = Array.from(document.querySelectorAll("img"));

    const uploadPromises = images.map(async (element) => {
        const dataSrc = element.getAttribute("src");
        if (dataSrc) {
            if (!dataSrc.startsWith("https://mmbiz.qpic.cn")) {
                const resp = await uploadImage(dataSrc, accessToken, undefined, relativePath);
                element.setAttribute("src", resp.url);
                return resp.media_id;
            } else {
                return dataSrc;
            }
        }
        return null;
    });

    const mediaIds = (await Promise.all(uploadPromises)).filter(Boolean);
    const firstImageId = mediaIds[0] || "";

    const updatedHtml = dom.serialize();
    return { html: updatedHtml, firstImageId };
}

export async function publishToWechatDraft(
    articleOptions: ArticleOptions,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatPublishResponse> {
    const { title, content, cover, author, source_url } = articleOptions;
    const { appId, appSecret, relativePath } = publishOptions;

    const appIdFinal = appId ?? process.env.WECHAT_APP_ID;
    const appSecretFinal = appSecret ?? process.env.WECHAT_APP_SECRET;

    if (!appIdFinal || !appSecretFinal) {
        throw new Error("请通过参数或环境变量 WECHAT_APP_ID / WECHAT_APP_SECRET 提供公众号凭据");
    }

    const accessToken = await getAccessTokenWithCache(appIdFinal, appSecretFinal);

    // 上传正文图片
    const { html, firstImageId } = await uploadImages(content, accessToken, relativePath);

    // 处理封面图
    let thumbMediaId = "";

    if (cover) {
        const cachedThumbMediaId = mediaIdMapping.get(cover);
        if (cachedThumbMediaId) {
            thumbMediaId = cachedThumbMediaId;
        } else {
            const resp = await uploadImage(cover, accessToken, "cover.jpg", relativePath);
            thumbMediaId = resp.media_id;
        }
    } else {
        // 如果是 URL，需要重新上传作为封面，为了获取 media_id
        if (firstImageId.startsWith("https://mmbiz.qpic.cn")) {
            const cachedThumbMediaId = mediaIdMapping.get(firstImageId);
            if (cachedThumbMediaId) {
                thumbMediaId = cachedThumbMediaId;
            } else {
                const resp = await uploadImage(firstImageId, accessToken, "cover.jpg", relativePath);
                thumbMediaId = resp.media_id;
            }
        } else {
            // 已经是 media_id
            thumbMediaId = firstImageId;
        }
    }

    if (!thumbMediaId) {
        throw new Error("你必须指定一张封面图或者在正文中至少出现一张图片。");
    }

    const data = await publishArticle(accessToken, {
        title,
        content: html,
        thumb_media_id: thumbMediaId,
        author,
        content_source_url: source_url,
    });

    if (data.media_id) {
        return data;
    }

    throw new Error(`上传到公众号草稿失败: ${JSON.stringify(data)}`);
}

export async function publishToDraft(
    title: string,
    content: string,
    cover: string = "",
    options: WechatPublishOptions = {},
): Promise<WechatPublishResponse> {
    return publishToWechatDraft({ title, content, cover }, options);
}

/**
 * 获取永久素材详情。
 *
 * @remarks
 * SPEC:
 * - `mediaId` 必须是非空字符串。
 */
export async function getWechatMaterial(
    mediaId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<object | Blob> {
    assertNonEmpty("mediaId", mediaId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await getMaterial(accessToken, mediaId);
}

/**
 * 获取永久素材总数。
 */
export async function getWechatMaterialCount(
    publishOptions: WechatPublishOptions = {},
): Promise<WechatMaterialCountResponse> {
    const accessToken = await resolveAccessToken(publishOptions);
    return await getMaterialCount(accessToken);
}

/**
 * 获取永久素材列表。
 *
 * @remarks
 * SPEC:
 * - `options.type` 仅允许：`image`、`voice`、`video`、`news`。
 * - `options.offset` 必须是大于等于 0 的整数。
 * - `options.count` 必须是 1 到 20 之间的整数。
 */
export async function getWechatMaterialList(
    options: WechatBatchGetMaterialOptions,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatBatchGetMaterialResponse> {
    assertNonNegativeInteger("options.offset", options.offset);
    assertCountRange("options.count", options.count, 1, 20);
    const accessToken = await resolveAccessToken(publishOptions);
    return await batchGetMaterial(accessToken, options);
}

/**
 * 上传图文消息内图片，返回可直接用于正文内容的 URL。
 *
 * @remarks
 * SPEC:
 * - `imagePathOrUrl` 必须是非空字符串。
 * - 支持本地路径和 `http/https` URL。
 */
export async function uploadWechatArticleImage(
    imagePathOrUrl: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatUploadArticleImageResponse> {
    assertNonEmpty("imagePathOrUrl", imagePathOrUrl);
    const accessToken = await resolveAccessToken(publishOptions);
    const { fileData, filename } = await toBlobFromPathOrUrl(imagePathOrUrl, publishOptions.relativePath);
    return await uploadArticleImage(accessToken, fileData, filename);
}

/**
 * 删除永久素材。
 *
 * @remarks
 * SPEC:
 * - `mediaId` 必须是非空字符串。
 */
export async function deleteWechatMaterial(
    mediaId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatOperationResponse> {
    assertNonEmpty("mediaId", mediaId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await deleteMaterial(accessToken, mediaId);
}

/**
 * 上传临时素材。
 *
 * @remarks
 * SPEC:
 * - `type` 仅允许：`image`、`voice`、`video`、`thumb`。
 * - `filePathOrUrl` 必须是非空字符串（支持本地路径和 `http/https` URL）。
 */
export async function uploadWechatTemporaryMaterial(
    type: WechatMaterialType,
    filePathOrUrl: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatUploadTemporaryMediaResponse> {
    assertNonEmpty("filePathOrUrl", filePathOrUrl);
    const accessToken = await resolveAccessToken(publishOptions);
    const { fileData, filename } = await toBlobFromPathOrUrl(filePathOrUrl, publishOptions.relativePath);
    return await uploadTemporaryMaterial(accessToken, type, fileData, filename);
}

/**
 * 获取临时素材。
 *
 * @remarks
 * SPEC:
 * - `mediaId` 必须是非空字符串。
 */
export async function getWechatTemporaryMaterial(
    mediaId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<object | Blob> {
    assertNonEmpty("mediaId", mediaId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await getTemporaryMaterial(accessToken, mediaId);
}

/**
 * 获取高清语音素材。
 *
 * @remarks
 * SPEC:
 * - `mediaId` 必须是非空字符串。
 */
export async function getWechatHdVoice(
    mediaId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<object | Blob> {
    assertNonEmpty("mediaId", mediaId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await getHdVoice(accessToken, mediaId);
}

/**
 * 设置或查询草稿箱开关。
 *
 * @remarks
 * SPEC:
 * - `checkOnly=true` 仅查询状态（请求将携带 `checkonly=1`）。
 * - `checkOnly=false` 执行开关设置请求。
 */
export async function switchWechatDraft(
    checkOnly = false,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatDraftSwitchResponse> {
    const accessToken = await resolveAccessToken(publishOptions);
    return await draftSwitch(accessToken, checkOnly);
}

/**
 * 获取草稿列表。
 *
 * @remarks
 * SPEC:
 * - `options.offset` 必须是大于等于 0 的整数。
 * - `options.count` 必须是 1 到 20 之间的整数。
 * - `options.no_content` 仅允许 `0` 或 `1`（可选）。
 */
export async function getWechatDraftList(
    options: WechatDraftListOptions,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatDraftListResponse> {
    assertNonNegativeInteger("options.offset", options.offset);
    assertCountRange("options.count", options.count, 1, 20);
    if (options.no_content !== undefined && options.no_content !== 0 && options.no_content !== 1) {
        throw new Error("options.no_content 仅允许 0 或 1");
    }
    const accessToken = await resolveAccessToken(publishOptions);
    return await getDraftList(accessToken, options);
}

/**
 * 获取草稿总数。
 */
export async function getWechatDraftCount(
    publishOptions: WechatPublishOptions = {},
): Promise<WechatDraftCountResponse> {
    const accessToken = await resolveAccessToken(publishOptions);
    return await getDraftCount(accessToken);
}

/**
 * 获取草稿详情。
 *
 * @remarks
 * SPEC:
 * - `mediaId` 必须是非空字符串。
 */
export async function getWechatDraftDetail(
    mediaId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatDraftDetailResponse> {
    assertNonEmpty("mediaId", mediaId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await getDraft(accessToken, mediaId);
}

/**
 * 更新已有草稿中的某一篇文章。
 *
 * @remarks
 * SPEC:
 * - `media_id` 必须是非空字符串。
 * - `index` 必须是大于等于 0 的整数。
 * - 若填写 `articles.pic_crop_235_1` 或 `articles.pic_crop_1_1`，格式必须为 `X1_Y1_X2_Y2`（下划线分隔的 4 个数值，可含小数）。
 */
export async function updateWechatDraft(
    options: WechatDraftUpdateOptions,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatOperationResponse> {
    assertNonEmpty("media_id", options.media_id);
    assertNonNegativeInteger("index", options.index);
    assertCropSpec("articles.pic_crop_235_1", options.articles.pic_crop_235_1);
    assertCropSpec("articles.pic_crop_1_1", options.articles.pic_crop_1_1);

    const accessToken = await resolveAccessToken(publishOptions);
    return await updateDraft(accessToken, options);
}

/**
 * 删除指定草稿。
 *
 * @remarks
 * SPEC:
 * - `mediaId` 必须是非空字符串。
 */
export async function deleteWechatDraft(
    mediaId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatOperationResponse> {
    assertNonEmpty("mediaId", mediaId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await deleteDraft(accessToken, mediaId);
}

/**
 * 将草稿提交为正式发布任务。
 *
 * @remarks
 * SPEC:
 * - `mediaId` 必须是非空字符串。
 */
export async function submitWechatDraft(
    mediaId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatSubmitPublishResponse> {
    assertNonEmpty("mediaId", mediaId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await submitPublish(accessToken, mediaId);
}

/**
 * 查询发布任务状态。
 *
 * @remarks
 * SPEC:
 * - `publishId` 必须是非空字符串。
 */
export async function getWechatPublishStatus(
    publishId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatPublishStatusResponse> {
    assertNonEmpty("publishId", publishId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await getPublishStatus(accessToken, publishId);
}

/**
 * 获取已发布文章详情。
 *
 * @remarks
 * SPEC:
 * - `articleId` 必须是非空字符串。
 */
export async function getWechatPublishedArticle(
    articleId: string,
    publishOptions: WechatPublishOptions = {},
): Promise<WechatPublishedArticleResponse> {
    assertNonEmpty("articleId", articleId);
    const accessToken = await resolveAccessToken(publishOptions);
    return await getPublishedArticle(accessToken, articleId);
}

async function getAccessTokenWithCache(appId: string, appSecret: string) {
    // 1. 先尝试从本地缓存获取
    const cached = tokenStore.getToken(appId);
    if (cached) {
        return cached;
    }

    // 2. 缓存不存在或已过期，调用微信接口
    const result = await fetchAccessToken(appId, appSecret);

    // 3. 写入缓存
    await tokenStore.setToken(appId, result.access_token, result.expires_in);

    return result.access_token;
}

async function resolveAccessToken(publishOptions: WechatPublishOptions): Promise<string> {
    const { appId, appSecret } = publishOptions;
    const appIdFinal = appId ?? process.env.WECHAT_APP_ID;
    const appSecretFinal = appSecret ?? process.env.WECHAT_APP_SECRET;
    if (!appIdFinal || !appSecretFinal) {
        throw new Error("请通过参数或环境变量 WECHAT_APP_ID / WECHAT_APP_SECRET 提供公众号凭据");
    }
    return await getAccessTokenWithCache(appIdFinal, appSecretFinal);
}

async function toBlobFromPathOrUrl(
    filePathOrUrl: string,
    relativePath?: string,
): Promise<{ fileData: Blob; filename: string }> {
    if (filePathOrUrl.startsWith("http")) {
        const response = await fetch(filePathOrUrl);
        if (!response.ok || !response.body) {
            throw new Error(`下载文件失败 URL: ${filePathOrUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
            throw new Error(`远程文件大小为0，无法上传: ${filePathOrUrl}`);
        }
        const fileNameFromUrl = path.basename(filePathOrUrl.split("?")[0]);
        const ext = path.extname(fileNameFromUrl);
        const filename = ext === "" ? `${fileNameFromUrl}.bin` : fileNameFromUrl;
        const contentType = response.headers.get("content-type") || "application/octet-stream";
        return {
            fileData: new Blob([Buffer.from(arrayBuffer)], { type: contentType }),
            filename,
        };
    }

    const resolvedPath = RuntimeEnv.resolveLocalPath(filePathOrUrl, relativePath);
    const fileFromPathResult = await fileFromPath(resolvedPath);
    return {
        fileData: new Blob([await fileFromPathResult.arrayBuffer()], { type: fileFromPathResult.type }),
        filename: path.basename(resolvedPath),
    };
}

function assertNonEmpty(name: string, value: string) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${name} 不能为空`);
    }
}

function assertNonNegativeInteger(name: string, value: number) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${name} 必须是大于等于 0 的整数`);
    }
}

function assertCountRange(name: string, value: number, min: number, max: number) {
    if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error(`${name} 必须是 ${min} 到 ${max} 之间的整数`);
    }
}

function assertCropSpec(name: string, value?: string) {
    if (!value) {
        return;
    }
    if (!/^\d*\.?\d+_\d*\.?\d+_\d*\.?\d+_\d*\.?\d+$/.test(value)) {
        throw new Error(`${name} 格式错误，应为 X1_Y1_X2_Y2`);
    }
}
