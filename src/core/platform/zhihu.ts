export function getContentForZhihu(wenyanElement: HTMLElement): string {
    const elements = wenyanElement.querySelectorAll<HTMLElement>("mjx-container");
    const doc = wenyanElement.ownerDocument;
    elements.forEach((element) => {
        const math = element.getAttribute("math");
        if (!math) return;
        const img = doc.createElement("img");
        img.alt = math; // 将公式源码放入 alt，供后续处理
        img.dataset.eeimg = "true"; // 使用 dataset API 设置 data-eeimg
        img.style.cssText = "margin: 0 auto; width: auto; max-width: 100%; display: block;";
        element.replaceWith(img);
    });
    return wenyanElement.outerHTML;
}
