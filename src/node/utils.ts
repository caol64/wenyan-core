import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function readFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, "utf-8");
}

export async function readBinaryFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
}

export async function safeReadJson<T>(file: string, fallback: T): Promise<T> {
    try {
        const content = await fs.readFile(file, "utf-8");
        return JSON.parse(content) as T;
    } catch {
        return fallback;
    }
}

export async function safeWriteJson(file: string, data: unknown): Promise<void> {
    const tmp = file + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(data ?? {}, null, 2), "utf-8");
    await fs.rename(tmp, file); // 原子替换
}

export async function ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
}

export function md5FromBuffer(buf: crypto.BinaryLike): string {
    return crypto.createHash("md5").update(buf).digest("hex");
}

export async function md5FromFile(filePath: string): Promise<string> {
    const buf = await fs.readFile(filePath);
    return md5FromBuffer(buf);
}

/**
 * 路径标准化工具函数
 * 将 Windows 的反斜杠 \ 转换为正斜杠 /，并去除末尾斜杠
 * 目的：在 Linux 容器内也能正确处理 Windows 路径字符串
 */
export function normalizePath(p: string): string {
    return p.replace(/\\/g, "/").replace(/\/+$/, "");
}

export function isAbsolutePath(path: string): boolean {
    if (!path) return false;
    const winAbsPattern = /^[a-zA-Z]:\//;
    const linuxAbsPattern = /^\//;
    return winAbsPattern.test(path) || linuxAbsPattern.test(path);
}

export function getNormalizeFilePath(inputPath: string): string {
    const isContainer = !!process.env.CONTAINERIZED;
    const hostFilePath = normalizePath(process.env.HOST_FILE_PATH || "");
    if (isContainer && hostFilePath) {
        const containerFilePath = normalizePath(process.env.CONTAINER_FILE_PATH || "/mnt/host-downloads");
        let relativePart = normalizePath(inputPath);
        if (relativePart.startsWith(hostFilePath)) {
            relativePart = relativePart.slice(hostFilePath.length);
        }

        if (!relativePart.startsWith("/")) {
            relativePart = "/" + relativePart;
        }
        return containerFilePath + relativePart;
    } else {
        return path.resolve(inputPath);
    }
}
