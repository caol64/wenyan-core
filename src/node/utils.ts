import fs from "node:fs";
import crypto from "node:crypto";

export function safeReadJson<T>(file: string, fallback: T): T {
    try {
        return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
    } catch {
        return fallback;
    }
}

export function safeWriteJson(file: string, data: unknown) {
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data ?? {}, null, 2), "utf-8");
    fs.renameSync(tmp, file); // 原子替换
}

export function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function md5FromBuffer(buf: crypto.BinaryLike) {
    return crypto.createHash("md5").update(buf).digest("hex");
}

export function md5FromFile(filePath: string) {
    const buf = fs.readFileSync(filePath);
    return md5FromBuffer(buf);
}
