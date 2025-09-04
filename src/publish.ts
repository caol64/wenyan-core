import { JSDOM } from "jsdom";
import { FormData, File } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import path from "path";

const tokenUrl = "https://api.weixin.qq.com/cgi-bin/token";
const publishUrl = "https://api.weixin.qq.com/cgi-bin/draft/add";
const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material`;
const appId = process.env.WECHAT_APP_ID || "";
const appSecret = process.env.WECHAT_APP_SECRET || "";

type UploadResponse = {
    media_id: string;
    url: string
};

async function fetchAccessToken() {
    try {
        const response = await fetch(`${tokenUrl}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`);
        const data = await response.json();
        if (data.access_token) {
            return data;
        } else if (data.errcode) {
            throw new Error(`获取 Access Token 失败，错误码：${data.errcode}，${data.errmsg}`);
        } else {
            throw new Error(`获取 Access Token 失败: ${data}`);
        }
    } catch (error) {
        throw error;
    }
}

async function uploadMaterial(type: string, fileData: Blob | File, fileName: string, accessToken: string): Promise<UploadResponse> {
    const form = new FormData();
    form.append("media", fileData, fileName);
    const response = await fetch(`${uploadUrl}?access_token=${accessToken}&type=${type}`, {
        method: 'POST',
        body: form as any,
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`上传失败: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    if (data.errcode) {
        throw new Error(`上传失败，错误码：${data.errcode}，错误信息：${data.errmsg}`);
    }
    const result = data.url.replace("http://", "https://");
    data.url = result;
    return data;
}

async function uploadImage(imageUrl: string, accessToken: string, fileName?: string): Promise<UploadResponse> {
    if (imageUrl.startsWith("http")) {
        const response = await fetch(imageUrl);
        if (!response.ok || !response.body) {
            throw new Error(`Failed to download image from URL: ${imageUrl}`);
        }
        const fileNameFromUrl = path.basename(imageUrl.split("?")[0]);
        const ext = path.extname(fileNameFromUrl);
        const imageName = fileName ?? (ext === "" ? `${fileNameFromUrl}.jpg` : fileNameFromUrl);
        const buffer = await response.arrayBuffer();
        return await uploadMaterial('image', new Blob([buffer]), imageName, accessToken);
    } else {
        const localImagePath = imageUrl;
        const fileNameFromLocal = path.basename(localImagePath);
        const ext = path.extname(fileNameFromLocal);
        const imageName = fileName ?? (ext === "" ? `${fileNameFromLocal}.jpg` : fileNameFromLocal);
        const file = await fileFromPath(localImagePath);
        return await uploadMaterial('image', file, imageName, accessToken);
    }
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

export async function publishToDraft(title: string, content: string, cover: string) {
    try {
        const accessToken = await fetchAccessToken();
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
        const response = await fetch(`${publishUrl}?access_token=${accessToken.access_token}`, {
            method: 'POST',
            body: JSON.stringify({
                articles: [{
                    title: title,
                    content: html,
                    thumb_media_id: thumbMediaId,
                }]
            })
        });
        const data = await response.json();
        if (data.media_id) {
            return data;
        } else if (data.errcode) {
            throw new Error(`上传到公众号草稿失败，错误码：${data.errcode}，${data.errmsg}`);
        } else {
            throw new Error(`上传到公众号草稿失败: ${data}`);
        }
    } catch (error) {
        throw error;
    }
}
