import fm from "front-matter";

export interface FrontMatterResult {
    content: string;
    title?: string;
    description?: string;
    cover?: string;
    author?: string;
    source_url?: string;
    pic_crop_235_1?: string;
    pic_crop_1_1?: string;
    need_open_comment?: boolean;
    only_fans_can_comment?: boolean;
    image_list?: string[];
    type?: string;
    digest?: string;
}

export async function handleFrontMatter(markdown: string): Promise<FrontMatterResult> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { attributes, body } = fm(markdown);
    const result: FrontMatterResult = { content: body || "" };
    let head = "";
    const {
        title,
        description,
        cover,
        author,
        source_url,
        pic_crop_235_1,
        pic_crop_1_1,
        need_open_comment,
        only_fans_can_comment,
        image_list,
        type,
        digest,
    } = attributes;
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
    if (pic_crop_235_1) {
        result.pic_crop_235_1 = String(pic_crop_235_1);
    }
    if (pic_crop_1_1) {
        result.pic_crop_1_1 = String(pic_crop_1_1);
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
    if (type) {
        result.type = type;
    }
    if (digest) {
        result.digest = digest;
    }
    if (head) {
        result.content = head + result.content;
    }

    return result;
}
