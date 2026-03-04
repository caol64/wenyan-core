import path from "node:path";
import { isAbsolutePath, normalizePath } from "./utils.js";

export const RuntimeEnv = {
    isContainer: !!process.env.CONTAINERIZED,

    hostFilePath: normalizePath(process.env.HOST_FILE_PATH || ""),
    containerFilePath: normalizePath(process.env.CONTAINER_FILE_PATH || "/mnt/host-downloads"),

    resolveLocalPath(inputPath: string, relativeBase?: string) {
        if (!this.isContainer) {
            // 非容器环境，基于path模块处理路径
            if (relativeBase) {
                // 情况 A：提供了基准目录，利用 resolve 拼接并规范化（处理 ../ 等）
                return path.resolve(relativeBase, inputPath);
            } else {
                // 情况 B：没有提供基准目录，必须强制 inputPath 是绝对路径
                if (!path.isAbsolute(inputPath)) {
                    throw new Error(
                        `Invalid input: '${inputPath}'. InputPath must be an absolute path.`
                    );
                }
                // 规范化绝对路径（消除中间的 /./ 或 /../）
                return path.normalize(inputPath);
            }
        }

        // 容器环境，基于normalizePath函数处理路径
        let normalizedInput = normalizePath(inputPath);
        relativeBase = normalizePath(relativeBase || "");
        if (relativeBase) {
            if (!isAbsolutePath(normalizedInput)) {
                normalizedInput = relativeBase + (normalizedInput.startsWith("/") ? "" : "/") + normalizedInput;
            }
        } else {
            if (!isAbsolutePath(normalizedInput)) {
                throw new Error(
                    `Invalid input: '${inputPath}'. InputPath must be an absolute path.`
                );
            }
        }

        if (this.hostFilePath && normalizedInput.startsWith(this.hostFilePath)) {
            let relativePart = normalizedInput.slice(this.hostFilePath.length);

            if (relativePart && !relativePart.startsWith("/")) {
                return normalizedInput;
            }

            if (!relativePart.startsWith("/")) {
                relativePart = "/" + relativePart;
            }

            return this.containerFilePath + relativePart;
        }

        return normalizedInput;
    },
};
