import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { publishToDraft } from "../src/wechat/publish.js";

describe("publish.ts tests", () => {
    it("publish to gzh", { timeout: 10000 }, async () => {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const html = await readFile(join(__dirname, "publish.html"), "utf8");
        const data = await publishToDraft("自动化测试", html, "", {
            relativePath: __dirname,
        });
        expect(data).toHaveProperty("media_id");
        expect(data.media_id).toBeTruthy();
    });
});
