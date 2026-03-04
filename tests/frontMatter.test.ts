import { describe, it, expect } from "vitest";
import { handleFrontMatter } from "../src/core/parser/frontMatterParser";

describe("handleFrontMatter", () => {
    it("should parse all fields and prepend description to body", async () => {
        const markdown = `---
title: My Awesome Post
description: This is a short summary.
cover: https://example.com/image.png
---
# Main Content
Here is the rest of the post.`;

        const result = await handleFrontMatter(markdown);

        expect(result).toEqual({
            title: "My Awesome Post",
            description: "This is a short summary.",
            cover: "https://example.com/image.png",
            // 验证 description 被添加到了头部，且有换行
            body: "> This is a short summary.\n\n# Main Content\nHere is the rest of the post.",
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
        // 验证没有 description 时，body 保持原样，没有多余的换行或引用符号
        expect(result.body).toBe("Just some text.");
    });

    it("should handle content with only front matter (empty body)", async () => {
        const markdown = `---
title: Empty Body
description: Summary only
---`;

        const result = await handleFrontMatter(markdown);

        expect(result.title).toBe("Empty Body");
        expect(result.description).toBe("Summary only");
        // 验证 body 仅包含生成的引用块
        expect(result.body).toBe("> Summary only\n\n");
    });

    it("should handle plain markdown without front matter", async () => {
        const markdown = "# Just a Header\nSome paragraph.";

        const result = await handleFrontMatter(markdown);

        expect(result.title).toBeUndefined();
        expect(result.description).toBeUndefined();
        expect(result.cover).toBeUndefined();
        // 验证原始内容被完整保留
        expect(result.body).toBe(markdown);
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
        expect(result.body).toBe("Content");
    });

    it("should handle empty string input", async () => {
        const result = await handleFrontMatter("");

        expect(result).toEqual({
            body: "",
        });
    });
});
