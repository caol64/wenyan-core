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
    need_open_comment?: boolean;
    only_fans_can_comment?: boolean;
}

export type GetInputContentFn = (
    inputContent?: string,
    filePath?: string,
) => Promise<{
    content: string;
    absoluteDirPath?: string;
}>;
