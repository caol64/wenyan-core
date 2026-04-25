import { FrontMatterResult } from "../core/parser/frontMatterParser.js";

export interface RenderOptions {
    file?: string;
    theme?: string;
    customTheme?: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
    mermaid?: boolean;
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

export type StyledContent = FrontMatterResult;

export type GetInputContentFn = (
    inputContent?: string,
    filePath?: string,
) => Promise<{
    content: string;
    absoluteDirPath?: string;
}>;
