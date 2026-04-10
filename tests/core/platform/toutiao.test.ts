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
    });
});
