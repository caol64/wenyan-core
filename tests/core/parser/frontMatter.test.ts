import { describe, it, expect } from "vitest";
import { handleFrontMatter } from "../../../src/core/parser/frontMatterParser";

describe("handleFrontMatter", () => {
    it("should parse all fields and prepend description to body", async () => {
        const markdown = `---
title: My Awesome Post
description: This is a short summary.
cover: https://example.com/image.png
author: author_name
source_url: http://source.com
need_open_comment: true
only_fans_can_comment: true
image_list:
  - wenyan1.jpg
  - wenyan2.jpg
  - wenyan3.jpg
  - wenyan4.jpg
  - wenyan5.jpg
---
# Main Content
Here is the rest of the post.`;

        const result = await handleFrontMatter(markdown);

        expect(result).toEqual({
            title: "My Awesome Post",
            description: "This is a short summary.",
            cover: "https://example.com/image.png",
            // 验证 description 被添加到了头部，且有换行
            content: "> This is a short summary.\n\n# Main Content\nHere is the rest of the post.",
            author: "author_name",
            source_url: "http://source.com",
            need_open_comment: true,
            only_fans_can_comment: true,
            image_list: [
                "wenyan1.jpg",
                "wenyan2.jpg",
                "wenyan3.jpg",
                "wenyan4.jpg",
                "wenyan5.jpg",
            ],
        });
    });

    it("should handle content without description (no blockquote added)", async () => {
        const markdown = `---
title: No Description Post
---
Just some text.`;

        const result = await handleFrontMatter(markdown);

        expect(result.title).toBe("No Description Post");
        expect(result.description).toBeUndefined();
        expect(result.cover).toBeUndefined();
        // 验证没有 description 时，content 保持原样，没有多余的换行或引用符号
        expect(result.content).toBe("Just some text.");
    });

    it("should handle content with only front matter (empty content)", async () => {
        const markdown = `---
title: Empty Content
description: Summary only
---`;

        const result = await handleFrontMatter(markdown);

        expect(result.title).toBe("Empty Content");
        expect(result.description).toBe("Summary only");
        // 验证 content 仅包含生成的引用块
        expect(result.content).toBe("> Summary only\n\n");
    });

    it("should handle plain markdown without front matter", async () => {
        const markdown = "# Just a Header\nSome paragraph.";

        const result = await handleFrontMatter(markdown);

        expect(result.title).toBeUndefined();
        expect(result.description).toBeUndefined();
        expect(result.cover).toBeUndefined();
        // 验证原始内容被完整保留
        expect(result.content).toBe(markdown);
    });

    it("should handle extra attributes gracefully (ignore them)", async () => {
        const markdown = `---
title: Test
date: 2023-01-01
tags: [a, b]
---
Content`;

        const result = await handleFrontMatter(markdown);

        expect(result.title).toBe("Test");
        expect((result as any).date).toBeUndefined();
        expect((result as any).tags).toBeUndefined();
        expect(result.content).toBe("Content");
    });

    it("should handle empty string input", async () => {
        const result = await handleFrontMatter("");

        expect(result).toEqual({
            content: "",
        });
    });

    describe("type: image transformation", () => {
        it("should extract markdown images from body and inject image_list", async () => {
            const markdown = `---
title: Photo Post
type: image
---
Some text before.

![alt1](photo1.jpg)

![alt2](photo2.png)

Some text after.`;

            const result = await handleFrontMatter(markdown);

            expect(result.title).toBe("Photo Post");
            expect(result.image_list).toEqual(["photo1.jpg", "photo2.png"]);
            expect(result.content).not.toContain("![");
            expect(result.content).toContain("Some text before.");
            expect(result.content).toContain("Some text after.");
        });

        it("should extract Obsidian embed images from body", async () => {
            const markdown = `---
title: Obsidian Photos
type: image
---
![[image1.png]]
![[image2.jpg|description]]
Text between images.`;

            const result = await handleFrontMatter(markdown);

            expect(result.image_list).toEqual(["image1.png", "image2.jpg"]);
            expect(result.content).not.toContain("![[");
            expect(result.content).toContain("Text between images.");
        });

        it("should extract mixed markdown and Obsidian images", async () => {
            const markdown = `---
title: Mixed Images
type: image
---
![](md.jpg)
![[obsidian.png]]
Text.`;

            const result = await handleFrontMatter(markdown);

            expect(result.image_list).toEqual(["md.jpg", "obsidian.png"]);
        });

        it("should not transform when type is not image", async () => {
            const markdown = `---
title: Normal Post
type: article
---
![](photo.jpg)
Text.`;

            const result = await handleFrontMatter(markdown);

            expect(result.image_list).toBeUndefined();
            expect(result.content).toContain("![");
        });

        it("should not transform when image_list already exists in frontmatter", async () => {
            const markdown = `---
title: Manual Image List
type: image
image_list:
  - custom1.jpg
  - custom2.jpg
---
![](photo.jpg)
Text.`;

            const result = await handleFrontMatter(markdown);

            expect(result.image_list).toEqual(["custom1.jpg", "custom2.jpg"]);
            expect(result.content).toContain("![");
        });

        it("should not transform when body has no images", async () => {
            const markdown = `---
title: No Images
type: image
---
Just text, no images.`;

            const result = await handleFrontMatter(markdown);

            expect(result.image_list).toBeUndefined();
            expect(result.content).toContain("Just text, no images.");
        });

        it("should not transform when frontmatter is absent", async () => {
            const markdown = "![](photo.jpg)\nJust text.";

            const result = await handleFrontMatter(markdown);

            expect(result.image_list).toBeUndefined();
            expect(result.content).toContain("![");
        });
    });
});
