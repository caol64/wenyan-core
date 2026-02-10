import fm from "front-matter";

export interface FrontMatterResult {
    body: string;
    title?: string;
    cover?: string;
    description?: string;
    author?: string;
    source_url?: string;
}

export async function handleFrontMatter(markdown: string): Promise<FrontMatterResult> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { attributes, body } = fm(markdown);
    const result: FrontMatterResult = { body: body || "" };
    let head = "";
    const { title, description, cover, author, source_url } = attributes;
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
    if (head) {
        result.body = head + result.body;
    }
    if (author) {
        result.author = author;
    }
    if (source_url) {
        result.source_url = source_url;
    }
    return result;
}
