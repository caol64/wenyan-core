import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("MCP tool user-story chain coverage", () => {
    const originalEnv = {
        appId: process.env.WECHAT_APP_ID,
        appSecret: process.env.WECHAT_APP_SECRET,
    };

    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
        process.env.WECHAT_APP_ID = "appid_story";
        process.env.WECHAT_APP_SECRET = "secret_story";
    });

    afterEach(() => {
        process.env.WECHAT_APP_ID = originalEnv.appId;
        process.env.WECHAT_APP_SECRET = originalEnv.appSecret;
    });

    it("story: 编辑先管理草稿再发布，链路可完整调用", async () => {
        const tokenCache = new Map<string, string>();
        const lowLevel = {
            fetchAccessToken: vi.fn().mockResolvedValue({ access_token: "token_story", expires_in: 7200 }),
            draftSwitch: vi.fn().mockResolvedValue({ errcode: 0, errmsg: "ok", is_open: 1 }),
            getDraftCount: vi.fn().mockResolvedValue({ total_count: 3 }),
            getDraftList: vi.fn().mockResolvedValue({ total_count: 3, item_count: 1, item: [{ media_id: "d1" }] }),
            getDraft: vi.fn().mockResolvedValue({ news_item: [{ title: "draft-1" }] }),
            updateDraft: vi.fn().mockResolvedValue({ errcode: 0, errmsg: "ok" }),
            submitPublish: vi.fn().mockResolvedValue({ errcode: 0, errmsg: "ok", publish_id: "pub_1" }),
            getPublishStatus: vi.fn().mockResolvedValue({ publish_id: "pub_1", publish_status: 1 }),
            getPublishedArticle: vi.fn().mockResolvedValue({ news_item: [{ title: "done" }] }),
        };

        vi.doMock("../src/wechat.js", () => ({
            createWechatClient: () => lowLevel,
        }));
        vi.doMock("../src/node/tokenStore.js", () => ({
            tokenStore: {
                getToken: vi.fn((appId: string) => tokenCache.get(appId)),
                setToken: vi.fn(async (appId: string, token: string) => {
                    tokenCache.set(appId, token);
                }),
            },
        }));

        const publish = await import("../src/node/publish.js");

        await publish.switchWechatDraft(true);
        await publish.getWechatDraftCount();
        await publish.getWechatDraftList({ offset: 0, count: 1, no_content: 1 });
        await publish.getWechatDraftDetail("d1");
        await publish.updateWechatDraft({
            media_id: "d1",
            index: 0,
            articles: { title: "new-title", content: "<p>ok</p>" },
        });
        const submit = await publish.submitWechatDraft("d1");
        const status = await publish.getWechatPublishStatus(submit.publish_id);
        const article = await publish.getWechatPublishedArticle("article_1");

        expect(submit.publish_id).toBe("pub_1");
        expect(status.publish_status).toBe(1);
        expect(article.news_item).toHaveLength(1);
        expect(lowLevel.fetchAccessToken).toHaveBeenCalledTimes(1);
        expect(lowLevel.getDraftList).toHaveBeenCalledWith("token_story", { offset: 0, count: 1, no_content: 1 });
        expect(lowLevel.submitPublish).toHaveBeenCalledWith("token_story", "d1");
    });

    it("story: 运营维护永久素材，链路可完整调用", async () => {
        const tokenCache = new Map<string, string>();
        const lowLevel = {
            fetchAccessToken: vi.fn().mockResolvedValue({ access_token: "token_mat", expires_in: 7200 }),
            getMaterialCount: vi.fn().mockResolvedValue({ voice_count: 1, video_count: 1, image_count: 9, news_count: 2 }),
            batchGetMaterial: vi.fn().mockResolvedValue({ total_count: 2, item_count: 1, item: [{ media_id: "m1" }] }),
            getMaterial: vi.fn().mockResolvedValue({ media_id: "m1" }),
            deleteMaterial: vi.fn().mockResolvedValue({ errcode: 0, errmsg: "ok" }),
        };

        vi.doMock("../src/wechat.js", () => ({
            createWechatClient: () => lowLevel,
        }));
        vi.doMock("../src/node/tokenStore.js", () => ({
            tokenStore: {
                getToken: vi.fn((appId: string) => tokenCache.get(appId)),
                setToken: vi.fn(async (appId: string, token: string) => {
                    tokenCache.set(appId, token);
                }),
            },
        }));

        const publish = await import("../src/node/publish.js");
        const count = await publish.getWechatMaterialCount();
        const list = await publish.getWechatMaterialList({ type: "image", offset: 0, count: 1 });
        const material = await publish.getWechatMaterial("m1");
        const del = await publish.deleteWechatMaterial("m1");

        expect(count.image_count).toBe(9);
        expect(list.item[0]).toEqual({ media_id: "m1" });
        expect(material).toEqual({ media_id: "m1" });
        expect(del.errcode).toBe(0);
        expect(lowLevel.fetchAccessToken).toHaveBeenCalledTimes(1);
    });

    it("story: 上传临时素材与图文图片，链路可调用并返回结果", async () => {
        const tokenCache = new Map<string, string>();
        const lowLevel = {
            fetchAccessToken: vi.fn().mockResolvedValue({ access_token: "token_tmp", expires_in: 7200 }),
            uploadArticleImage: vi.fn().mockResolvedValue({ url: "https://mmbiz.qpic.cn/article" }),
            uploadTemporaryMaterial: vi.fn().mockResolvedValue({ type: "voice", media_id: "tmp_voice_1", created_at: 1 }),
            getTemporaryMaterial: vi.fn().mockResolvedValue({ video_url: "https://media/get" }),
            getHdVoice: vi.fn().mockResolvedValue({ video_url: "https://media/hdvoice" }),
        };

        vi.doMock("../src/wechat.js", () => ({
            createWechatClient: () => lowLevel,
        }));
        vi.doMock("../src/node/tokenStore.js", () => ({
            tokenStore: {
                getToken: vi.fn((appId: string) => tokenCache.get(appId)),
                setToken: vi.fn(async (appId: string, token: string) => {
                    tokenCache.set(appId, token);
                }),
            },
        }));

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                body: {},
                headers: { get: () => "image/jpeg" },
                arrayBuffer: async () => new ArrayBuffer(4),
            }),
        );

        const publish = await import("../src/node/publish.js");
        const articleImg = await publish.uploadWechatArticleImage("https://cdn.example.com/a.jpg");
        const tmp = await publish.uploadWechatTemporaryMaterial("voice", "https://cdn.example.com/v.amr");
        const tmpGet = await publish.getWechatTemporaryMaterial("tmp_voice_1");
        const hd = await publish.getWechatHdVoice("tmp_voice_1");

        expect(articleImg.url).toContain("https://mmbiz.qpic.cn/");
        expect(tmp.media_id).toBe("tmp_voice_1");
        expect(tmpGet).toEqual({ video_url: "https://media/get" });
        expect(hd).toEqual({ video_url: "https://media/hdvoice" });
        expect(lowLevel.fetchAccessToken).toHaveBeenCalledTimes(1);
    });
});
