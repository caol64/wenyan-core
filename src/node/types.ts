export interface RenderOptions {
    file?: string;
    theme?: string;
    customTheme?: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export interface PublishOptions extends RenderOptions {}

export interface ClientPublishOptions extends RenderOptions {
    server?: string;
    apiKey?: string;
    appId?: string;
    appSecret?: string;
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
