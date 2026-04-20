import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import http from "node:http";
import https from "node:https";
import {
    getServerUrl,
    getHeaders,
    healthCheck,
    verifyAuth,
    requestServerPublish,
    uploadStyledContent,
    uploadLocalImages,
    uploadCover,
} from "../../src/node/clientPublish.js";
import type { ClientPublishOptions, StyledContent } from "../../src/node/types.js";

describe("clientPublish.ts tests", () => {
    describe("getServerUrl", () => {
        it("should return default server url when not provided", () => {
            const options: ClientPublishOptions = {};
            const url = getServerUrl(options);
            expect(url).toBe("http://localhost:3000");
        });

        it("should return custom server url", () => {
            const options: ClientPublishOptions = { server: "https://my-server.com" };
            const url = getServerUrl(options);
            expect(url).toBe("https://my-server.com");
        });

        it("should remove trailing slash from server url", () => {
            const options: ClientPublishOptions = { server: "https://my-server.com/" };
            const url = getServerUrl(options);
            expect(url).toBe("https://my-server.com");
        });

        it("should handle multiple trailing slashes", () => {
            const options: ClientPublishOptions = { server: "https://my-server.com///" };
            const url = getServerUrl(options);
            expect(url).toBe("https://my-server.com//");
        });
    });

    describe("getHeaders", () => {
        it("should return empty headers when no options provided", () => {
            const options: ClientPublishOptions = {};
            const headers = getHeaders(options);
            expect(headers).toEqual({});
        });

        it("should include client version when provided", () => {
            const options: ClientPublishOptions = { clientVersion: "1.0.0" };
            const headers = getHeaders(options);
            expect(headers).toHaveProperty("x-client-version", "1.0.0");
        });

        it("should include api key when provided", () => {
            const options: ClientPublishOptions = { apiKey: "test-api-key" };
            const headers = getHeaders(options);
            expect(headers).toHaveProperty("x-api-key", "test-api-key");
        });

        it("should include both headers when both provided", () => {
            const options: ClientPublishOptions = {
                clientVersion: "2.0.0",
                apiKey: "secret-key",
            };
            const headers = getHeaders(options);
            expect(headers).toHaveProperty("x-client-version", "2.0.0");
            expect(headers).toHaveProperty("x-api-key", "secret-key");
        });
    });

    describe("healthCheck", () => {
        it("should return version on successful health check", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ status: "ok", service: "wenyan-cli", version: "1.2.3" }),
            });
            global.fetch = mockFetch;

            const version = await healthCheck("http://localhost:3000");
            expect(version).toBe("1.2.3");
        });

        it("should throw error when health check fails", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: "Server Error",
            });
            global.fetch = mockFetch;

            await expect(healthCheck("http://localhost:3000")).rejects.toThrow(/Failed to connect to server/);
        });

        it("should throw error when response is invalid", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ status: "error", service: "other-service" }),
            });
            global.fetch = mockFetch;

            await expect(healthCheck("http://localhost:3000")).rejects.toThrow(/Invalid server response/);
        });
    });

    describe("verifyAuth", () => {
        it("should succeed when auth is valid", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
            });
            global.fetch = mockFetch;

            await expect(
                verifyAuth("http://localhost:3000", { "x-api-key": "valid-key" }),
            ).resolves.not.toThrow();
        });

        it("should throw 401 error when auth fails", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                statusText: "Unauthorized",
            });
            global.fetch = mockFetch;

            await expect(
                verifyAuth("http://localhost:3000", { "x-api-key": "invalid-key" }),
            ).rejects.toThrow(/鉴权失败 \(401\)/);
        });

        it("should throw error for other HTTP errors", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: "Server Error",
            });
            global.fetch = mockFetch;

            await expect(
                verifyAuth("http://localhost:3000", { "x-api-key": "key" }),
            ).rejects.toThrow(/Verify Error/);
        });
    });

    describe("uploadStyledContent", () => {
        it("should upload styled content and return file id", async () => {
            const mockReq = {
                on: vi.fn(),
                write: vi.fn().mockReturnValue(true),
                end: vi.fn(),
            };

            const mockHttpRequest = vi.spyOn(http, "request").mockImplementation((options, callback) => {
                // Simulate response
                const mockRes = {
                    statusCode: 200,
                    on: vi.fn((event, handler) => {
                        if (event === "data") {
                            handler(Buffer.from(JSON.stringify({ success: true, data: { fileId: "file-123" } })));
                        } else if (event === "end") {
                            handler();
                        }
                    }),
                };
                if (callback) callback(mockRes as any);
                return mockReq as any;
            });

            const gzhContent: StyledContent = {
                content: "<p>Test content</p>",
                title: "Test Title",
            };

            const fileId = await uploadStyledContent(gzhContent, "http://localhost:3000", {});
            expect(fileId).toBe("file-123");

            mockHttpRequest.mockRestore();
        });

        it("should throw error when upload fails", async () => {
            const mockReq = {
                on: vi.fn(),
                write: vi.fn().mockReturnValue(true),
                end: vi.fn(),
            };

            const mockHttpRequest = vi.spyOn(http, "request").mockImplementation((options, callback) => {
                const mockRes = {
                    statusCode: 200,
                    on: vi.fn((event, handler) => {
                        if (event === "data") {
                            handler(Buffer.from(JSON.stringify({ success: false, error: "Upload failed" })));
                        } else if (event === "end") {
                            handler();
                        }
                    }),
                };
                if (callback) callback(mockRes as any);
                return mockReq as any;
            });

            const gzhContent: StyledContent = {
                content: "<p>Test</p>",
            };

            await expect(uploadStyledContent(gzhContent, "http://localhost:3000", {})).rejects.toThrow(
                /Upload Document Failed/,
            );

            mockHttpRequest.mockRestore();
        });
    });

    describe("requestServerPublish", () => {
        it("should include comment options in publish request body", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ media_id: "remote-media-id" }),
            });
            global.fetch = mockFetch;

            const mediaId = await requestServerPublish("file-123", "http://localhost:3000", { "x-api-key": "test-key" }, {
                theme: "default",
                highlight: "solarized-light",
                macStyle: true,
                footnote: true,
                need_open_comment: 1,
                only_fans_can_comment: 1,
            } as any);

            expect(mediaId).toBe("remote-media-id");
            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:3000/publish",
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "x-api-key": "test-key",
                        "Content-Type": "application/json",
                    }),
                    body: expect.any(String),
                }),
            );

            const requestInit = mockFetch.mock.calls[0][1];
            expect(JSON.parse(String(requestInit.body))).toMatchObject({
                fileId: "file-123",
                need_open_comment: 1,
                only_fans_can_comment: 1,
            });
        });
    });

    describe("uploadLocalImages", () => {
        it("should return content unchanged when no images present", async () => {
            const content = "<p>No images here</p>";
            const result = await uploadLocalImages(content, "http://localhost:3000", {});
            expect(result).toBe(content);
        });

        it("should skip images with absolute URLs", async () => {
            const content = '<img src="https://example.com/image.jpg">';
            const result = await uploadLocalImages(content, "http://localhost:3000", {});
            expect(result).toContain('src="https://example.com/image.jpg"');
        });

        it("should skip data URIs", async () => {
            const content = '<img src="data:image/png;base64,abc123">';
            const result = await uploadLocalImages(content, "http://localhost:3000", {});
            expect(result).toContain('src="data:image/png;base64,abc123"');
        });

        it("should skip asset:// URLs", async () => {
            const content = '<img src="asset://already-uploaded">';
            const result = await uploadLocalImages(content, "http://localhost:3000", {});
            expect(result).toContain('src="asset://already-uploaded"');
        });
    });

    describe("uploadCover", () => {
        it("should return undefined when cover is not provided", async () => {
            const result = await uploadCover("http://localhost:3000", {});
            expect(result).toBeUndefined();
        });

        it("should return cover unchanged when it is an absolute URL", async () => {
            const cover = "https://example.com/cover.jpg";
            const result = await uploadCover("http://localhost:3000", {}, cover);
            expect(result).toBe(cover);
        });

        it("should return cover unchanged when it is a data URI", async () => {
            const cover = "data:image/png;base64,cover123";
            const result = await uploadCover("http://localhost:3000", {}, cover);
            expect(result).toBe(cover);
        });

        it("should return cover unchanged when it is an asset:// URL", async () => {
            const cover = "asset://cover-uploaded";
            const result = await uploadCover("http://localhost:3000", {}, cover);
            expect(result).toBe(cover);
        });
    });
});
