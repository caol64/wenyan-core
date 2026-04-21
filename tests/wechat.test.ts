import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HttpAdapter, MultipartBody } from "../src/http.js";
import { createWechatClient } from "../src/wechat.js";

describe("wechat.ts tests", () => {
    let fetch: ReturnType<typeof vi.fn>;
    let createMultipart: ReturnType<typeof vi.fn>;
    let httpAdapter: HttpAdapter;

    beforeEach(() => {
        fetch = vi.fn();
        createMultipart = vi.fn();
        httpAdapter = {
            fetch,
            createMultipart,
        };
    });

    it("should request access token with expected query params", async () => {
        fetch.mockResolvedValue(
            new Response(JSON.stringify({
                access_token: "mock-access-token",
                expires_in: 7200,
            })),
        );

        const client = createWechatClient(httpAdapter);
        const result = await client.fetchAccessToken("mock-app-id", "mock-app-secret");

        expect(fetch).toHaveBeenCalledWith(
            "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=mock-app-id&secret=mock-app-secret",
        );
        expect(result).toEqual({
            access_token: "mock-access-token",
            expires_in: 7200,
        });
    });

    it("should throw when token response contains wechat error payload", async () => {
        fetch.mockResolvedValue(
            new Response(JSON.stringify({
                errcode: 40013,
                errmsg: "invalid appid",
            })),
        );

        const client = createWechatClient(httpAdapter);

        await expect(client.fetchAccessToken("bad-app-id", "bad-app-secret")).rejects.toThrow(
            "40013: invalid appid",
        );
    });

    it("should upload material with multipart request and normalize returned url", async () => {
        const file = new Blob(["mock image content"], { type: "image/png" });
        const multipart: MultipartBody = {
            body: "mock-multipart-body" as BodyInit,
            headers: {
                "content-type": "multipart/form-data; boundary=mock-boundary",
            },
        };

        createMultipart.mockReturnValue(multipart);
        fetch.mockResolvedValue(
            new Response(JSON.stringify({
                media_id: "mock-media-id",
                url: "http://mmbiz.qpic.cn/mock-image.png",
            })),
        );

        const client = createWechatClient(httpAdapter);
        const result = await client.uploadMaterial("image", file, "cover.png", "mock-access-token");

        expect(createMultipart).toHaveBeenCalledWith("media", file, "cover.png");
        expect(fetch).toHaveBeenCalledWith(
            "https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=mock-access-token&type=image",
            {
                ...multipart,
                method: "POST",
            },
        );
        expect(result).toEqual({
            media_id: "mock-media-id",
            url: "https://mmbiz.qpic.cn/mock-image.png",
        });
    });

    it("should throw response text when upload request fails", async () => {
        createMultipart.mockReturnValue({
            body: "mock-multipart-body" as BodyInit,
        });
        fetch.mockResolvedValue(new Response("upload failed", { status: 500 }));

        const client = createWechatClient(httpAdapter);

        await expect(
            client.uploadMaterial(
                "image",
                new Blob(["mock image content"], { type: "image/png" }),
                "cover.png",
                "mock-access-token",
            ),
        ).rejects.toThrow("upload failed");
    });

    it("should publish article with expected request body and return media id", async () => {
        fetch.mockResolvedValue(
            new Response(JSON.stringify({
                media_id: "mock-draft-media-id",
            })),
        );

        const client = createWechatClient(httpAdapter);
        const options = {
            title: "测试标题",
            author: "测试作者",
            content: "<p>正文</p>",
            thumb_media_id: "mock-thumb-media-id",
            content_source_url: "https://example.com/post",
            article_type: "news" as const,
            image_info: [
                {
                    image_media_id: "mock-image-media-id",
                },
            ],
            need_open_comment: 1 as const,
            only_fans_can_comment: 0 as const,
        };

        const result = await client.publishArticle("mock-access-token", options);

        expect(fetch).toHaveBeenCalledWith(
            "https://api.weixin.qq.com/cgi-bin/draft/add?access_token=mock-access-token",
            {
                method: "POST",
                body: JSON.stringify({
                    articles: [options],
                }),
            },
        );
        expect(result).toEqual({
            media_id: "mock-draft-media-id",
        });
    });
});
