import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenStore, type TokenCache, type TokenStorageAdapter } from "../src/tokenStore.js";

function createDeferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("tokenStore.ts tests", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-27T00:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("should load persisted token and return it when still valid", async () => {
        const adapter: TokenStorageAdapter = {
            loadToken: vi.fn().mockResolvedValue({
                appid: "wx-app",
                accessToken: "cached-token",
                expireAt: Math.floor(Date.now() / 1000) + 3600,
            } satisfies TokenCache),
            saveToken: vi.fn().mockResolvedValue(undefined),
            clearToken: vi.fn().mockResolvedValue(undefined),
        };

        const store = new TokenStore(adapter);
        await store.waitForInit();

        expect(await store.isValid("wx-app")).toBe(true);
        expect(await store.getToken("wx-app")).toBe("cached-token");
        expect(await store.getToken("other-app")).toBeNull();
    });

    it("should treat tokens in the buffer window as expired", async () => {
        const adapter: TokenStorageAdapter = {
            loadToken: vi.fn().mockResolvedValue({
                appid: "wx-app",
                accessToken: "almost-expired",
                expireAt: Math.floor(Date.now() / 1000) + 600,
            } satisfies TokenCache),
            saveToken: vi.fn().mockResolvedValue(undefined),
            clearToken: vi.fn().mockResolvedValue(undefined),
        };

        const store = new TokenStore(adapter);
        await store.waitForInit();

        expect(await store.isValid("wx-app")).toBe(false);
        expect(await store.getToken("wx-app")).toBeNull();
    });

    it("should wait for initialization before saving a new token", async () => {
        const deferred = createDeferred<TokenCache | null>();
        const adapter: TokenStorageAdapter = {
            loadToken: vi.fn().mockReturnValue(deferred.promise),
            saveToken: vi.fn().mockResolvedValue(undefined),
            clearToken: vi.fn().mockResolvedValue(undefined),
        };

        const store = new TokenStore(adapter);
        const setPromise = store.setToken("wx-app", "fresh-token", 7200);

        expect(adapter.saveToken).not.toHaveBeenCalled();

        deferred.resolve(null);
        await setPromise;

        expect(adapter.saveToken).toHaveBeenCalledWith({
            appid: "wx-app",
            accessToken: "fresh-token",
            expireAt: Math.floor(Date.now() / 1000) + 7200,
        });
        expect(await store.getToken("wx-app")).toBe("fresh-token");
    });

    it("should persist external tokens as non-expiring", async () => {
        const adapter: TokenStorageAdapter = {
            loadToken: vi.fn().mockResolvedValue(null),
            saveToken: vi.fn().mockResolvedValue(undefined),
            clearToken: vi.fn().mockResolvedValue(undefined),
        };

        const store = new TokenStore(adapter);
        await store.setExternalToken("wx-app", "external-token");
        vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));

        expect(adapter.saveToken).toHaveBeenCalledWith({
            appid: "wx-app",
            accessToken: "external-token",
            expireAt: -1,
        });
        expect(await store.isValid("wx-app")).toBe(true);
        expect(await store.getToken("wx-app")).toBe("external-token");
    });

    it("should clear token cache and adapter state", async () => {
        const adapter: TokenStorageAdapter = {
            loadToken: vi.fn().mockResolvedValue({
                appid: "wx-app",
                accessToken: "cached-token",
                expireAt: Math.floor(Date.now() / 1000) + 3600,
            } satisfies TokenCache),
            saveToken: vi.fn().mockResolvedValue(undefined),
            clearToken: vi.fn().mockResolvedValue(undefined),
        };

        const store = new TokenStore(adapter);
        await store.clear();

        expect(adapter.clearToken).toHaveBeenCalledTimes(1);
        expect(await store.getToken("wx-app")).toBeNull();
    });

    it("should surface load and save adapter failures", async () => {
        const loadStore = new TokenStore({
            loadToken: vi.fn().mockRejectedValue(new Error("disk broken")),
            saveToken: vi.fn().mockResolvedValue(undefined),
            clearToken: vi.fn().mockResolvedValue(undefined),
        });

        await expect(loadStore.waitForInit()).rejects.toThrow("无法加载 token: disk broken");

        const saveStore = new TokenStore({
            loadToken: vi.fn().mockResolvedValue(null),
            saveToken: vi.fn().mockRejectedValue(new Error("readonly")),
            clearToken: vi.fn().mockResolvedValue(undefined),
        });

        await expect(saveStore.setToken("wx-app", "fresh-token", 3600)).rejects.toThrow("无法保存 token: readonly");
    });
});
