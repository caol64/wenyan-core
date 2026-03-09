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
            publishDraft: "https://api.weixin.qq.com/cgi-bin/draft/add",
            uploadMaterial: "https://api.weixin.qq.com/cgi-bin/material/add_material",
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
