import { JSDOM } from "jsdom";
import { fileFromPath } from "formdata-node/file-from-path";
import path from "node:path";
import { stat } from "node:fs/promises";
import { RuntimeEnv } from "./runtimeEnv.js";
import type { WechatPublishResponse, WechatUploadResponse, ImageListItem } from "../wechat.js";
import { nodeHttpAdapter } from "./nodeHttpAdapter.js";
import { NodeTokenStorageAdapter } from "./tokenStoreNodeAdapter.js";
import { NodeUploadCacheAdapter } from "./uploadCacheNodeAdapter.js";
import { ArticleOptions, ImageTextArticleOptions, WechatPublisher } from "../publish.js";
import { CredentialStore } from "../credentialStore.js";
import { NodeCredentialStorageAdapter } from "./credentialStoreNodeAdapter.js";

const mediaIdMapping = new Map<string, string>(); // 微信 url 和 media_id 的映射
export const wechatPublisher = new WechatPublisher(
    nodeHttpAdapter,
    new NodeTokenStorageAdapter(),
    new NodeUploadCacheAdapter(),
);

export const credentialStore = new CredentialStore(new NodeCredentialStorageAdapter());

interface PublishOptions {
    appId?: string;
    appSecret?: string;
    relativePath?: string;
}

async function uploadImage(
    imageUrl: string,
    accessToken: string,
    fileName?: string,
    relativePath?: string,
    appId?: string,
): Promise<WechatUploadResponse> {
    let fileData: Blob;
    let finalName: string;

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
        const fileNameFromUrl = path.basename(imageUrl.split("?")[0]);
        const ext = path.extname(fileNameFromUrl);
        finalName = fileName ?? (ext === "" ? `${fileNameFromUrl}.jpg` : fileNameFromUrl);

        const contentType = response.headers.get("content-type") || "image/jpeg";
        fileData = new Blob([arrayBuffer], { type: contentType });
    } else {
        // 本地路径
        const resolvedPath = RuntimeEnv.resolveLocalPath(imageUrl, relativePath);
        const stats = await stat(resolvedPath);
        if (stats.size === 0) {
            throw new Error(`本地图片大小为0，无法上传: ${resolvedPath}`);
        }

        const fileNameFromLocal = path.basename(resolvedPath);
        const ext = path.extname(fileNameFromLocal);
        finalName = fileName ?? (ext === "" ? `${fileNameFromLocal}.jpg` : fileNameFromLocal);
        const fileFromPathResult = await fileFromPath(resolvedPath);
        fileData = new Blob([await fileFromPathResult.arrayBuffer()], { type: fileFromPathResult.type });
    }

    // 上传
    const data = await wechatPublisher.uploadImage(fileData, finalName, accessToken, appId);
    // 写入映射
    mediaIdMapping.set(data.url, data.media_id);
    return data;
}

