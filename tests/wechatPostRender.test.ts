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

    it("should convert nested ul to styled section elements", () => {
        const element = createDom(
            "<ul><li>parent<ul><li>child</li></ul></li></ul>",
        );
        wechatPostRender(element);

        // 嵌套的 <ul> 应该被转换为 <section>，保留在 <li> 内部
        const parentLi = element.querySelector("li")!;
        expect(parentLi.querySelector("ul")).toBeNull();
        expect(parentLi.querySelector("ol")).toBeNull();

        // 验证转换后的 section 结构
        const wrapper = parentLi.querySelector("section > section")!;
        expect(wrapper).not.toBeNull();
        expect(wrapper.style.marginLeft).toBe("1em");

        // 验证子项内容带有项目符号标记
        const items = wrapper.querySelectorAll(":scope > section");
        expect(items.length).toBe(1);
        expect(items[0].textContent).toBe("• child");
    });

    it("should convert nested ol to styled section elements with numbered markers", () => {
        const element = createDom(
            "<ul><li>parent<ol><li>first</li><li>second</li></ol></li></ul>",
        );
        wechatPostRender(element);

        const parentLi = element.querySelector("li")!;
        expect(parentLi.querySelector("ol")).toBeNull();

        const wrapper = parentLi.querySelector("section > section")!;
        const items = wrapper.querySelectorAll(":scope > section");
        expect(items.length).toBe(2);
        expect(items[0].textContent).toBe("1. first");
        expect(items[1].textContent).toBe("2. second");
    });

    it("should handle deeply nested lists", () => {
        const element = createDom(
            "<ul><li>l1<ul><li>l2<ul><li>l3</li></ul></li></ul></li></ul>",
        );
        wechatPostRender(element);

        // 不应该有任何 <ul>/<ol> 嵌套在 <li> 的 <section> 内
        const allUls = element.querySelectorAll("ul");
        const allOls = element.querySelectorAll("ol");
        // Only the top-level <ul> should remain
        expect(allUls.length).toBe(1);
        expect(allOls.length).toBe(0);

        // 验证内容层级正确
        const text = element.textContent!;
        expect(text).toContain("l1");
        expect(text).toContain("• l2");
        expect(text).toContain("• l3");
    });

    it("should preserve HTML content inside nested list items", () => {
        const element = createDom(
            "<ul><li>parent<ul><li><strong>bold</strong> child</li></ul></li></ul>",
        );
        wechatPostRender(element);

        const wrapper = element.querySelector("section > section")!;
        const item = wrapper.querySelector(":scope > section")!;
        expect(item.innerHTML).toContain("<strong>bold</strong>");
        expect(item.textContent).toBe("• bold child");
    });
});
