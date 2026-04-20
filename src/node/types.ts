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
    need_open_comment?: 0 | 1;
    only_fans_can_comment?: 0 | 1;
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
