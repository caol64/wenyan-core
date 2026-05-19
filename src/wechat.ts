import type { HttpAdapter } from "./http.js";

const tokenUrl = "https://api.weixin.qq.com/cgi-bin/token";
const publishUrl = "https://api.weixin.qq.com/cgi-bin/draft/add";
const uploadUrl = "https://api.weixin.qq.com/cgi-bin/material/add_material";
const draftListUrl = "https://api.weixin.qq.com/cgi-bin/draft/batchget";
const draftGetUrl = "https://api.weixin.qq.com/cgi-bin/draft/get";
const draftUpdateUrl = "https://api.weixin.qq.com/cgi-bin/draft/update";

export interface ImageCropPercent {
    ratio: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ImageListItem {
    image_media_id: string;
    crop_percent_list?: ImageCropPercent[];
}

export interface ImageInfo {
    image_list: ImageListItem[];
}

export interface WechatPublishOptions {
    title: string;
    author?: string;
    content: string;
    thumb_media_id: string;
    content_source_url?: string;
    article_type?: "news" | "newspic";
    image_info?: ImageInfo;
    need_open_comment?: 0 | 1;
    only_fans_can_comment?: 0 | 1;
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

export interface WechatDraftListItem {
    media_id: string;
    content: {
        news_item: WechatPublishOptions[];
    };
    update_time: number;
}

export interface WechatDraftListResponse {
    total_count: number;
    item_count: number;
    item: WechatDraftListItem[];
}

export interface WechatDraftGetResponse {
    news_item: WechatPublishOptions[];
}

export interface WechatDraftUpdateResponse {
    errcode: number;
    errmsg: string;
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

        async listDrafts(accessToken: string, offset = 0, count = 20, noContent = 0): Promise<WechatDraftListResponse> {
            const res = await httpAdapter.fetch(`${draftListUrl}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ offset, count, no_content: noContent }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            assertWechatSuccess(data);
            return data as WechatDraftListResponse;
        },

        async getDraft(accessToken: string, mediaId: string): Promise<WechatDraftGetResponse> {
            const res = await httpAdapter.fetch(`${draftGetUrl}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ media_id: mediaId }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            assertWechatSuccess(data);
            return data as WechatDraftGetResponse;
        },

        async updateDraft(accessToken: string, mediaId: string, articleIndex: number, options: Partial<WechatPublishOptions>): Promise<void> {
            const res = await httpAdapter.fetch(`${draftUpdateUrl}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({
                    media_id: mediaId,
                    index: articleIndex,
                    articles: options,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            assertWechatSuccess(data);
        },
    };
}

const WECHAT_ERROR_HINTS: Record<number, string> = {
    45166: "内容超长。小绿书模式有内容长度限制，请精简正文后重试。",
};

function assertWechatSuccess<T extends object>(data: T | WechatErrorResponse): asserts data is T {
    if ("errcode" in data && data.errcode !== 0) {
        const hint = WECHAT_ERROR_HINTS[data.errcode];
        throw new Error(hint ? `${data.errcode}: ${hint} (${data.errmsg})` : `${data.errcode}: ${data.errmsg}`);
    }
}

export type WechatClient = ReturnType<typeof createWechatClient>;
