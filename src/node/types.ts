export interface RenderOptions {
    file?: string;
    theme?: string;
    customTheme?: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export interface PublishOptions extends RenderOptions {
    appId?: string;
    /**
     * 代理服务器地址（可选）
     * 支持格式:
     * - http://127.0.0.1:7890
     * - https://127.0.0.1:7890
     * - socks5://127.0.0.1:1080
     * - socks4://127.0.0.1:1080
     */
    proxy?: string;
}

export interface ClientPublishOptions extends PublishOptions {
    server?: string;
    apiKey?: string;
    clientVersion?: string;
}

export interface RenderContext {
    gzhContent: StyledContent;
    absoluteDirPath: string | undefined;
}

export interface StyledContent {
    content: string;
    title?: string;
    cover?: string;
    description?: string;
    author?: string;
    source_url?: string;
}

export type GetInputContentFn = (
    inputContent?: string,
    filePath?: string,
) => Promise<{
    content: string;
    absoluteDirPath?: string;
}>;
