import { JSDOM } from "jsdom";
import { fileFromPath } from "formdata-node/file-from-path";
import path from "node:path";
import { stat } from "node:fs/promises";
import { RuntimeEnv } from "./runtimeEnv.js";
import { createWechatClient, WechatUploadResponse } from "../wechat.js";
import { nodeHttpAdapter } from "./nodeHttpAdapter.js";
import { tokenStore } from "./tokenStore.js";
import { md5FromBuffer, md5FromFile } from "./utils.js";
import { uploadCacheStore } from "./uploadCacheStore.js";

const { uploadMaterial, publishArticle, fetchAccessToken } = createWechatClient(nodeHttpAdapter);
const mediaIdMapping = new Map<string, string>(); // 微信 url 和 media_id 的映射

export interface PublishOptions {
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
            throw new Error(`Failed to download image from URL: ${imageUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
            throw new Error(`远程图片大小为0，无法上传: ${imageUrl}`);
        }
        const buffer = Buffer.from(arrayBuffer);
        md5 = md5FromBuffer(buffer);
        // 先查缓存
        const cached = uploadCacheStore.get(md5);
        if (cached) {
            // 写入映射
            mediaIdMapping.set(cached.url, cached.media_id);
            return {
                media_id: cached.media_id,
                url: cached.url,
            } as WechatUploadResponse;
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

        md5 = md5FromFile(resolvedPath);

        // 查缓存
        const cached = uploadCacheStore.get(md5);
        if (cached) {
            // 写入映射
            mediaIdMapping.set(cached.url, cached.media_id);
            return {
                media_id: cached.media_id,
                url: cached.url,
            } as WechatUploadResponse;
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
    uploadCacheStore.set(md5, data.media_id, data.url);
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

export async function publishToWechatDraft(articleOptions: ArticleOptions, publishOptions: PublishOptions = {}) {
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
            // 写入映射
            mediaIdMapping.set(resp.url, resp.media_id);
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
                // 写入映射
                mediaIdMapping.set(resp.url, resp.media_id);
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

export async function publishToDraft(title: string, content: string, cover: string = "", options: PublishOptions = {}) {
    return publishToWechatDraft({ title, content, cover }, options);
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
    tokenStore.setToken(appId, result.access_token, result.expires_in);

    return result.access_token;
}
