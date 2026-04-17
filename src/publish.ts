import { HttpAdapter } from "./http.js";
import { TokenStore, TokenStorageAdapter } from "./tokenStore.js";
import { UploadCacheStorageAdapter, UploadCacheStore } from "./uploadCacheStore.js";
import {
    createWechatClient,
    WechatPublishOptions,
    WechatPublishResponse,
    WechatUploadResponse,
    type ImageInfo,
    type WechatClient,
} from "./wechat.js";

export interface ArticleOptions {
    title: string;
    content: string;
    cover?: string;
    author?: string;
    source_url?: string;
}

export interface ImageTextArticleOptions {
    content: string;
    images: string[];
    cover?: string;
    author?: string;
}

export class WechatPublisher {
    private tokenStore: TokenStore | undefined;
    private uploadCacheStore: UploadCacheStore | undefined;
    private uploadMaterial: WechatClient["uploadMaterial"];
    private publishArticle: WechatClient["publishArticle"];
    private fetchAccessToken: WechatClient["fetchAccessToken"];

    constructor(
        httpAdapter: HttpAdapter,
        tokenStoreAdapter?: TokenStorageAdapter,
        uploadCacheStoreAdapter?: UploadCacheStorageAdapter,
    ) {
        const { uploadMaterial, publishArticle, fetchAccessToken } = createWechatClient(httpAdapter);
        this.uploadMaterial = uploadMaterial;
        this.publishArticle = publishArticle;
        this.fetchAccessToken = fetchAccessToken;
        this.tokenStore = tokenStoreAdapter ? new TokenStore(tokenStoreAdapter) : undefined;
        this.uploadCacheStore = uploadCacheStoreAdapter ? new UploadCacheStore(uploadCacheStoreAdapter) : undefined;
    }

    public async getAccessTokenWithCache(appId: string, appSecret: string): Promise<string> {
        if (!this.tokenStore) {
            const result = await this.fetchAccessToken(appId, appSecret);
            return result.access_token;
        }
        const cached = this.tokenStore.getToken(appId);
        if (cached) {
            return cached;
        }
        const result = await this.fetchAccessToken(appId, appSecret);
        await this.tokenStore.setToken(appId, result.access_token, result.expires_in);
        return result.access_token;
    }

    public async uploadImage(file: Blob, filename: string, accessToken: string, appId?: string): Promise<WechatUploadResponse> {
        let hash: string | undefined;
        if (this.uploadCacheStore) {
            const arrayBuffer = await file.arrayBuffer();
            hash = await this.uploadCacheStore.calcHash(arrayBuffer);
            const cacheKey = appId ? `${hash}:${appId}` : hash;
            const cached = await this.uploadCacheStore.get(cacheKey);
            if (cached) {
                return {
                    media_id: cached.media_id,
                    url: cached.url,
                };
            }
        }
        const data = await this.uploadMaterial("image", file, filename, accessToken);
        if (this.uploadCacheStore && hash) {
            const cacheKey = appId ? `${hash}:${appId}` : hash;
            await this.uploadCacheStore.set(cacheKey, data.media_id, data.url);
        }

        return data;
    }

    public async publishToDraft(accessToken: string, options: WechatPublishOptions): Promise<WechatPublishResponse> {
        return await this.publishArticle(accessToken, options);
    }

    public async clearCache(): Promise<void> {
        if (this.tokenStore) {
            await this.tokenStore.clear();
        }
        if (this.uploadCacheStore) {
            await this.uploadCacheStore.clear();
        }
    }

    public async publishImageTextToDraft(
        accessToken: string,
        title: string,
        content: string,
        thumbMediaId: string,
        imageInfo: ImageInfo[],
        author?: string,
    ): Promise<WechatPublishResponse> {
        return await this.publishArticle(accessToken, {
            title,
            content,
            thumb_media_id: thumbMediaId,
            author,
            article_type: "newspic",
            image_info: imageInfo,
        });
    }
}

export * from "./tokenStore.js";
export * from "./uploadCacheStore.js";
export * from "./credentialStore.js";
