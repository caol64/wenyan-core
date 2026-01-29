import { describe, it, expect } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getGzhContent } from "../src/node/wrapper";
import { readFileSync } from "node:fs";
import { Theme, HlTheme, registerHlTheme, registerTheme } from "../src/core";
import { MacStyle, registerMacStyle } from "../src/core/theme/macStyleRegistry";

const defaultTheme = readFileSync(resolve(__dirname, "../src/assets/themes/phycat.css"), "utf-8");
const theme: Theme = {
    meta: {
        id: "phycat",
        name: "Phycat",
        description: "The phycat theme.",
        appName: "Wenyan",
        author: "Author Name",
    },
    getCss: async () => {
        return defaultTheme;
    },
};

const defaultHlTheme = readFileSync(resolve(__dirname, "../src/assets/highlight/styles/solarized-light.min.css"), "utf-8");
const hlTheme: HlTheme = {
    id: "solarized-light",
    getCss: async () => {
        return defaultHlTheme;
    },
};

const defaultMacStyle = readFileSync(resolve(__dirname, "../src/assets/mac_style.css"), "utf-8");
const macStyle: MacStyle = {
    getCss: () => {
        return defaultMacStyle;
    },
};

registerTheme(theme);
registerHlTheme(hlTheme);
registerMacStyle(macStyle);

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
        expect(gzhContent.content).toContain("linear-gradient");
    });
});
