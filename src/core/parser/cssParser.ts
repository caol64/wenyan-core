import * as csstree from "css-tree";

type CssUpdate = {
    property: string;
    value?: string;
    append?: boolean;
};

type CssUpdateMap = Record<string, CssUpdate[]>;
export const parseOptions: csstree.ParseOptions = {
    context: "stylesheet",
    positions: false,
    parseAtrulePrelude: false,
    parseCustomProperty: false,
    parseValue: false,
};

export function createCssModifier(updates: CssUpdateMap) {
    return function modifyCss(customCss: string): string {
        const ast = csstree.parse(customCss, parseOptions);

        csstree.walk(ast, {
            visit: "Rule",
            leave(node, _, list) {
                if (node.prelude?.type !== "SelectorList") return;

                const selectors = node.prelude.children.toArray().map((sel) => csstree.generate(sel));

                if (selectors.length > 0) {
                    const selector = selectors[0];
                    const update = updates[selector];
                    if (!update) return;

                    for (const { property, value, append } of update) {
                        if (value) {
                            let found = false;
                            csstree.walk(node.block, (decl) => {
                                if (decl.type === "Declaration" && decl.property === property) {
                                    decl.value = csstree.parse(value, { context: "value" }) as csstree.Value;
                                    found = true;
                                }
                            });
                            if (!found && append) {
                                node.block.children.prepend(
                                    list.createItem({
                                        type: "Declaration",
                                        property,
                                        value: csstree.parse(value, { context: "value" }) as csstree.Value,
                                        important: false,
                                    }),
                                );
                            }
                        }
                    }
                }
            },
        });

        return csstree.generate(ast);
    };
}

export function createCssApplier(css: string) {
    const ast = csstree.parse(css, parseOptions);
    return function applyToElement(element: HTMLElement): void {
        csstree.walk(ast, {
            visit: "Rule",
            enter(node) {
                if (node.prelude.type !== "SelectorList") return;

                const declarations = node.block.children.toArray();

                node.prelude.children.forEach((selectorNode) => {
                    const selector = csstree.generate(selectorNode);
                    // 安全性检查：跳过伪类/伪元素，防止 querySelectorAll 报错或逻辑错误
                    if (selector.includes(":")) return;
                    // 根节点特殊处理
                    const targets =
                        selector === "#wenyan"
                            ? [element]
                            : Array.from(element.querySelectorAll<HTMLElement>(selector));

                    targets.forEach((el) => {
                        declarations.forEach((decl) => {
                            if (decl.type !== "Declaration") return;
                            let value = csstree.generate(decl.value);
                            // csstree 解析出的 value 可能不包含 !important，它在 decl.important 字段里
                            // 如果 value 字符串里包含了 !important，需要手动清理一下传给 setProperty

                            const property = decl.property;
                            const priority = decl.important ? "important" : "";

                            // 使用 setProperty 接口
                            el.style.setProperty(property, value, priority);
                        });
                    });
                });
            },
        });
    };
}
