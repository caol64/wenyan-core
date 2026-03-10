import { describe, it, expect, vi, afterEach } from "vitest";
import { createWechatClient, WECHAT_API_ENDPOINTS } from "../src/wechat.js";
import { CLIENT_PUBLISH_API_ENDPOINTS, healthCheck, verifyAuth } from "../src/node/clientPublish.js";

describe("API endpoint visibility", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("exposes WeChat API endpoint constants and uses them in client requests", async () => {
        const adapter = {
            fetch: vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ access_token: "token", expires_in: 7200 }),
                text: async () => "",
            }),
            createMultipart: vi.fn(),
        };

        const wechatClient = createWechatClient(adapter as any);
        await wechatClient.fetchAccessToken("app-id", "app-secret");

        expect(WECHAT_API_ENDPOINTS).toEqual({
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
        });
        expect(adapter.fetch).toHaveBeenCalledWith(
            `${WECHAT_API_ENDPOINTS.token}?grant_type=client_credential&appid=app-id&secret=app-secret`,
        );
    });

    it("exposes client publish API endpoints and uses them in checks", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                json: async () => ({ status: "ok", service: "wenyan-cli", version: "1.0.0" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
            });

        vi.stubGlobal("fetch", fetchMock);

        await healthCheck("http://localhost:3000");
        await verifyAuth("http://localhost:3000", { "x-api-key": "k" });

        expect(CLIENT_PUBLISH_API_ENDPOINTS).toEqual({
            health: "/health",
            verify: "/verify",
            upload: "/upload",
            publish: "/publish",
        });
        expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:3000/health", { method: "GET" });
        expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:3000/verify", {
            method: "GET",
            headers: { "x-api-key": "k" },
        });
    });
});
