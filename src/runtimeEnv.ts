import path from "path";

/**
 * 路径标准化工具函数
 * 将 Windows 的反斜杠 \ 转换为正斜杠 /，并去除末尾斜杠
 * 目的：在 Linux 容器内也能正确处理 Windows 路径字符串
 */
function normalizePath(p: string): string {
    if (!p) return "";
    let res = p.replace(/\\/g, "/");
    if (res.endsWith("/")) {
        res = res.slice(0, -1);
    }
    return res;
}

export const RuntimeEnv = {
    isContainer: !!process.env.CONTAINERIZED,

    hostFilePath: normalizePath(process.env.HOST_FILE_PATH || ""),
    containerFilePath: normalizePath(process.env.CONTAINER_FILE_PATH || "/mnt/host-downloads"),

    resolveLocalPath(inputPath: string) {
        if (!this.isContainer || !this.hostFilePath) {
            return path.resolve(inputPath);
        }

        const normalizedInput = normalizePath(inputPath);

        if (normalizedInput.startsWith(this.hostFilePath)) {
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
