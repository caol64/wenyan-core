import { describe, it, expect } from "vitest";
import { wechatPostRender } from "../src/core/renderer/wechatPostRender";
import { JSDOM } from "jsdom";

describe("wechatPostRender", () => {
    function createDom(html: string) {
        const dom = new JSDOM(`<section id="wenyan">${html}</section>`);
        const element = dom.window.document.getElementById("wenyan")!;
        return element;
    }

    it("should wrap li content in section", () => {
        const element = createDom("<ul><li>item</li></ul>");
        wechatPostRender(element);

        const li = element.querySelector("li")!;
        expect(li.querySelector("section")).not.toBeNull();
        expect(li.querySelector("section")!.textContent).toBe("item");
    });

    it("should lift nested ul out of li for WeChat compatibility", () => {
        const element = createDom(
            "<ul><li>parent<ul><li>child</li></ul></li></ul>",
        );
        wechatPostRender(element);

        // 嵌套的 <ul> 应该被移到 <li> 之后，成为同级元素
        const parentLi = element.querySelectorAll("li")[0];
        const nestedUl = parentLi.nextElementSibling;

        expect(nestedUl?.tagName).toBe("UL");
        expect(nestedUl?.querySelector("li")?.textContent).toBe("child");
        // <li> 内容只剩文本
        expect(parentLi.querySelector("section")!.textContent).toBe("parent");
    });

    it("should lift nested ol out of li for WeChat compatibility", () => {
        const element = createDom(
            "<ul><li>parent<ol><li>child</li></ol></li></ul>",
        );
        wechatPostRender(element);

        const parentLi = element.querySelectorAll("li")[0];
        const nestedOl = parentLi.nextElementSibling;

        expect(nestedOl?.tagName).toBe("OL");
        expect(nestedOl?.querySelector("li")?.textContent).toBe("child");
    });

    it("should handle deeply nested lists", () => {
        const element = createDom(
            "<ul><li>l1<ul><li>l2<ul><li>l3</li></ul></li></ul></li></ul>",
        );
        wechatPostRender(element);

        const lis = element.querySelectorAll("li");
        const uls = element.querySelectorAll("ul");

        // 所有列表项的文本内容应该正确
        const texts = Array.from(lis).map((li) => li.textContent);
        expect(texts).toContain("l1");
        expect(texts).toContain("l2");
        expect(texts).toContain("l3");

        // 不应该有任何 <ul> 嵌套在 <li> 的 <section> 内
        element.querySelectorAll("li").forEach((li) => {
            const section = li.querySelector("section");
            if (section) {
                expect(section.querySelector("ul")).toBeNull();
                expect(section.querySelector("ol")).toBeNull();
            }
        });
    });
});
