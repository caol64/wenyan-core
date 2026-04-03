import path from "node:path";
import http from "node:http";
import https from "node:https";
import { JSDOM } from "jsdom";
import { ClientPublishOptions, StyledContent } from "./types.js";
import { readBinaryFile } from "./utils.js";
import { RuntimeEnv } from "./runtimeEnv.js";

/**
 * 使用 node:http 分块上传，避免 Windows 下 fetch/大 payload 触发 EPERM
 */
async function chunkedUpload(
    serverUrl: string,
    headers: Record<string, string>,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
): Promise<any> {
    const url = new URL(`${serverUrl}/upload`);
    const boundary = "----FormBoundary" + Math.random().toString(36).substring(2);
    const headerPart = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footerPart = `\r\n--${boundary}--\r\n`;
    const headerBuf = Buffer.from(headerPart, "utf-8");
    const footerBuf = Buffer.from(footerPart, "utf-8");

    return new Promise((resolve, reject) => {
        const requestModule = url.protocol === "https:" ? https : http;
        const defaultPort = url.protocol === "https:" ? 443 : 80;
        const req = requestModule.request(
            {
                hostname: url.hostname,
                port: url.port || defaultPort,
                path: url.pathname,
                method: "POST",
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${boundary}`,
                    "Transfer-Encoding": "chunked",
                    ...headers,
                },
            },
            (res) => {
                let body = "";
                res.on("data", (chunk: Buffer) => (body += chunk));
                res.on("end", () => {
                    if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                        reject(new Error(`Server returned status ${res.statusCode}: ${body}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(body));
                    } catch (_e) {
                        reject(new Error(`Invalid server response: ${body}`));
                    }
                });
            },
        );
        req.on("error", reject);

        req.write(headerBuf);
        const CHUNK = 65536; // 64KB chunks
        let offset = 0;
        function writeNext() {
            if (offset >= fileBuffer.length) {
                req.write(footerBuf);
                req.end();
                return;
            }
            const end = Math.min(offset + CHUNK, fileBuffer.length);
            if (req.write(fileBuffer.subarray(offset, end))) {
                offset = end;
                writeNext();
            } else {
                offset = end;
                req.once("drain", writeNext);
            }
        }
        writeNext();
    });
}

export function getServerUrl(options: ClientPublishOptions): string {
    let serverUrl = options.server || "http://localhost:3000";
    serverUrl = serverUrl.replace(/\/$/, ""); // 移除末尾的斜杠
    return serverUrl;
}

export function getHeaders(options: ClientPublishOptions): Record<string, string> {
    const headers: Record<string, string> = {};
    if (options.clientVersion) {
        headers["x-client-version"] = options.clientVersion;
    }
    if (options.apiKey) {
        headers["x-api-key"] = options.apiKey;
    }
    return headers;
}

/**
 * 物理连通性测试
 */
export async function healthCheck(serverUrl: string): Promise<string> {
    try {
        // 1. 物理连通性与服务指纹验证
        const healthRes = await fetch(`${serverUrl}/health`, { method: "GET" });

        if (!healthRes.ok) {
            throw new Error(`HTTP Error: ${healthRes.status} ${healthRes.statusText}`);
        }

        const healthData: any = await healthRes.json();

        if (healthData.status !== "ok" || healthData.service !== "wenyan-cli") {
            throw new Error(`Invalid server response. Make sure the server URL is correct.`);
        }
        return healthData.version;
    } catch (error: any) {
        throw new Error(
            `Failed to connect to server (${serverUrl}). \nPlease check if the server is running and the network is accessible. \nDetails: ${error.message}`,
        );
    }
}

/**
 * 鉴权探针测试
 */
export async function verifyAuth(serverUrl: string, headers: Record<string, string>): Promise<void> {
    const verifyRes = await fetch(`${serverUrl}/verify`, {
        method: "GET",
        headers, // 携带 x-api-key 和 x-client-version
    });

    if (verifyRes.status === 401) {
        throw new Error("鉴权失败 (401)：Server 拒绝访问，请检查传入的 --api-key 是否正确。");
    }

    if (!verifyRes.ok) {
        throw new Error(`Verify Error: ${verifyRes.status} ${verifyRes.statusText}`);
    }
}

