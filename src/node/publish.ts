import { JSDOM } from "jsdom";
import { fileFromPath } from "formdata-node/file-from-path";
import path from "node:path";
import { stat } from "node:fs/promises";
import { RuntimeEnv } from "./runtimeEnv.js";
import { createWechatClient } from "../wechat.js";
import { nodeHttpAdapter } from "./nodeHttpAdapter.js";
import { UploadResponse } from "../http.js";

const { uploadMaterial, publishArticle, fetchAccessToken } = createWechatClient(nodeHttpAdapter);

async function uploadImage(
    imageUrl: string,
    accessToken: string,
    fileName?: string,
    relativePath?: string,
): Promise<UploadResponse> {
    let fileData: Blob;
    let finalName: string;

    if (imageUrl.startsWith("http")) {
        // 远程 URL
        const response = await fetch(imageUrl);
        if (!response.ok || !response.body) {
            throw new Error(`Failed to download image from URL: ${imageUrl}`);
        }
        const fileNameFromUrl = path.basename(imageUrl.split("?")[0]);
        const ext = path.extname(fileNameFromUrl);
        finalName = fileName ?? (ext === "" ? `${fileNameFromUrl}.jpg` : fileNameFromUrl);
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength === 0) {
            throw new Error(`远程图片大小为0，无法上传: ${imageUrl}`);
        }
        const contentType = response.headers.get("content-type") || "image/jpeg";
        fileData = new Blob([buffer], { type: contentType });
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

    const data = await uploadMaterial("image", fileData, finalName, accessToken);
    if ((data as any).errcode) {
        throw new Error(`上传失败，错误码：${(data as any).errcode}，错误信息：${(data as any).errmsg}`);
    }
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

export interface PublishOptions {
    appId?: string;
    appSecret?: string;
    relativePath?: string;
}

export async function publishToDraft(title: string, content: string, cover: string = "", options: PublishOptions = {}) {
    const { appId, appSecret, relativePath } = options;
    const appIdEnv = process.env.WECHAT_APP_ID || "";
    const appSecretEnv = process.env.WECHAT_APP_SECRET || "";
    const accessToken = await fetchAccessToken(appId ?? appIdEnv, appSecret ?? appSecretEnv);
    if (!accessToken.access_token) {
        if (accessToken.errcode) {
            throw new Error(`获取 Access Token 失败，错误码：${accessToken.errcode}，${accessToken.errmsg}`);
        } else {
            throw new Error(`获取 Access Token 失败: ${accessToken}`);
        }
    }
    const { html, firstImageId } = await uploadImages(content, accessToken.access_token, relativePath);
    let thumbMediaId = "";
    if (cover) {
        const resp = await uploadImage(cover, accessToken.access_token, "cover.jpg", relativePath);
        thumbMediaId = resp.media_id;
    } else {
        if (firstImageId.startsWith("https://mmbiz.qpic.cn")) {
            const resp = await uploadImage(firstImageId, accessToken.access_token, "cover.jpg", relativePath);
            thumbMediaId = resp.media_id;
        } else {
            thumbMediaId = firstImageId;
        }
    }
    if (!thumbMediaId) {
        throw new Error("你必须指定一张封面图或者在正文中至少出现一张图片。");
    }
    const data = await publishArticle(title, html, thumbMediaId, accessToken.access_token);
    if (data.media_id) {
        return data;
    } else if (data.errcode) {
        throw new Error(`上传到公众号草稿失败，错误码：${data.errcode}，${data.errmsg}`);
    } else {
        throw new Error(`上传到公众号草稿失败: ${data}`);
    }
}
