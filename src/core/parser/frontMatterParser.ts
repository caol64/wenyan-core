import fm from "front-matter";

export interface FrontMatterResult {
    content: string;
    title?: string;
    description?: string;
    cover?: string;
    author?: string;
    source_url?: string;
    need_open_comment?: boolean;
    only_fans_can_comment?: boolean;
    image_list?: string[];
}

/**
 * 从正文中提取图片路径并清理图片引用。
 * 支持标准 Markdown 图片 ![](path) 和 Obsidian 嵌入 ![[file.png|desc]]。
 */
function extractAndCleanImages(body: string): { imagePaths: string[]; cleanedBody: string } {
    const imagePaths: string[] = [];

    // 提取标准 Markdown 图片路径: ![alt](path)
    const mdImageRe = /!\[[^\]]*\]\(([^)]+)\)/g;
    // 提取 Obsidian 嵌入图片: ![[file.png|desc]] 或 ![[file.png]]
    const obsidianImageRe = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

    let match: RegExpExecArray | null;
    while ((match = mdImageRe.exec(body)) !== null) {
        imagePaths.push(match[1]);
    }
    while ((match = obsidianImageRe.exec(body)) !== null) {
        imagePaths.push(match[1].trim());
    }

    const cleanedBody = body
        .replace(/!\[[^\]]*\]\([^)]+\)\s*/g, "")
        .replace(/!\[\[[^\]]+\]\]\s*/g, "");

    return { imagePaths, cleanedBody };
}

export async function handleFrontMatter(markdown: string): Promise<FrontMatterResult> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { attributes, body } = fm(markdown);
    const result: FrontMatterResult = { content: body || "" };
    let head = "";
    const { title, description, cover, author, source_url, need_open_comment, only_fans_can_comment, image_list, type } = attributes;
    if (title) {
        result.title = title;
    }
    if (description) {
        head += "> " + description + "\n\n";
        result.description = description;
    }
    if (cover) {
        result.cover = cover;
    }
    if (author) {
        result.author = author;
    }
    if (source_url) {
        result.source_url = source_url;
    }
    if (need_open_comment !== undefined) {
        result.need_open_comment = need_open_comment;
    }
    if (only_fans_can_comment !== undefined) {
        result.only_fans_can_comment = only_fans_can_comment;
    }
    if (image_list) {
        result.image_list = image_list;
    }
    if (head) {
        result.content = head + result.content;
    }

    // type: image 小绿书模式：自动从正文提取图片注入 image_list，并清理正文中的图片引用
    if (type === "image" && !image_list) {
        const { imagePaths, cleanedBody } = extractAndCleanImages(result.content);
        if (imagePaths.length > 0) {
            result.image_list = imagePaths;
            result.content = cleanedBody;
        }
    }

    return result;
}
