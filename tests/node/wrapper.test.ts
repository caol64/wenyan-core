import { describe, it, expect, vi } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as wrapper from "../../src/node/wrapper";
import * as renderModule from "../../src/node/render";
import * as publishModule from "../../src/node/publish";
import * as clientPublishModule from "../../src/node/clientPublish";
import { readFileSync } from "node:fs";
import { Theme, HlTheme, registerHlTheme, registerTheme } from "../../src/core";
import { MacStyle, registerMacStyle } from "../../src/core/theme/macStyleRegistry";

const defaultTheme = readFileSync(resolve(__dirname, "../../src/assets/themes/phycat.css"), "utf-8");
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

const defaultHlTheme = readFileSync(resolve(__dirname, "../../src/assets/highlight/styles/solarized-light.min.css"), "utf-8");
const hlTheme: HlTheme = {
    id: "solarized-light",
    getCss: async () => {
        return defaultHlTheme;
    },
};

const defaultMacStyle = readFileSync(resolve(__dirname, "../../src/assets/mac_style.css"), "utf-8");
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
        const md = await readFile(join(__dirname, "../publish.md"), "utf8");
        const gzhContent = await wrapper.getGzhContent(md, "phycat", "solarized-light", true, true);

        const outputPath = join(__dirname, "../publish.html");
        await writeFile(outputPath, gzhContent.content, "utf8");

        expect(gzhContent).toHaveProperty("title");
        expect(gzhContent).toHaveProperty("cover");
        expect(gzhContent).toHaveProperty("content");
        expect(gzhContent).toHaveProperty("author");
        expect(gzhContent).toHaveProperty("source_url");
        expect(gzhContent).toHaveProperty("need_open_comment");
        expect(gzhContent).toHaveProperty("only_fans_can_comment");
        expect(gzhContent.content).toContain("</h2>");
        expect(gzhContent.content).toContain("linear-gradient");
    });

    it("should pass comment options to direct publish flow", async () => {
        const prepareRenderContextSpy = vi.spyOn(renderModule, "prepareRenderContext").mockResolvedValue({
            gzhContent: {
                title: "Wrapper Title",
                content: "<p>Wrapper Content</p>",
                cover: "/tmp/cover.jpg",
                author: "Walker",
                source_url: "https://example.com/source",
            },
            absoluteDirPath: "/tmp/article-dir",
        });
        const publishToWechatDraftSpy = vi.spyOn(publishModule, "publishToWechatDraft").mockResolvedValue({
            media_id: "wrapper-media-id",
        });

        const mediaId = await wrapper.renderAndPublish(undefined, {
            theme: "phycat",
            highlight: "solarized-light",
            macStyle: true,
            footnote: true,
            appId: "wx-app-id",
        }, vi.fn());

        expect(mediaId).toBe("wrapper-media-id");
        expect(prepareRenderContextSpy).toHaveBeenCalled();
        expect(publishToWechatDraftSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Wrapper Title",
            }),
            expect.objectContaining({
                appId: "wx-app-id",
                relativePath: "/tmp/article-dir",
                need_open_comment: 1,
                only_fans_can_comment: 1,
            }),
        );
    });

    it("should pass comment options to remote publish flow", async () => {
        vi.spyOn(clientPublishModule, "healthCheck").mockResolvedValue("1.0.0");
        vi.spyOn(clientPublishModule, "verifyAuth").mockResolvedValue();
        vi.spyOn(renderModule, "prepareRenderContext").mockResolvedValue({
            gzhContent: {
                title: "Remote Title",
                content: "<p>Remote Content</p>",
                cover: "/tmp/cover.jpg",
                author: "Walker",
                source_url: "https://example.com/source",
            },
            absoluteDirPath: "/tmp/article-dir",
        });
        vi.spyOn(clientPublishModule, "uploadLocalImages").mockResolvedValue("<p>Uploaded Remote Content</p>");
        vi.spyOn(clientPublishModule, "uploadCover").mockResolvedValue("asset://cover-id");
        vi.spyOn(clientPublishModule, "uploadStyledContent").mockResolvedValue("file-123");
        const requestServerPublishSpy = vi.spyOn(clientPublishModule, "requestServerPublish").mockResolvedValue("remote-media-id");

        const mediaId = await wrapper.renderAndPublishToServer(undefined, {
            server: "http://localhost:3000",
            apiKey: "test-key",
            clientVersion: "1.0.0",
            theme: "phycat",
            highlight: "solarized-light",
            macStyle: true,
            footnote: true,
            appId: "wx-app-id",
            need_open_comment: true,
            only_fans_can_comment: true,
        }, vi.fn());

        expect(mediaId).toBe("remote-media-id");
        expect(requestServerPublishSpy).toHaveBeenCalledWith(
            "file-123",
            "http://localhost:3000",
            expect.objectContaining({
                "x-api-key": "test-key",
                "x-client-version": "1.0.0",
            }),
            expect.objectContaining({
                need_open_comment: 1,
                only_fans_can_comment: 1,
            }),
        );
    });
});
