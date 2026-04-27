import { describe, expect, it, vi } from "vitest";
import { CredentialStore, type CredentialStorageAdapter, type WenyanCredential } from "../src/credentialStore.js";

describe("credentialStore.ts tests", () => {
    it("should resolve a credential by exact appId before alias lookup", async () => {
        const adapter: CredentialStorageAdapter = {
            loadCredential: vi.fn().mockResolvedValue({
                wechat: {
                    "wx-app": {
                        appSecret: "secret-by-appid",
                        alias: "shared-alias",
                    },
                    "wx-other": {
                        appSecret: "secret-by-alias",
                        alias: "wx-app",
                    },
                },
            } satisfies WenyanCredential),
            saveCredential: vi.fn().mockResolvedValue(undefined),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        };

        const store = new CredentialStore(adapter);

        await expect(store.getWechatCredential("wx-app")).resolves.toEqual({
            appId: "wx-app",
            appSecret: "secret-by-appid",
            alias: "shared-alias",
        });
    });

    it("should resolve a credential by alias", async () => {
        const adapter: CredentialStorageAdapter = {
            loadCredential: vi.fn().mockResolvedValue({
                wechat: {
                    "wx-app": {
                        appSecret: "secret-1",
                        alias: "main-account",
                    },
                },
            } satisfies WenyanCredential),
            saveCredential: vi.fn().mockResolvedValue(undefined),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        };

        const store = new CredentialStore(adapter);

        await expect(store.getWechatCredential("main-account")).resolves.toEqual({
            appId: "wx-app",
            appSecret: "secret-1",
            alias: "main-account",
        });
    });

    it("should save credentials without alias when alias is omitted", async () => {
        const adapter: CredentialStorageAdapter = {
            loadCredential: vi.fn().mockResolvedValue(null),
            saveCredential: vi.fn().mockResolvedValue(undefined),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        };

        const store = new CredentialStore(adapter);

        await store.saveWechatCredential("wx-app", "secret-1");

        expect(adapter.saveCredential).toHaveBeenCalledWith({
            wechat: {
                "wx-app": {
                    appSecret: "secret-1",
                },
            },
        });
    });

    it("should omit empty aliases when saving credentials", async () => {
        const adapter: CredentialStorageAdapter = {
            loadCredential: vi.fn().mockResolvedValue(null),
            saveCredential: vi.fn().mockResolvedValue(undefined),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        };

        const store = new CredentialStore(adapter);

        await store.saveWechatCredential("wx-other", "secret-2", null);

        expect(adapter.saveCredential).toHaveBeenCalledWith({
            wechat: {
                "wx-other": {
                    appSecret: "secret-2",
                },
            },
        });
    });

    it("should delete credentials by alias", async () => {
        const adapter: CredentialStorageAdapter = {
            loadCredential: vi.fn().mockResolvedValue({
                wechat: {
                    "wx-app": {
                        appSecret: "secret-1",
                        alias: "main-account",
                    },
                    "wx-other": {
                        appSecret: "secret-2",
                    },
                },
            } satisfies WenyanCredential),
            saveCredential: vi.fn().mockResolvedValue(undefined),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        };

        const store = new CredentialStore(adapter);

        await store.deleteWechatCredential("main-account");

        expect(adapter.saveCredential).toHaveBeenCalledWith({
            wechat: {
                "wx-other": {
                    appSecret: "secret-2",
                },
            },
        });
        await expect(store.getWechatCredential("wx-app")).resolves.toBeNull();
    });

    it("should not save when deleting a missing credential", async () => {
        const adapter: CredentialStorageAdapter = {
            loadCredential: vi.fn().mockResolvedValue({
                wechat: {
                    "wx-app": {
                        appSecret: "secret-1",
                    },
                },
            } satisfies WenyanCredential),
            saveCredential: vi.fn().mockResolvedValue(undefined),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        };

        const store = new CredentialStore(adapter);
        await store.deleteWechatCredential("missing-alias");

        expect(adapter.saveCredential).not.toHaveBeenCalled();
    });

    it("should surface load and save adapter failures", async () => {
        const loadStore = new CredentialStore({
            loadCredential: vi.fn().mockRejectedValue(new Error("disk broken")),
            saveCredential: vi.fn().mockResolvedValue(undefined),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        });

        await expect(loadStore.getWechatCredential("wx-app")).rejects.toThrow("无法加载凭据: disk broken");

        const saveStore = new CredentialStore({
            loadCredential: vi.fn().mockResolvedValue(null),
            saveCredential: vi.fn().mockRejectedValue(new Error("readonly")),
            clearCredential: vi.fn().mockResolvedValue(undefined),
        });

        await expect(saveStore.saveWechatCredential("wx-app", "secret-1", "main-account")).rejects.toThrow(
            "无法保存凭据: readonly",
        );
    });
});
