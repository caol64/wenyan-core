import { JSDOM } from "jsdom";
import { fileFromPath } from 'formdata-node/file-from-path';
import { Blob, File } from 'formdata-node';
import path from "path";
import { fetchAccessToken, publishArticle, uploadMaterial, UploadResponse } from "./wechatApi.js";

const hostImagePath = process.env.HOST_IMAGE_PATH || "";
const dockerImagePath = "/mnt/host-downloads";

async function uploadImage(imageUrl: string, accessToken: string, fileName?: string): Promise<UploadResponse> {
    let fileData: Blob | File;
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
        fileData = new Blob([buffer]);
    } else {
        // 本地路径
        const localImagePath = hostImagePath ? imageUrl.replace(hostImagePath, dockerImagePath) : imageUrl;
        const fileNameFromLocal = path.basename(localImagePath);
        const ext = path.extname(fileNameFromLocal);
        finalName = fileName ?? (ext === "" ? `${fileNameFromLocal}.jpg` : fileNameFromLocal);

        fileData = await fileFromPath(imageUrl);
    }

    const data = await uploadMaterial("image", fileData, finalName, accessToken);
    if ((data as any).errcode) {
        throw new Error(`上传失败，错误码：${(data as any).errcode}，错误信息：${(data as any).errmsg}`);
    }
    return data;
}


async function uploadImages(content: string, accessToken: string): Promise<{ html: string, firstImageId: string }> {
    if (!content.includes('<img')) {
        return { html: content, firstImageId: "" };
    }

    const dom = new JSDOM(content);
    const document = dom.window.document;
    const images = Array.from(document.querySelectorAll('img'));

    const uploadPromises = images.map(async (element) => {
        const dataSrc = element.getAttribute('src');
        if (dataSrc) {
            if (!dataSrc.startsWith('https://mmbiz.qpic.cn')) {
                const resp = await uploadImage(dataSrc, accessToken);
                element.setAttribute('src', resp.url);
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

export async function publishToDraft(title: string, content: string, cover: string, appId?: string, appSecret?: string) {
    const accessToken = await fetchAccessToken(appId, appSecret);
    if (!accessToken.access_token) {
        if (accessToken.errcode) {
            throw new Error(`获取 Access Token 失败，错误码：${accessToken.errcode}，${accessToken.errmsg}`);
        } else {
            throw new Error(`获取 Access Token 失败: ${accessToken}`);
        }
    }
    const handledContent = content.replace(/\n<li/g, "<li").replace(/<\/li>\n/g, "<\/li>");
    const { html, firstImageId } = await uploadImages(handledContent, accessToken.access_token);
    let thumbMediaId = "";
    if (cover) {
        const resp = await uploadImage(cover, accessToken.access_token, "cover.jpg");
        thumbMediaId = resp.media_id;
    } else {
        if (firstImageId.startsWith("https://mmbiz.qpic.cn")) {
            const resp = await uploadImage(firstImageId, accessToken.access_token, "cover.jpg");
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
