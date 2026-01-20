import fm from "front-matter";

export interface FrontMatterResult {
    body: string;
    title?: string;
    description?: string;
    cover?: string;
}

export async function handleFrontMatter(markdown: string): Promise<FrontMatterResult> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { attributes, body } = fm(markdown);
    const result: FrontMatterResult = { body: body || "" };
    let head = "";
    const { title, description, cover } = attributes;
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
    return result;
}
