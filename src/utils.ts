// 工具函数：兼容 Eager (string) 和 Lazy (() => Promise<string>) 两种模式
export function normalizeCssLoader(loaderOrContent: any): () => Promise<string> {
    if (typeof loaderOrContent === 'string') {
        // Eager 模式：直接返回包裹了字符串的 Promise
        return () => Promise.resolve(loaderOrContent);
    }
    // Lazy 模式：直接返回加载函数
    return loaderOrContent as () => Promise<string>;
}
