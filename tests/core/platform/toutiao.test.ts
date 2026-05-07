import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { getContentForToutiao } from "../../../src/core/platform/toutiao";

describe("platform/toutiao", () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
        document = dom.window.document;
    });

    describe("getContentForToutiao", () => {
        it("应该将数学公式容器转换为图片", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <mjx-container aria-label="Formula">
                    <svg style="vertical-align: middle;"></svg>
                </mjx-container>
            `;

            const result = getContentForToutiao(root);
            expect(result).toContain("<img");
            expect(result).toContain('src="data:image/svg+xml');
            expect(result).not.toContain("mjx-container");
        });

        it("应该跳过没有 SVG 的公式容器", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <mjx-container>
                    <div>No SVG here</div>
                </mjx-container>
            `;

            const result = getContentForToutiao(root);
            expect(result).not.toContain("<img");
        });

        it("应该自动给 SVG 添加 xmlns 属性", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <mjx-container>
                    <svg></svg>
                </mjx-container>
            `;

            const result = getContentForToutiao(root);
            expect(result).toContain("xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22");
        });

        it("应该保留 aria-label 作为图片 alt 属性", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <mjx-container aria-label="Math Formula">
                    <svg></svg>
                </mjx-container>
            `;

            const result = getContentForToutiao(root);
            expect(result).toContain('alt="Math Formula"');
        });

        it("应该正确处理多个数学公式容器", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <mjx-container><svg></svg></mjx-container>
                <mjx-container><svg></svg></mjx-container>
            `;

            const result = getContentForToutiao(root);

            const imgCount = (result.match(/<img/g) || []).length;
            expect(imgCount).toBe(2);
        });

        it("处理完成后应该返回正确的 outerHTML", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `<p>正常内容，无需处理</p>`;

            const result = getContentForToutiao(root);
            expect(result).toContain("正常内容，无需处理");
        });

        it("应该将 Mermaid 图转换为图片", () => {
            const root = document.getElementById("root")!;
            const dataPoints = Buffer.from(
                JSON.stringify([
                    { x: 10, y: 10 },
                    { x: 10, y: 40 },
                ]),
                "utf8",
            ).toString("base64");
            root.innerHTML = `
                <figure data-wenyan-diagram="mermaid">
                    <svg id="wenyan-mermaid-1" xmlns="http://www.w3.org/2000/svg">
                        <style>
                            #wenyan-mermaid-1 { fill: #333; }
                            #wenyan-mermaid-1 .node rect { stroke: #9370DB; }
                        </style>
                        <g class="node"><rect></rect></g>
                        <g>
                            <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                                <path d="M 0 0 L 10 5 L 0 10 z"></path>
                            </marker>
                            <path d="M10,10L10,40" data-points="${dataPoints}" marker-end="url(#arrow-end)"></path>
                        </g>
                    </svg>
                </figure>
            `;

            const result = getContentForToutiao(root);

            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = result;

            const img = tempContainer.querySelector("img");

            expect(result).toContain("<img");
            expect(result).toContain('src="data:image/svg+xml');

            expect(tempContainer.querySelector("svg")).toBeNull();
            expect(tempContainer.querySelector("figure")).toBeNull();

            expect(img).not.toBeNull();
            expect(img?.getAttribute("style")).toContain("max-width: 100%");
            expect(img?.getAttribute("style")).toContain("height: auto");

            // 💡 核心修复：正确解析 Base64 或 URL 编码的 Data URI
            const src = img?.getAttribute("src") || "";
            let decodedSrc = "";

            if (src.includes(";base64,")) {
                // 如果是 Base64 编码
                const base64Data = src.split(";base64,")[1];
                decodedSrc = Buffer.from(base64Data, "base64").toString("utf8");
            } else {
                // 如果是普通的 URL 编码
                decodedSrc = decodeURIComponent(src.replace(/^data:image\/svg\+xml,/, ""));
            }

            // 进行内容断言
            expect(decodedSrc).toContain("stroke: #9370DB");
            expect(decodedSrc).not.toContain("<style>");
            expect(decodedSrc).not.toContain("marker-end=");
            expect(decodedSrc).not.toContain("<marker");
            expect(decodedSrc).toContain('data-wenyan-marker="end"');
        });
    });
});
