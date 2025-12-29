import { FormDataEncoder } from "form-data-encoder";
import { FormData, File, Blob } from "formdata-node";
import { Readable } from "node:stream";

const tokenUrl = "https://api.weixin.qq.com/cgi-bin/token";
const publishUrl = "https://api.weixin.qq.com/cgi-bin/draft/add";
const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material`;
const appIdEnv = process.env.WECHAT_APP_ID || "";
const appSecretEnv = process.env.WECHAT_APP_SECRET || "";

export type UploadResponse = {
    media_id: string;
    url: string;
};

export async function fetchAccessToken(appId?: string, appSecret?: string) {
    appId = appId ?? appIdEnv;
    appSecret = appSecret ?? appSecretEnv;
    const response = await fetch(`${tokenUrl}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取AccessToken失败: ${response.status} ${errorText}`);
    }
    return await response.json();
}

export async function uploadMaterial(
    type: string,
    fileData: Blob | File,
    fileName: string,
    accessToken: string
) {
    const form = new FormData();
    form.append("media", fileData, fileName);
    const encoder = new FormDataEncoder(form);
    const response = await fetch(`${uploadUrl}?access_token=${accessToken}&type=${type}`, {
        method: 'POST',
        headers: encoder.headers,
        body: Readable.from(encoder) as any,
        duplex: "half",
    } as RequestInit);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`上传素材失败: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    if (data.errcode && data.errcode !== 0) {
        throw new Error(`上传素材失败: ${data.errcode} ${data.errmsg}`);
    }
    if (data.url && data.url.startsWith("http://")) {
        data.url = data.url.replace(/^http:\/\//i, "https://");
    }
    return data;
}

export async function publishArticle(
    title: string,
    content: string,
    thumbMediaId: string,
    accessToken: string
) {
    const response = await fetch(`${publishUrl}?access_token=${accessToken}`, {
        method: "POST",
        body: JSON.stringify({
            articles: [
                {
                    title,
                    content,
                    thumb_media_id: thumbMediaId,
                },
            ],
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`发布失败: ${response.status} ${errorText}`);
    }
    return await response.json();
}
