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
            leave(node) {
                if (node.prelude?.type !== "SelectorList") return;

                // 1. 获取该规则包含的所有选择器字符串
                const selectors = node.prelude.children.toArray().map((sel) => csstree.generate(sel));

                if (selectors.length > 0) {
                    // 使用 Map 来去重，如果 h1 和 p 都定义了 font-size，后者的配置会覆盖前者
                    const mergedUpdates = new Map<string, CssUpdate>();

                    selectors.forEach((sel) => {
                        const updateList = updates[sel];
                        if (updateList) {
                            updateList.forEach((update) => {
                                // 以属性名(property)为 key 进行合并
                                mergedUpdates.set(update.property, update);
                            });
                        }
                    });

                    // 如果没有任何更新需要应用，直接返回
                    if (mergedUpdates.size === 0) return;

                    // 3. 应用合并后的更新
                    for (const { property, value, append } of mergedUpdates.values()) {
                        if (value) {
                            let found = false;

                            // 查找并替换现有属性
                            csstree.walk(node.block, (decl) => {
                                if (decl.type === "Declaration" && decl.property === property) {
                                    // decl.value = csstree.parse(value, { context: "value" }) as csstree.Value;
                                    found = true;
                                }
                            });

                            // append = true → 永远追加
                            // append = false → 仅在不存在时追加
                            const shouldAppend = append === true || (append === false && !found);
                            if (shouldAppend && value) {
                                const newItem = node.block.children.createItem({
                                    type: "Declaration",
                                    property,
                                    value: csstree.parse(value, { context: "value" }) as csstree.Value,
                                    important: false,
                                });
                                node.block.children.prepend(newItem);
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
