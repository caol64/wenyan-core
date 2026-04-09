export interface WenyanCredential {
    wechat?: Record<string, string>;
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
    }

    private async load() {
        try {
            const loadedData = await this.adapter.loadCredential();
            if (loadedData) {
                this.credential = loadedData;
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

    private async _getWechatCredential(): Promise<Record<string, string>> {
        await this.initPromise;
        return this.credential.wechat ?? {};
    }

    async getWechatCredential(appId: string): Promise<{ appId: string; appSecret: string } | null> {
        const wechat = await this._getWechatCredential();
        if (!wechat) return null;
        const appSecret = wechat[appId];
        if (!appSecret) return null;
        return { appId, appSecret };
    }

    async saveWechatCredential(appId: string, appSecret: string): Promise<void> {
        await this.initPromise;
        this.credential.wechat ??= {};
        this.credential.wechat[appId] = appSecret;
        await this.save();
    }

    async deleteWechatCredential(appId: string): Promise<void> {
        await this.initPromise;
        if (this.credential.wechat) {
            delete this.credential.wechat[appId];
            await this.save();
        }
    }
}
