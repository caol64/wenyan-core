import { JSDOM } from "jsdom";
import { fileFromPath } from "formdata-node/file-from-path";
import path from "node:path";
import { stat } from "node:fs/promises";
import { RuntimeEnv } from "./runtimeEnv.js";
import { WechatPublishResponse, WechatUploadResponse } from "../wechat.js";
import { createNodeHttpAdapter, NodeHttpAdapterOptions } from "./nodeHttpAdapter.js";
import { NodeTokenStorageAdapter } from "./tokenStoreNodeAdapter.js";
import { NodeUploadCacheAdapter } from "./uploadCacheNodeAdapter.js";
import { ArticleOptions, WechatPublisher } from "../publish.js";
import { CredentialStore } from "../credentialStore.js";
import { NodeCredentialStorageAdapter } from "./credentialStoreNodeAdapter.js";

const mediaIdMapping = new Map<string, string>(); // 微信 url 和 media_id 的映射

// 导出默认的无代理 publisher（保持向后兼容）
export const wechatPublisher = new WechatPublisher(
    createNodeHttpAdapter(),
    new NodeTokenStorageAdapter(),
    new NodeUploadCacheAdapter()
);

interface PublishOptions {
    appId?: string;
    appSecret?: string;
    relativePath?: string;
    /**
     * 代理服务器地址
     * 支持格式:
     * - http://127.0.0.1:7890
     * - https://127.0.0.1:7890
     * - socks5://127.0.0.1:1080
     * - socks4://127.0.0.1:1080
     */
    proxy?: string;
}

/**
 * 创建带代理配置的 WechatPublisher 实例
 */
function createWechatPublisherWithProxy(proxy?: string): WechatPublisher {
    if (!proxy) {
        return wechatPublisher; // 如果没有代理，返回默认实例
    }
    
    const adapterOptions: NodeHttpAdapterOptions = { proxy };
    return new WechatPublisher(
        createNodeHttpAdapter(adapterOptions),
        new NodeTokenStorageAdapter(),
        new NodeUploadCacheAdapter()
    );
}

async function uploadImage(
    imageUrl: string,
    accessToken: string,
    fileName?: string,
    relativePath?: string,
    publisher: WechatPublisher = wechatPublisher,
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
    const data = await publisher.uploadImage(fileData, finalName, accessToken);
    // 写入映射
    mediaIdMapping.set(data.url, data.media_id);
    return data;
}

async function uploadImages(
    content: string,
    accessToken: string,
    relativePath?: string,
    publisher: WechatPublisher = wechatPublisher,
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
                const resp = await uploadImage(dataSrc, accessToken, undefined, relativePath, publisher);
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
    const { title, content, cover, author, source_url } = articleOptions;
    const { appId, appSecret, relativePath, proxy } = publishOptions;

    const appIdFinal = appId ?? process.env.WECHAT_APP_ID;
    const appSecretFinal = appSecret ?? process.env.WECHAT_APP_SECRET;

    if (!appIdFinal || !appSecretFinal) {
        throw new Error("请通过参数或环境变量 WECHAT_APP_ID / WECHAT_APP_SECRET 提供公众号凭据");
    }

    // 根据代理配置创建 publisher 实例
    const currentPublisher = createWechatPublisherWithProxy(proxy);

    const accessToken = await currentPublisher.getAccessTokenWithCache(appIdFinal, appSecretFinal);

    // 上传正文图片
    const { html, firstImageId } = await uploadImages(content, accessToken, relativePath, currentPublisher);

    // 处理封面图
    let thumbMediaId: string | undefined;

    if (cover) {
        const cachedThumbMediaId = mediaIdMapping.get(cover);
        if (cachedThumbMediaId) {
            thumbMediaId = cachedThumbMediaId;
        } else {
            const resp = await uploadImage(cover, accessToken, "cover.jpg", relativePath, currentPublisher);
            thumbMediaId = resp.media_id;
        }
    } else {
        // 如果是 URL，需要重新上传作为封面，为了获取 media_id
        if (firstImageId.startsWith("https://mmbiz.qpic.cn")) {
            const cachedThumbMediaId = mediaIdMapping.get(firstImageId);
            if (cachedThumbMediaId) {
                thumbMediaId = cachedThumbMediaId;
            } else {
                const resp = await uploadImage(firstImageId, accessToken, "cover.jpg", relativePath, currentPublisher);
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

    const data = await currentPublisher.publishToDraft(accessToken, {
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
