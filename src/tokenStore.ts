export interface TokenCache {
    appid: string;
    accessToken: string;
    expireAt: number;
}

export const defaultTokenCache: TokenCache = {
    appid: "",
    accessToken: "",
    expireAt: 0,
};

export interface TokenStorageAdapter {
    loadToken(): Promise<TokenCache | null>;
    saveToken(cache: TokenCache): Promise<void>;
    clearToken(): Promise<void>;
}

export class TokenStore {
    private cache: TokenCache = { ...defaultTokenCache };
    private adapter: TokenStorageAdapter;
    private initPromise: Promise<void>;

    constructor(adapter: TokenStorageAdapter) {
        this.adapter = adapter;
        // 在实例化时启动异步加载，并将 Promise 赋给 initPromise 以便其他方法等待
        this.initPromise = this.load();
    }

    private async load(): Promise<void> {
        try {
            const loadedData = await this.adapter.loadToken();
            if (loadedData) {
                this.cache = { ...defaultTokenCache, ...loadedData };
            }
        } catch (error) {
            throw new Error(`无法加载 token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async save(): Promise<void> {
        try {
            await this.adapter.saveToken(this.cache);
        } catch (error) {
            throw new Error(`无法保存 token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async waitForInit(): Promise<void> {
        await this.initPromise;
    }

    public async isValid(appid: string): Promise<boolean> {
        await this.initPromise;
        const currentTime = Math.floor(Date.now() / 1000); // 当前时间（秒）
        const bufferTime = 600; // 10 分钟缓冲，避免过期前瞬间失效
        const isAppidMatch = this.cache.appid === appid;
        // 如果 expireAt < 0，则视为永久有效（isNotExpired 始终为 true）
        // 否则，按照时间戳进行正常校验
        const isNotExpired = this.cache.expireAt < 0 ? true : this.cache.expireAt > currentTime + bufferTime;

        return isAppidMatch && isNotExpired;
    }

    public async getToken(appid: string): Promise<string | null> {
        return (await this.isValid(appid)) ? this.cache.accessToken : null;
    }

    public async setToken(appid: string, accessToken: string, expiresIn: number): Promise<void> {
        await this.initPromise; // 确保加载完成，防止覆盖并发的初始化

        this.cache = {
            appid,
            accessToken,
            // 计算绝对过期时间戳（秒）
            expireAt: Math.floor(Date.now() / 1000) + expiresIn,
        };

        await this.save();
    }

    public async setExternalToken(appid: string, accessToken: string): Promise<void> {
        await this.initPromise;
        this.cache = {
            appid,
            accessToken,
            expireAt: -1, // 标记为外部托管，永不校验过期
        };
        await this.save();
    }

    public async clear(): Promise<void> {
        await this.initPromise;
        this.cache = { ...defaultTokenCache };
        await this.adapter.clearToken();
    }
}
