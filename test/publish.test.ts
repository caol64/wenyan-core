import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToDraft } from "../src/publish.js";

vi.mock("../src/wechatApi", () => {
    return {
        fetchAccessToken: vi.fn().mockResolvedValue({
            access_token: "mock_token",
        }),
        uploadMaterial: vi.fn().mockResolvedValue({
            media_id: "mock_media_id",
            url: "https://mock.url/image.jpg",
        }),
        publishArticle: vi.fn().mockResolvedValue({
            media_id: "mock_media_id",
        }),
    };
});

describe("publish.ts tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("should publish article successfully", async () => {
        const result = await publishToDraft("自动化测试", "<p>正文</p>", "test/wenyan.jpg");
        expect(result).toHaveProperty("media_id", "mock_media_id");
    });

    it("should throw error when no media_id returned", async () => {
        const { publishArticle } = await import("../src/wechatApi");
        publishArticle.mockResolvedValueOnce({ errcode: 41005, errmsg: "mock error" });

        await expect(
            publishToDraft("失败测试", "<p>正文</p>", "test/wenyan.jpg")
        ).rejects.toThrow(/上传到公众号草稿失败，错误码：41005，mock error/);
    });
});
