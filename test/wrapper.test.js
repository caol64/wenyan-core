import { describe, it, expect } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getGzhContent } from "../dist/wrapper.js";

describe("wrapper.ts tests", () => {
    it("should return GzhContent", async () => {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const md = await readFile(join(__dirname, "publish.md"), "utf8");
        const gzhContent = await getGzhContent(md, "phycat", "solarized-light", true, true);

        const outputPath = join(__dirname, "publish.html");
        await writeFile(outputPath, gzhContent.content, "utf8");

        expect(gzhContent).toHaveProperty("title");
        expect(gzhContent).toHaveProperty("cover");
        expect(gzhContent).toHaveProperty("content");
        expect(gzhContent.content).toContain("</h2>");
    });
});
