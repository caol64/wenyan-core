import { JSDOM } from "jsdom";

import {
    handleFrontMatter,
    configureMarked,
    renderMarkdown,
    getContentForGzhBuiltinTheme,
} from "./main.js";


export type GzhContent = {
    title: string;
    cover: string;
    content: string;
    description: string;
};


export async function getGzhContent(content: string, themeId: string, hlThemeId: string, isMacStyle: boolean): Promise<GzhContent> {
    configureMarked();
    const preHandlerContent = handleFrontMatter(content);
    const html = await renderMarkdown(preHandlerContent.body);
    const dom = new JSDOM(`<body><section id="wenyan">${html}</section></body>`);
    const document = dom.window.document;
    const wenyan = document.getElementById("wenyan");
    const result = await getContentForGzhBuiltinTheme(wenyan, themeId, hlThemeId, isMacStyle);
    return {
        title: preHandlerContent.title,
        cover: preHandlerContent.cover,
        content: result,
        description: preHandlerContent.description,
    }
}
