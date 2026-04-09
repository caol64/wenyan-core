import { FormDataEncoder } from "form-data-encoder";
import { FormData } from "formdata-node";
import { Readable } from "node:stream";
import { HttpAdapter } from "../http.js";
import { ProxyAgent as UndiciProxyAgent } from "undici";

export interface NodeHttpAdapterOptions {
    /**
     * 代理服务器地址
     * 支持格式:
     * - http://127.0.0.1:7890
     * - https://127.0.0.1:7890
     * - socks5://127.0.0.1:1080
     * - socks4://127.0.0.1:1080
     */
    proxy?: string;
}

// 缓存 dispatcher，避免重复创建
let cachedDispatcher: any = undefined;
let cachedProxy: string | undefined = undefined;

/**
 * 获取或创建 ProxyAgent dispatcher
 */
function getDispatcher(proxy: string): any {
    // 如果已经创建过相同的代理，直接返回
    if (cachedDispatcher && cachedProxy === proxy) {
        return cachedDispatcher;
    }
    
    try {
        // 使用外部安装的 undici 包的 ProxyAgent
        const dispatcher = new UndiciProxyAgent(proxy);
        cachedDispatcher = dispatcher;
        cachedProxy = proxy;
        return dispatcher;
    } catch {
        return undefined;
    }
}

/**
 * 创建支持代理的 HTTP Adapter
 * @param options 适配器选项，包含代理配置
 */
export function createNodeHttpAdapter(options?: NodeHttpAdapterOptions): HttpAdapter {
    const proxy = options?.proxy;
    let dispatcher: any = undefined;
    
    // 如果指定了代理，立即创建 dispatcher
    if (proxy) {
        dispatcher = getDispatcher(proxy);
    }

    return {
        async fetch(input, init) {
            if (dispatcher) {
                // 使用带代理的 dispatcher
                return fetch(input, {
                    ...init,
                    dispatcher,
                } as any);
            }
            // 否则使用默认的 fetch
            return fetch(input, init);
        },

        createMultipart(field, file, filename) {
            const form = new FormData();
            form.append(field, file, filename);
            const encoder = new FormDataEncoder(form);

            return {
                body: Readable.from(encoder) as any,
                headers: encoder.headers,
                duplex: "half",
            };
        },
    };
}

// 保持向后兼容：导出一个默认的无代理 adapter
export const nodeHttpAdapter: HttpAdapter = createNodeHttpAdapter();