async function uploadImages(
    content: string,
    accessToken: string,
    relativePath?: string,
    appId?: string,
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
                const resp = await uploadImage(dataSrc, accessToken, undefined, relativePath, appId);
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
    publishOptions: PublishOptions = {},
): Promise<WechatPublishResponse> {
    const { title, content, cover, author, source_url, need_open_comment, only_fans_can_comment } = articleOptions;
    const { appId, appSecret, relativePath } = publishOptions;

    const { appId: appIdFinal, appSecret: appSecretFinal } = await getAppIdAndSecret(appId, appSecret);
    const accessToken = await wechatPublisher.getAccessTokenWithCache(appIdFinal, appSecretFinal);

    // 上传正文图片
    const { html, firstImageId } = await uploadImages(content, accessToken, relativePath, appIdFinal);

    // 处理封面图
    let thumbMediaId: string | undefined;

    if (cover) {
        const cachedThumbMediaId = mediaIdMapping.get(cover);
        if (cachedThumbMediaId) {
            thumbMediaId = cachedThumbMediaId;
        } else {
            const resp = await uploadImage(cover, accessToken, "cover.jpg", relativePath, appIdFinal);
            thumbMediaId = resp.media_id;
        }
    } else {
        // 如果是 URL，需要重新上传作为封面，为了获取 media_id
        if (firstImageId.startsWith("https://mmbiz.qpic.cn")) {
            const cachedThumbMediaId = mediaIdMapping.get(firstImageId);
            if (cachedThumbMediaId) {
                thumbMediaId = cachedThumbMediaId;
            } else {
                const resp = await uploadImage(firstImageId, accessToken, "cover.jpg", relativePath, appIdFinal);
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

    const data = await wechatPublisher.publishToDraft(accessToken, {
        title,
        content: html,
        thumb_media_id: thumbMediaId,
        author,
        content_source_url: source_url,
        need_open_comment: need_open_comment ? 1 : 0,
        only_fans_can_comment: only_fans_can_comment ? 1 : 0,
    });

    if (data.media_id) {
        return data;
    }

    throw new Error(`上传到公众号草稿失败: ${JSON.stringify(data)}`);
}

/**
 * @deprecated use publishToWechatDraft instead
 */
export async function publishToDraft(
    title: string,
    content: string,
    cover: string = "",
    options: PublishOptions = {},
): Promise<WechatPublishResponse> {
    return publishToWechatDraft({ title, content, cover }, options);
}

async function getAppIdAndSecret(
    appId: string | undefined,
    appSecret: string | undefined,
): Promise<{ appId: string; appSecret: string }> {
    if (appId && appSecret) {
        return { appId, appSecret };
    }

    const envAppId = process.env.WECHAT_APP_ID;
    const envAppSecret = process.env.WECHAT_APP_SECRET;

    // 优先使用环境变量中的凭据（如果 appId 匹配或者未提供 appId），其次使用配置文件中的凭据
    if (envAppId && envAppSecret && (envAppId === appId || !appId)) {
        return { appId: envAppId, appSecret: envAppSecret };
    }

    // 如果参数和环境变量中都没有提供 appId，则无法确定凭据来源，抛出错误
    if (!appId) {
        throw new Error("未提供 AppID：请通过参数、环境变量或配置文件指定。");
    }

    const credential = await credentialStore.getWechatCredential(appId);
    if (credential?.appId && credential?.appSecret) {
        return { appId: credential.appId, appSecret: credential.appSecret };
    }

    throw new Error(`未能找到 AppID 为 "${appId}" 的公众号凭据，请检查配置文件。`);
}

export async function publishImageTextToWechatDraft(
    articleOptions: ImageTextArticleOptions,
    publishOptions: PublishOptions = {},
): Promise<WechatPublishResponse> {
    const { title, content, images, cover, author, need_open_comment, only_fans_can_comment } = articleOptions;
    const { appId, appSecret, relativePath } = publishOptions;

    const { appId: appIdFinal, appSecret: appSecretFinal } = await getAppIdAndSecret(appId, appSecret);

    if (!images || images.length === 0) {
        throw new Error("图片消息至少需要一张图片");
    }

    const accessToken = await wechatPublisher.getAccessTokenWithCache(appIdFinal, appSecretFinal);

    // 上传所有图片获取 media_id
    const imageInfoList: ImageListItem[] = [];
    for (const img of images) {
        const resp = await uploadImage(img, accessToken, undefined, relativePath);
        imageInfoList.push({ image_media_id: resp.media_id });
    }

    // 封面图：优先使用 cover，否则用第一张图（已经上传过了）
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
        thumbMediaId = imageInfoList[0].image_media_id;
    }

    if (!thumbMediaId) {
        throw new Error("未能获取封面图的 media_id");
    }

    const data = await wechatPublisher.publishToDraft(
        accessToken, {
        title,
        content,
        thumb_media_id: thumbMediaId,
        author,
        article_type: "newspic",
        image_info: { image_list: imageInfoList },
        need_open_comment: need_open_comment ? 1 : 0,
        only_fans_can_comment: only_fans_can_comment ? 1 : 0,
    });

    if (data.media_id) {
        return data;
    }

    throw new Error(`上传图片消息到公众号草稿失败: ${JSON.stringify(data)}`);
}
