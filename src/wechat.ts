import type { HttpAdapter } from "./http.js";

export const WECHAT_API_ENDPOINTS = {
    token: "https://api.weixin.qq.com/cgi-bin/token",
    getMaterial: "https://api.weixin.qq.com/cgi-bin/material/get_material",
    getMaterialCount: "https://api.weixin.qq.com/cgi-bin/material/get_materialcount",
    batchGetMaterial: "https://api.weixin.qq.com/cgi-bin/material/batchget_material",
    uploadArticleImage: "https://api.weixin.qq.com/cgi-bin/media/uploadimg",
    publishDraft: "https://api.weixin.qq.com/cgi-bin/draft/add",
    getDraftSwitch: "https://api.weixin.qq.com/cgi-bin/draft/switch",
    getDraftList: "https://api.weixin.qq.com/cgi-bin/draft/batchget",
    getDraftCount: "https://api.weixin.qq.com/cgi-bin/draft/count",
    getDraft: "https://api.weixin.qq.com/cgi-bin/draft/get",
    updateDraft: "https://api.weixin.qq.com/cgi-bin/draft/update",
    deleteDraft: "https://api.weixin.qq.com/cgi-bin/draft/delete",
    submitPublish: "https://api.weixin.qq.com/cgi-bin/freepublish/submit",
    getPublishStatus: "https://api.weixin.qq.com/cgi-bin/freepublish/get",
    getPublishedArticle: "https://api.weixin.qq.com/cgi-bin/freepublish/getarticle",
    uploadMaterial: "https://api.weixin.qq.com/cgi-bin/material/add_material",
    deleteMaterial: "https://api.weixin.qq.com/cgi-bin/material/del_material",
    uploadTemporaryMaterial: "https://api.weixin.qq.com/cgi-bin/media/upload",
    getTemporaryMaterial: "https://api.weixin.qq.com/cgi-bin/media/get",
    getHdVoice: "https://api.weixin.qq.com/cgi-bin/media/get/jssdk",
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

export interface WechatUploadArticleImageResponse {
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

export type WechatMaterialType = "image" | "voice" | "video" | "thumb";
export type WechatPermanentMaterialType = "image" | "voice" | "video" | "news";

export interface WechatMaterialCountResponse {
    voice_count: number;
    video_count: number;
    image_count: number;
    news_count: number;
}

export interface WechatBatchGetMaterialOptions {
    type: WechatPermanentMaterialType;
    offset: number;
    count: number;
}

export interface WechatBatchGetMaterialResponse {
    total_count: number;
    item_count: number;
    item: object[];
}

export interface WechatUploadTemporaryMediaResponse {
    type: string;
    media_id: string;
    created_at: number;
}

export interface WechatDraftSwitchResponse extends WechatOperationResponse {
    is_open?: number;
}

export interface WechatDraftListOptions {
    offset: number;
    count: number;
    no_content?: 0 | 1;
}

export interface WechatDraftListResponse {
    total_count: number;
    item_count: number;
    item: object[];
}

export interface WechatDraftCountResponse {
    total_count: number;
}

export interface WechatDraftDetailResponse {
    news_item: object[];
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
type UploadArticleImageResult = WechatUploadArticleImageResponse | WechatErrorResponse;
type MaterialCountResult = WechatMaterialCountResponse | WechatErrorResponse;
type BatchGetMaterialResult = WechatBatchGetMaterialResponse | WechatErrorResponse;
type UploadTemporaryMediaResult = WechatUploadTemporaryMediaResponse | WechatErrorResponse;
type DraftSwitchResult = WechatDraftSwitchResponse | WechatErrorResponse;
type DraftListResult = WechatDraftListResponse | WechatErrorResponse;
type DraftCountResult = WechatDraftCountResponse | WechatErrorResponse;
type DraftDetailResult = WechatDraftDetailResponse | WechatErrorResponse;
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
            type: WechatMaterialType,
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

        async getMaterial(accessToken: string, mediaId: string): Promise<object | Blob> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getMaterial}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ media_id: mediaId }),
            });
            if (!res.ok) throw new Error(await res.text());
            return await parseWechatJsonOrBlob(res);
        },

        async getMaterialCount(accessToken: string): Promise<WechatMaterialCountResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getMaterialCount}?access_token=${accessToken}`);
            if (!res.ok) throw new Error(await res.text());
            const data: MaterialCountResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async batchGetMaterial(
            accessToken: string,
            options: WechatBatchGetMaterialOptions,
        ): Promise<WechatBatchGetMaterialResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.batchGetMaterial}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify(options),
            });
            if (!res.ok) throw new Error(await res.text());
            const data: BatchGetMaterialResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async uploadArticleImage(accessToken: string, file: Blob, filename: string): Promise<WechatUploadArticleImageResponse> {
            const multipart = adapter.createMultipart("media", file, filename);
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.uploadArticleImage}?access_token=${accessToken}`, {
                ...multipart,
                method: "POST",
            });
            if (!res.ok) throw new Error(await res.text());
            const data: UploadArticleImageResult = await res.json();
            assertWechatSuccess(data);

            if (data.url.startsWith("http://")) {
                data.url = data.url.replace(/^http:\/\//i, "https://");
            }
            return data;
        },

        async deleteMaterial(accessToken: string, mediaId: string): Promise<WechatOperationResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.deleteMaterial}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ media_id: mediaId }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data: OperationResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async uploadTemporaryMaterial(
            accessToken: string,
            type: WechatMaterialType,
            file: Blob,
            filename: string,
        ): Promise<WechatUploadTemporaryMediaResponse> {
            const multipart = adapter.createMultipart("media", file, filename);
            const res = await adapter.fetch(
                `${WECHAT_API_ENDPOINTS.uploadTemporaryMaterial}?access_token=${accessToken}&type=${type}`,
                {
                    ...multipart,
                    method: "POST",
                },
            );
            if (!res.ok) throw new Error(await res.text());
            const data: UploadTemporaryMediaResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async getTemporaryMaterial(accessToken: string, mediaId: string): Promise<object | Blob> {
            const res = await adapter.fetch(
                `${WECHAT_API_ENDPOINTS.getTemporaryMaterial}?access_token=${accessToken}&media_id=${mediaId}`,
            );
            if (!res.ok) throw new Error(await res.text());
            return await parseWechatJsonOrBlob(res);
        },

        async getHdVoice(accessToken: string, mediaId: string): Promise<object | Blob> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getHdVoice}?access_token=${accessToken}&media_id=${mediaId}`);
            if (!res.ok) throw new Error(await res.text());
            return await parseWechatJsonOrBlob(res);
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

        async draftSwitch(accessToken: string, checkOnly = false): Promise<WechatDraftSwitchResponse> {
            const checkOnlyArg = checkOnly ? "&checkonly=1" : "";
            const res = await adapter.fetch(
                `${WECHAT_API_ENDPOINTS.getDraftSwitch}?access_token=${accessToken}${checkOnlyArg}`,
                { method: "POST" },
            );

            if (!res.ok) throw new Error(await res.text());
            const data: DraftSwitchResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async getDraftList(accessToken: string, options: WechatDraftListOptions): Promise<WechatDraftListResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getDraftList}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify(options),
            });
            if (!res.ok) throw new Error(await res.text());
            const data: DraftListResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async getDraftCount(accessToken: string): Promise<WechatDraftCountResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getDraftCount}?access_token=${accessToken}`);
            if (!res.ok) throw new Error(await res.text());
            const data: DraftCountResult = await res.json();
            assertWechatSuccess(data);
            return data;
        },

        async getDraft(accessToken: string, mediaId: string): Promise<WechatDraftDetailResponse> {
            const res = await adapter.fetch(`${WECHAT_API_ENDPOINTS.getDraft}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({ media_id: mediaId }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data: DraftDetailResult = await res.json();
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

async function parseWechatJsonOrBlob(res: Response): Promise<object | Blob> {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        const data = (await res.json()) as object | WechatErrorResponse;
        assertWechatSuccess(data);
        return data;
    }
    return await res.blob();
}

export type WechatClient = ReturnType<typeof createWechatClient>;
