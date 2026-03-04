import path from "node:path";
import { Readable } from "node:stream";
import { FormData, File } from "formdata-node";
import { FormDataEncoder } from "form-data-encoder";
import { JSDOM } from "jsdom";
import { ClientPublishOptions, StyledContent } from "./types.js";
import { readBinaryFile } from "./utils.js";
import { RuntimeEnv } from "./runtimeEnv.js";

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
    const mdFilename = "publish_target.json"; // 这个文件名对服务器来说没有实际意义，只是一个标识
    const mdForm = new FormData();
    mdForm.append(
        "file",
        new File([Buffer.from(JSON.stringify(gzhContent), "utf-8")], mdFilename, { type: "application/json" }),
    );

    const mdEncoder = new FormDataEncoder(mdForm);
    const mdUploadRes = await fetch(`${serverUrl}/upload`, {
        method: "POST",
        headers: { ...headers, ...mdEncoder.headers },
        body: Readable.from(mdEncoder) as any,
        duplex: "half",
    } as RequestInit);

    const mdUploadData: any = await mdUploadRes.json();

    if (!mdUploadRes.ok || !mdUploadData.success) {
        throw new Error(`Upload Document Failed: ${mdUploadData.error || mdUploadData.desc || mdUploadRes.statusText}`);
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

    // 构建图片上传表单
    const form = new FormData();
    form.append("file", new File([fileBuffer], filename, { type }));
    const encoder = new FormDataEncoder(form);

    const uploadRes = await fetch(`${serverUrl}/upload`, {
        method: "POST",
        headers: { ...headers, ...encoder.headers },
        body: Readable.from(encoder) as any,
        duplex: "half",
    } as RequestInit);

    const uploadData: any = await uploadRes.json();

    if (uploadRes.ok && uploadData.success) {
        // 返回可供 Server 直接使用的协议路径
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
