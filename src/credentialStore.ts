export interface WechatCredentialItem {
    appSecret: string;
    alias?: string;
}

export interface WenyanCredential {
    wechat?: Record<string, WechatCredentialItem>;
}

export const defaultCredential: WenyanCredential = {};

export interface CredentialStorageAdapter {
    loadCredential(): Promise<WenyanCredential | null>;
    saveCredential(credential: WenyanCredential): Promise<void>;
    clearCredential(): Promise<void>;
}

export class CredentialStore {
    private credential: WenyanCredential = { ...defaultCredential };
    private adapter: CredentialStorageAdapter;
    private initPromise: Promise<void>;

    constructor(adapter: CredentialStorageAdapter) {
        this.adapter = adapter;
        this.initPromise = this.load();
        this.initPromise.catch(() => {});
    }

    private async load() {
        try {
            const loadedData = await this.adapter.loadCredential();
            if (loadedData) {
                this.credential = { ...defaultCredential, ...loadedData };
            }
        } catch (error) {
            throw new Error(`无法加载凭据: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async save() {
        try {
            await this.adapter.saveCredential(this.credential);
        } catch (error) {
            throw new Error(`无法保存凭据: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 获取微信凭据 (通过 appId 或 alias)
     */
    async getWechatCredential(appIdOrAlias: string): Promise<{ appId: string; appSecret: string; alias?: string } | null> {
        await this.initPromise;
        const wechat = this.credential.wechat ?? {};

        // 1. 优先作为 appId 精确查找
        if (wechat[appIdOrAlias]) {
            return {
                appId: appIdOrAlias,
                ...wechat[appIdOrAlias]
            };
        }

        // 2. 作为 alias 遍历查找
        const entry = Object.entries(wechat).find(([_, item]) => item.alias === appIdOrAlias);
        if (entry) {
            return {
                appId: entry[0],
                ...entry[1]
            };
        }

        return null;
    }

    /**
     * 保存或更新微信凭据
     */
    async saveWechatCredential(appId: string, appSecret: string, alias?: string | null): Promise<void> {
        await this.initPromise;
        this.credential.wechat ??= {};

        // 组装对象数据
        const item: WechatCredentialItem = { appSecret };
        if (alias) {
            item.alias = alias;
        }

        // 直接按 appId 赋值（如果存在旧的 appId，直接原地覆盖）
        this.credential.wechat[appId] = item;

        await this.save();
    }

    /**
     * 删除微信凭据 (通过 appId 或 alias)
     */
    async deleteWechatCredential(appIdOrAlias: string): Promise<void> {
        // 复用 getWechatCredential 找到真实的 appId
        const target = await this.getWechatCredential(appIdOrAlias);

        if (target && this.credential.wechat) {
            delete this.credential.wechat[target.appId];
            await this.save();
        }
    }
}
