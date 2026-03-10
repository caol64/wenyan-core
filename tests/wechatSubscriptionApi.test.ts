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
});
