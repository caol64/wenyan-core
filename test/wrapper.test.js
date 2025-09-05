import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { getGzhContent } from "../src/wrapper.js";

describe("wrapper.ts tests", () => {
    it("should return GzhContent", async () => {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const md = await readFile(join(__dirname, "publish.md"), "utf8");
        const gzhContent = await getGzhContent(md, "lapis", "monokai", true);

        expect(gzhContent).toHaveProperty("title");
        expect(gzhContent).toHaveProperty("cover");
        expect(gzhContent).toHaveProperty("content");
        expect(gzhContent.content).toContain("</h2>");
    });
});
