export interface FrontMatterResult {
    title?: string;
    description?: string;
    cover?: string;
    body: string;
}

export function handleFrontMatter(markdown: string): Promise<FrontMatterResult>;
export function configureMarked(): Promise<void>;
export function renderMarkdown(content: string): Promise<string>;
export function getContentForGzhBuiltinTheme(
    wenyanElement: HTMLElement,
    themeId: string,
    hlThemeId: string,
    isMacStyle?: boolean,
    isAddFootnote?: boolean
): Promise<string>;
