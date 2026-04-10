import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { getContentForZhihu } from "../../../src/core/platform/zhihu";

describe("platform/zhihu", () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
        document = dom.window.document;
    });

    describe("getContentForZhihu", () => {
        it("应该将带 math 属性的公式转换为 img", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `<mjx-container math="E = mc^2"></mjx-container>`;

            const result = getContentForZhihu(root);

            expect(result).toContain("<img");
            expect(result).toContain(`alt="E = mc^2"`);
            expect(result).toContain(`data-eeimg="true"`);
            expect(result).not.toContain("mjx-container");
        });

        it("应该跳过没有 math 属性的 mjx-container", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `<mjx-container></mjx-container>`;

            const result = getContentForZhihu(root);

            // 不会替换，保持原样
            expect(result).toContain("mjx-container");
            expect(result).not.toContain("<img");
        });

        it("应该给图片设置正确的属性和样式", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `<mjx-container math="\\sum x"></mjx-container>`;

            const result = getContentForZhihu(root);

            expect(result).toContain('alt="\\sum x"');
            expect(result).toContain('data-eeimg="true"');
            expect(result).toContain('style="margin: 0px auto; width: auto; max-width: 100%; display: block;"');
        });

        it("应该正确处理多个公式", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <mjx-container math="E=mc^2"></mjx-container>
                <mjx-container math="a^2+b^2=c^2"></mjx-container>
            `;

            const result = getContentForZhihu(root);
            const imgCount = (result.match(/<img/g) || []).length;
            expect(imgCount).toBe(2);
        });

        it("没有公式时应该直接返回原始 HTML", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `<p>测试内容</p>`;

            const result = getContentForZhihu(root);
            expect(result).toBe(`<div id="root"><p>测试内容</p></div>`);
        });
    });
});
