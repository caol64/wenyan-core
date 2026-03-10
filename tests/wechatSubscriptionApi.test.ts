import { describe, it, expect, vi } from "vitest";
import { createWechatClient, WECHAT_API_ENDPOINTS } from "../src/wechat.js";

describe("wechat subscription api", () => {
    it("supports draft publish full path endpoints", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ errcode: 0, errmsg: "ok", publish_id: "pub_1" }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ publish_id: "pub_1", publish_status: 1 }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ news_item: [{ title: "t" }] }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ errcode: 0, errmsg: "ok" }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ errcode: 0, errmsg: "ok" }),
                text: async () => "",
            });

        const client = createWechatClient({
            fetch,
            createMultipart: vi.fn(),
        } as any);

        const submitResp = await client.submitPublish("token_1", "media_1");
        const statusResp = await client.getPublishStatus("token_1", "pub_1");
        const articleResp = await client.getPublishedArticle("token_1", "article_1");
        const updateResp = await client.updateDraft("token_1", {
            media_id: "media_1",
            index: 0,
            articles: {
                title: "标题",
                content: "<p>正文</p>",
            },
        });
        const deleteResp = await client.deleteDraft("token_1", "media_1");

        expect(submitResp.publish_id).toBe("pub_1");
        expect(statusResp.publish_status).toBe(1);
        expect(articleResp.news_item).toHaveLength(1);
        expect(updateResp.errcode).toBe(0);
        expect(deleteResp.errcode).toBe(0);

        expect(fetch).toHaveBeenNthCalledWith(1, `${WECHAT_API_ENDPOINTS.submitPublish}?access_token=token_1`, {
            method: "POST",
            body: JSON.stringify({ media_id: "media_1" }),
        });
        expect(fetch).toHaveBeenNthCalledWith(2, `${WECHAT_API_ENDPOINTS.getPublishStatus}?access_token=token_1`, {
            method: "POST",
            body: JSON.stringify({ publish_id: "pub_1" }),
        });
        expect(fetch).toHaveBeenNthCalledWith(3, `${WECHAT_API_ENDPOINTS.getPublishedArticle}?access_token=token_1`, {
            method: "POST",
            body: JSON.stringify({ article_id: "article_1" }),
        });
        expect(fetch).toHaveBeenNthCalledWith(4, `${WECHAT_API_ENDPOINTS.updateDraft}?access_token=token_1`, {
            method: "POST",
            body: JSON.stringify({
                media_id: "media_1",
                index: 0,
                articles: {
                    title: "标题",
                    content: "<p>正文</p>",
                },
            }),
        });
        expect(fetch).toHaveBeenNthCalledWith(5, `${WECHAT_API_ENDPOINTS.deleteDraft}?access_token=token_1`, {
            method: "POST",
            body: JSON.stringify({ media_id: "media_1" }),
        });
    });

    it("throws when wechat errcode is not 0", async () => {
        const client = createWechatClient({
            fetch: vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ errcode: 40013, errmsg: "invalid appid" }),
                text: async () => "",
            }),
            createMultipart: vi.fn(),
        } as any);

        await expect(client.submitPublish("token_1", "media_1")).rejects.toThrow("40013: invalid appid");
    });

    it("throws for error responses in publish status and published article APIs", async () => {
        const client = createWechatClient({
            fetch: vi
                .fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ errcode: 40002, errmsg: "invalid argument" }),
                    text: async () => "",
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ errcode: 53600, errmsg: "invalid article id" }),
                    text: async () => "",
                }),
            createMultipart: vi.fn(),
        } as any);

        await expect(client.getPublishStatus("token_1", "pub_1")).rejects.toThrow("40002: invalid argument");
        await expect(client.getPublishedArticle("token_1", "article_1")).rejects.toThrow("53600: invalid article id");
    });

    it("supports material and draft-management endpoints", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                headers: { get: () => "application/json" },
                json: async () => ({ media_id: "m1", name: "n" }),
                blob: async () => new Blob(),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ voice_count: 1, video_count: 2, image_count: 3, news_count: 4 }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ total_count: 1, item_count: 1, item: [{ media_id: "m1" }] }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ url: "https://mmbiz.qpic.cn/test" }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ errcode: 0, errmsg: "ok" }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ type: "image", media_id: "tmp1", created_at: 1 }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                headers: { get: () => "application/json" },
                json: async () => ({ video_url: "https://test/video" }),
                blob: async () => new Blob(),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                headers: { get: () => "application/json" },
                json: async () => ({ video_url: "https://test/hdvoice" }),
                blob: async () => new Blob(),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ errcode: 0, errmsg: "ok", is_open: 1 }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ total_count: 1, item_count: 1, item: [{ media_id: "d1" }] }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ total_count: 1 }),
                text: async () => "",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ news_item: [{ title: "draft" }] }),
                text: async () => "",
            });

        const client = createWechatClient({
            fetch,
            createMultipart: vi.fn().mockReturnValue({ body: "multipart-body", headers: { "x-test": "1" } }),
        } as any);

        const material = await client.getMaterial("token_1", "m1");
        const count = await client.getMaterialCount("token_1");
        const list = await client.batchGetMaterial("token_1", { type: "image", offset: 0, count: 1 });
        const uploadImg = await client.uploadArticleImage("token_1", new Blob(["data"]), "test.jpg");
        const del = await client.deleteMaterial("token_1", "m1");
        const tmp = await client.uploadTemporaryMaterial("token_1", "image", new Blob(["data"]), "tmp.jpg");
        const tempFile = await client.getTemporaryMaterial("token_1", "tmp1");
        const hdVoice = await client.getHdVoice("token_1", "tmp1");
        const sw = await client.draftSwitch("token_1", true);
        const drafts = await client.getDraftList("token_1", { offset: 0, count: 1, no_content: 1 });
        const draftCount = await client.getDraftCount("token_1");
        const draft = await client.getDraft("token_1", "d1");

        expect(material).toEqual({ media_id: "m1", name: "n" });
        expect(count.news_count).toBe(4);
        expect(list.item_count).toBe(1);
        expect(uploadImg.url).toContain("https://mmbiz.qpic.cn/");
        expect(del.errcode).toBe(0);
        expect(tmp.media_id).toBe("tmp1");
        expect(tempFile).toEqual({ video_url: "https://test/video" });
        expect(hdVoice).toEqual({ video_url: "https://test/hdvoice" });
        expect(sw.is_open).toBe(1);
        expect(drafts.item_count).toBe(1);
        expect(draftCount.total_count).toBe(1);
        expect(draft.news_item).toHaveLength(1);

        expect(fetch).toHaveBeenNthCalledWith(1, `${WECHAT_API_ENDPOINTS.getMaterial}?access_token=token_1`, {
            method: "POST",
            body: JSON.stringify({ media_id: "m1" }),
        });
        expect(fetch).toHaveBeenNthCalledWith(
            9,
            `${WECHAT_API_ENDPOINTS.getDraftSwitch}?access_token=token_1&checkonly=1`,
            { method: "POST" },
        );
    });
});