export async function uploadStyledContent(
    gzhContent: StyledContent,
    serverUrl: string,
    headers: Record<string, string>,
): Promise<string> {
    const mdFilename = "publish_target.json";
    const fileBuffer = Buffer.from(JSON.stringify(gzhContent), "utf-8");
    const mdUploadData: any = await chunkedUpload(serverUrl, headers, fileBuffer, mdFilename, "application/json");

    if (!mdUploadData.success) {
        throw new Error(`Upload Document Failed: ${mdUploadData.error || mdUploadData.desc}`);
    }

    const mdFileId = mdUploadData.data.fileId;
    return mdFileId;
}

export async function requestServerPublish(
    mdFileId: string,
    serverUrl: string,
    headers: Record<string, string>,
    options: ClientPublishOptions,
): Promise<string> {
    const { theme, customTheme, highlight, macStyle, footnote } = options;
    const publishRes = await fetch(`${serverUrl}/publish`, {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fileId: mdFileId,
            theme,
            highlight,
            customTheme,
            macStyle,
            footnote,
        }),
    });

    const publishData: any = await publishRes.json();

    if (!publishRes.ok || publishData.code === -1) {
        throw new Error(`Remote Publish Failed: ${publishData.desc || publishRes.statusText}`);
    }

    return publishData.media_id;
}

function needUpload(url: string): boolean {
    // 需要上传的图片链接通常是相对路径，且不以 http/https、data:、asset:// 等协议开头
    return !/^(https?:\/\/|data:|asset:\/\/)/i.test(url);
}

async function uploadLocalImage(
    originalUrl: string,
    serverUrl: string,
    headers: Record<string, string>,
    relativePath?: string,
): Promise<string | null> {
    const imagePath = RuntimeEnv.resolveLocalPath(originalUrl, relativePath);
    let fileBuffer: Buffer;
    try {
        fileBuffer = await readBinaryFile(imagePath);
    } catch (error: any) {
        if (error.code === "ENOENT") {
            console.error(`[Client] Warning: Local image not found: ${imagePath}`);
            return null;
        }
        throw new Error(`Failed to read local image (${imagePath}): ${error.message}`);
    }
    const filename = path.basename(imagePath);

    // 推断 Content-Type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
    };
    const type = mimeTypes[ext] || "application/octet-stream";

    // 使用分块上传，兼容 Windows 大文件场景
    const uploadData: any = await chunkedUpload(serverUrl, headers, fileBuffer, filename, type);

    if (uploadData.success) {
        return `asset://${uploadData.data.fileId}`;
    } else {
        console.error(`[Client] Warning: Failed to upload ${filename}: ${uploadData.error || uploadData.desc}`);
        return null;
    }
}

export async function uploadLocalImages(
    content: string,
    serverUrl: string,
    headers: Record<string, string>,
    relativePath?: string,
): Promise<string> {
    if (content.includes("<img")) {
        const dom = new JSDOM(content);
        const document = dom.window.document;
        const images = Array.from(document.querySelectorAll("img"));

        // 并发上传所有插图
        const uploadPromises = images.map(async (element) => {
            const dataSrc = element.getAttribute("src");
            if (dataSrc && needUpload(dataSrc)) {
                const newUrl = await uploadLocalImage(dataSrc, serverUrl, headers, relativePath);
                if (newUrl) {
                    element.setAttribute("src", newUrl); // 替换 DOM 中的属性
                }
            }
        });

        await Promise.all(uploadPromises);
        return document.body.innerHTML;
    }
    return content;
}

export async function uploadCover(
    serverUrl: string,
    headers: Record<string, string>,
    cover?: string,
    relativePath?: string,
): Promise<string | undefined> {
    if (cover && needUpload(cover)) {
        const newCoverUrl = await uploadLocalImage(cover, serverUrl, headers, relativePath);
        if (newCoverUrl) {
            return newCoverUrl; // 将封面路径替换为 asset://fileId
        }
    }
    return cover;
}
