export const serif = "Georgia, Cambria, 'Noto Serif', 'Times New Roman', serif";
export const sansSerif =
    "system-ui, 'Apple Color Emoji', 'Segoe UI', 'Segoe UI Symbol', 'Noto Sans', 'Roboto', sans-serif";
export const monospace =
    "Menlo, Monaco, Consolas, 'Liberation Mono', 'Roboto Mono', 'Courier New', 'Microsoft YaHei', monospace";

// 工具函数：兼容 Eager (string) 和 Lazy (() => Promise<string>) 两种模式
export function normalizeCssLoader(loaderOrContent: any): () => Promise<string> {
    if (typeof loaderOrContent === "string") {
        // Eager 模式：直接返回包裹了字符串的 Promise
        return () => Promise.resolve(loaderOrContent);
    }
    // Lazy 模式：直接返回加载函数
    return loaderOrContent as () => Promise<string>;
}

// 辅助函数：把 "{width=100 height=200}" 字符串转成 Map
export function stringToMap(str: string): Map<string, string> {
    const map = new Map<string, string>();
    str.split(/\s+/).forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key && value) {
            map.set(key, value.replace(/^["']|["']$/g, "")); // 去掉引号
        }
    });
    return map;
}

export function replaceCSSVariables(css: string): string {
    // 正则表达式用于匹配变量定义
    const variablePattern: RegExp = /--([a-zA-Z0-9\-]+):\s*([^;()]*\((?:[^()]*|\([^()]*\))*\)[^;()]*|[^;]+);/g;
    // 正则表达式用于匹配使用 var() 的地方
    const varPattern: RegExp = /var\(--([a-zA-Z0-9\-]+)\)/g;

    // 使用 Record<string, string> 定义键值对对象
    const cssVariables: Record<string, string> = {};

    // 1. 提取变量定义并存入字典
    let match: RegExpExecArray | null;
    while ((match = variablePattern.exec(css)) !== null) {
        const variableName: string = match[1];
        // 移除换行符并去除首尾空格
        const variableValue: string = match[2].trim().replaceAll("\n", "");

        cssVariables[variableName] = variableValue;
    }

    // 设置默认值
    if (!cssVariables["sans-serif-font"]) {
        cssVariables["sans-serif-font"] = sansSerif;
    }

    if (!cssVariables["monospace-font"]) {
        cssVariables["monospace-font"] = monospace;
    }

    // 2. 递归解析 var() 引用为字典中对应的值
    function resolveVariable(
        value: string,
        variables: Record<string, string>,
        resolved: Set<string> = new Set(),
    ): string {
        // 防止死循环 (Circular dependency check)
        if (resolved.has(value)) return value;

        resolved.add(value);
        let resolvedValue: string = value;

        // 使用 replace 回调处理当前值中嵌套的 var(...)
        // 这里为了处理像 border: 1px solid var(--color); 这种复合值
        // 我们创建一个新的正则实例避免 lastIndex 状态干扰，或者直接使用 matchAll/replace
        const innerVarPattern = /var\(--([a-zA-Z0-9\-]+)\)/g;

        resolvedValue = resolvedValue.replace(innerVarPattern, (match, varName) => {
            if (variables[varName]) {
                // 递归解析找到的变量
                return resolveVariable(variables[varName], variables, resolved);
            }
            return match; // 如果找不到变量定义，保持原样
        });

        return resolvedValue;
    }

    // 3. 替换所有变量定义中的引用（更新字典中的值为最终解析值）
    for (const key in cssVariables) {
        const resolvedValue = resolveVariable(cssVariables[key], cssVariables);
        cssVariables[key] = resolvedValue;
    }

    // 4. 替换 CSS 正文中的 var() 引用
    // 使用 replace 的回调函数模式通常比 while(exec) 更高效且安全
    let modifiedCSS: string = css.replace(varPattern, (match, varName) => {
        if (cssVariables[varName]) {
            return cssVariables[varName];
        }
        return match; // 未定义的变量保持原样
    });

    // 移除 :root { ... } 块
    // 注意：这里的正则假设 :root 块内只有变量定义，如果还有其他样式可能会被误删
    return modifiedCSS.replace(/:root\s*\{[^}]*\}/g, "");
}
