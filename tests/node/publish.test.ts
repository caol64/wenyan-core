import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 使用 vi.hoisted 确保 mock 对象在 vi.mock 提升时已定义
const { mockWechatClient } = vi.hoisted(() => {
    return {
        mockWechatClient: {
            fetchAccessToken: vi.fn(),
            uploadMaterial: vi.fn(),
            publishArticle: vi.fn(),
        }
    };
});

vi.mock("../../src/wechat.js", () => {
    return {
        createWechatClient: vi.fn(() => mockWechatClient),
    };
});

// Mock cache to ensure we always call the actual upload during tests
vi.mock("../../src/node/uploadCacheNodeAdapter.js", () => {
    return {
        NodeUploadCacheAdapter: vi.fn().mockImplementation(() => {
            return {
                loadCache: vi.fn().mockResolvedValue({}),
                saveCache: vi.fn().mockResolvedValue(undefined),
                clearCache: vi.fn().mockResolvedValue(undefined),
                calcHash: vi.fn().mockImplementation(async (buffer: ArrayBuffer) => {
                    // Simple hash for testing - using a random value to avoid any collision between tests
                    return Math.random().toString(36).substring(7);
                })
            };
        })
    };
});

// Mock TokenStorage to avoid reading/writing to disk
vi.mock("../../src/node/tokenStoreNodeAdapter.js", () => {
    return {
        NodeTokenStorageAdapter: vi.fn().mockImplementation(() => {
            return {
                loadToken: vi.fn().mockResolvedValue(null),
                saveToken: vi.fn().mockResolvedValue(undefined),
                clearToken: vi.fn().mockResolvedValue(undefined)
            };
        })
    };
});

// 在 mock 之后导入
import { publishToDraft, wechatPublisher } from "../../src/node/publish.js";

describe("publish.ts tests", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Clear wechatPublisher cache between tests
        await wechatPublisher.clearCache();
        
        process.env.WECHAT_APP_ID = "mock_app_id";
        process.env.WECHAT_APP_SECRET = "mock_app_secret";

        mockWechatClient.fetchAccessToken.mockResolvedValue({
            access_token: "mock_token",
            expires_in: 7200,
        });
        mockWechatClient.uploadMaterial.mockResolvedValue({
            media_id: "mock_media_id",
            url: "https://mock.url/image.jpg",
        });
        mockWechatClient.publishArticle.mockResolvedValue({
            media_id: "mock_article_media_id",
        });

        // Mock global fetch for remote image tests
        const mockFetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes("example.com")) {
                return Promise.resolve({
                    ok: true,
                    body: {}, 
                    arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
                    headers: {
                        get: (name: string) => name === "content-type" ? "image/png" : null
                    }
                });
            }
            return Promise.reject(new Error("Not found"));
        });
        global.fetch = mockFetch;
    });

    it("should publish article successfully", async () => {
        const imgPath = path.join(__dirname, "../wenyan.jpg");
        const result = await publishToDraft("自动化测试", "<p>正文</p>", imgPath);
        expect(result).toHaveProperty("media_id", "mock_article_media_id");
        expect(mockWechatClient.fetchAccessToken).toHaveBeenCalled();
        expect(mockWechatClient.uploadMaterial).toHaveBeenCalled();
        expect(mockWechatClient.publishArticle).toHaveBeenCalled();
    });

    it("should throw error when publishArticle fails", async () => {
        mockWechatClient.publishArticle.mockRejectedValueOnce(new Error("41005: mock error"));

        const imgPath = path.join(__dirname, "../wenyan.jpg");
        await expect(
            publishToDraft("失败测试", "<p>正文</p>", imgPath)
        ).rejects.toThrow(/41005: mock error/);
    });

    it("should use first image in content if cover is not provided", async () => {
        const imgPath = path.join(__dirname, "../wenyan.jpg");
        const content = `<p>正文</p><img src="${imgPath}">`;
        const result = await publishToDraft("无封面测试", content);

        expect(result).toHaveProperty("media_id", "mock_article_media_id");
        expect(mockWechatClient.uploadMaterial).toHaveBeenCalled();
    });

    it("should handle remote images in content", async () => {
        const content = `<p>正文</p><img src="https://example.com/test.png">`;
        const result = await publishToDraft("远程图片测试", content, path.join(__dirname, "../wenyan.jpg"));

        expect(result).toHaveProperty("media_id", "mock_article_media_id");
        // Should upload both remote image and cover
        expect(mockWechatClient.uploadMaterial).toHaveBeenCalledTimes(2);
    });

    it("should throw error if no images provided and no cover", async () => {
        await expect(
            publishToDraft("无图测试", "<p>只有文字</p>")
        ).rejects.toThrow("你必须指定一张封面图或者在正文中至少出现一张图片。");
    });
});
