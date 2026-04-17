import type { HttpAdapter } from "./http.js";

const tokenUrl = "https://api.weixin.qq.com/cgi-bin/token";
const publishUrl = "https://api.weixin.qq.com/cgi-bin/draft/add";
const uploadUrl = "https://api.weixin.qq.com/cgi-bin/material/add_material";

export interface ImageCropPercent {
    ratio: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ImageInfo {
    image_media_id: string;
    crop_percent_list?: ImageCropPercent[];
}

export interface WechatPublishOptions {
    title: string;
    author?: string;
    content: string;
    thumb_media_id: string;
    content_source_url?: string;
    article_type?: "news" | "newspic";
    image_info?: ImageInfo[];
}

export interface WechatErrorResponse {
    errcode: number;
    errmsg: string;
}

export interface WechatUploadResponse {
    media_id: string;
    url: string;
}

export interface WechatTokenResponse {
    access_token: string;
    expires_in: number;
}

export interface WechatPublishResponse {
    media_id: string;
}

type UploadResult = WechatUploadResponse | WechatErrorResponse;
type TokenResult = WechatTokenResponse | WechatErrorResponse;
type PublishResult = WechatPublishResponse | WechatErrorResponse;

export function createWechatClient(httpAdapter: HttpAdapter) {
    return {
        async fetchAccessToken(appId: string, appSecret: string): Promise<WechatTokenResponse> {
            const res = await httpAdapter.fetch(
                `${tokenUrl}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
            );
            if (!res.ok) throw new Error(await res.text());

            const data: TokenResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async uploadMaterial(
            type: string,
            file: Blob,
            filename: string,
            accessToken: string,
        ): Promise<WechatUploadResponse> {
            const multipart = httpAdapter.createMultipart("media", file, filename);

            const res = await httpAdapter.fetch(`${uploadUrl}?access_token=${accessToken}&type=${type}`, {
                ...multipart,
                method: "POST",
            });

            if (!res.ok) throw new Error(await res.text());

            const data: UploadResult = await res.json();
            assertWechatSuccess(data);

            if (data.url.startsWith("http://")) {
                data.url = data.url.replace(/^http:\/\//i, "https://");
            }

            return data;
        },

        async publishArticle(accessToken: string, options: WechatPublishOptions): Promise<WechatPublishResponse> {
            const res = await httpAdapter.fetch(`${publishUrl}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({
                    articles: [options],
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data: PublishResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },
    };
}

function assertWechatSuccess<T extends object>(data: T | WechatErrorResponse): asserts data is T {
    if ("errcode" in data) {
        throw new Error(`${data.errcode}: ${data.errmsg}`);
    }
}

export type WechatClient = ReturnType<typeof createWechatClient>;
