import type { HttpAdapter } from "./http.js";

export const WECHAT_API_ENDPOINTS = {
    token: "https://api.weixin.qq.com/cgi-bin/token",
    publishDraft: "https://api.weixin.qq.com/cgi-bin/draft/add",
    updateDraft: "https://api.weixin.qq.com/cgi-bin/draft/update",
    deleteDraft: "https://api.weixin.qq.com/cgi-bin/draft/delete",
    submitPublish: "https://api.weixin.qq.com/cgi-bin/freepublish/submit",
    getPublishStatus: "https://api.weixin.qq.com/cgi-bin/freepublish/get",
    getPublishedArticle: "https://api.weixin.qq.com/cgi-bin/freepublish/getarticle",
    uploadMaterial: "https://api.weixin.qq.com/cgi-bin/material/add_material",
} as const;

export interface WechatPublishOptions {
    title: string;
    author?: string;
    content: string;
    thumb_media_id: string;
    content_source_url?: string;
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

export interface WechatDraftArticle {
    article_type?: "news" | "newspic";
    title: string;
    author?: string;
    digest?: string;
    content: string;
    content_source_url?: string;
    thumb_media_id?: string;
    need_open_comment?: number;
    only_fans_can_comment?: number;
    pic_crop_235_1?: string;
    pic_crop_1_1?: string;
    image_info?: object;
    cover_info?: object;
    product_info?: object;
}

export interface WechatDraftUpdateOptions {
    media_id: string;
    index: number;
    articles: WechatDraftArticle;
}

export interface WechatOperationResponse {
    errcode: number;
    errmsg: string;
}

export interface WechatSubmitPublishResponse extends WechatOperationResponse {
    publish_id: string;
    msg_data_id?: string;
}

export interface WechatPublishStatusResponse {
    publish_id: string;
    publish_status: number;
    article_id?: string;
    article_detail?: object;
    fail_idx?: number[];
}

export interface WechatPublishedArticleResponse {
    news_item: object[];
}

type UploadResult = WechatUploadResponse | WechatErrorResponse;
type TokenResult = WechatTokenResponse | WechatErrorResponse;
type PublishResult = WechatPublishResponse | WechatErrorResponse;
type OperationResult = WechatOperationResponse | WechatErrorResponse;
type SubmitPublishResult = WechatSubmitPublishResponse | WechatErrorResponse;
type PublishStatusResult = WechatPublishStatusResponse | WechatErrorResponse;
type PublishedArticleResult = WechatPublishedArticleResponse | WechatErrorResponse;

export function createWechatClient(adapter: HttpAdapter) {
    return {
        async fetchAccessToken(appId: string, appSecret: string): Promise<WechatTokenResponse> {
            const res = await adapter.fetch(
                `${WECHAT_API_ENDPOINTS.token}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
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
            const multipart = adapter.createMultipart("media", file, filename);

            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.uploadMaterial}?access_token=${accessToken}&type=${type}`, {
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
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.publishDraft}?access_token=${accessToken}`, {
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

        async updateDraft(accessToken: string, options: WechatDraftUpdateOptions): Promise<WechatOperationResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.updateDraft}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify(options),
            });

            if (!res.ok) throw new Error(await res.text());

            const data: OperationResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async deleteDraft(accessToken: string, mediaId: string): Promise<WechatOperationResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.deleteDraft}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ media_id: mediaId }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data: OperationResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async submitPublish(accessToken: string, mediaId: string): Promise<WechatSubmitPublishResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.submitPublish}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ media_id: mediaId }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data: SubmitPublishResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async getPublishStatus(accessToken: string, publishId: string): Promise<WechatPublishStatusResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getPublishStatus}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ publish_id: publishId }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data: PublishStatusResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async getPublishedArticle(accessToken: string, articleId: string): Promise<WechatPublishedArticleResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getPublishedArticle}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ article_id: articleId }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data: PublishedArticleResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },
    };
}

function assertWechatSuccess<T extends object>(data: T | WechatErrorResponse): asserts data is T {
    if ("errcode" in data && data.errcode !== 0) {
        throw new Error(`${data.errcode}: ${data.errmsg}`);
    }
}

export type WechatClient = ReturnType<typeof createWechatClient>;
