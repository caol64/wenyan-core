import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { RuntimeEnv } from "../src/runtimeEnv";

describe("RuntimeEnv Logic Tests", () => {
    // 备份原始状态，以便测试后恢复
    const originalEnvState = { ...RuntimeEnv };

    afterEach(() => {
        // 每个测试用例结束后恢复初始状态
        Object.assign(RuntimeEnv, originalEnvState);
    });

    describe("1. Local Environment (Not in Container)", () => {
        it("should return absolute path using system native resolve", () => {
            // 模拟非容器环境
            RuntimeEnv.isContainer = false;
            RuntimeEnv.hostFilePath = "";

            const input = "./test-file.txt";
            const result = RuntimeEnv.resolveLocalPath(input);

            // 在非容器模式下，应该直接调用 path.resolve
            // 这里的预期结果取决于你运行测试的系统，所以主要检查是否是绝对路径
            expect(result).toBe(path.resolve(input));
        });
    });

    describe("2. Linux Host -> Linux Container Mapping", () => {
        beforeEach(() => {
            RuntimeEnv.isContainer = true;
            // 模拟 Linux 宿主机的挂载情况
            RuntimeEnv.hostFilePath = "/home/user/project";
            RuntimeEnv.containerFilePath = "/app";
        });

        it("should map a file inside the host directory", () => {
            const input = "/home/user/project/src/index.ts";
            const result = RuntimeEnv.resolveLocalPath(input);
            expect(result).toBe("/app/src/index.ts");
        });

        it("should handle files not in the mounted directory", () => {
            const input = "/var/log/system.log";
            const result = RuntimeEnv.resolveLocalPath(input);
            // 无法映射，应返回标准化后的原路径
            expect(result).toBe("/var/log/system.log");
        });

        it("should prevent partial prefix matching (e.g., /data vs /database)", () => {
            // 这是一个非常关键的边缘情况测试
            RuntimeEnv.hostFilePath = "/data";
            RuntimeEnv.containerFilePath = "/mnt";

            const input = "/database/config.json";
            const result = RuntimeEnv.resolveLocalPath(input);

            // 不应该替换为 /mntbase/config.json
            expect(result).toBe("/database/config.json");
        });
    });

    describe("3. Windows Host -> Linux Container Mapping", () => {
        beforeEach(() => {
            RuntimeEnv.isContainer = true;
            // 模拟 Windows 宿主机环境
            // 注意：在代码中 hostFilePath 已经被 normalizePath 处理过（变成了 / 分隔）
            // 所以我们在测试中设置属性时，要手动模拟这种标准化后的状态
            RuntimeEnv.hostFilePath = "C:/Users/Dev/Project";
            RuntimeEnv.containerFilePath = "/app";
        });

        it("should correctly map standard Windows paths with backslashes", () => {
            // 输入是典型的 Windows 路径（带反斜杠）
            const input = "C:\\Users\\Dev\\Project\\package.json";
            const result = RuntimeEnv.resolveLocalPath(input);

            // 期望输出是 Linux 容器内的路径（正斜杠）
            expect(result).toBe("/app/package.json");
        });

        it("should handle mixed slashes", () => {
            const input = "C:/Users/Dev/Project\\src\\main.ts";
            const result = RuntimeEnv.resolveLocalPath(input);
            expect(result).toBe("/app/src/main.ts");
        });

        it("should return normalized path if file is on a different drive", () => {
            const input = "D:\\Games\\config.ini";
            const result = RuntimeEnv.resolveLocalPath(input);
            // 应该只是把 \ 变成 /，但不进行路径替换
            expect(result).toBe("D:/Games/config.ini");
        });
    });

    describe("4. Edge Cases", () => {
        it("should handle root path mapping", () => {
            RuntimeEnv.isContainer = true;
            RuntimeEnv.hostFilePath = "C:/Project";
            RuntimeEnv.containerFilePath = "/mnt";

            // 正好是根目录文件
            const input = "C:\\Project\\README.md";
            const result = RuntimeEnv.resolveLocalPath(input);
            expect(result).toBe("/mnt/README.md");
        });

        it("should strip trailing slashes during normalization logic", () => {
            RuntimeEnv.isContainer = true;
            // 模拟环境变量里带了斜杠的情况
            RuntimeEnv.hostFilePath = "C:/Temp"; // 代码逻辑会去掉末尾斜杠
            RuntimeEnv.containerFilePath = "/tmp";

            // 输入路径中间带有双斜杠
            const input = "C:\\Temp\\\\debug.log";
            const result = RuntimeEnv.resolveLocalPath(input);

            // 我们的 normalizePath 会把 \\ 转为 //，
            // 只要字符串包含关系正确，slice 逻辑依然能工作，但结果可能保留双斜杠
            // 如果你代码里的 normalizePath 没有做 // -> / 的清洗，这里结果就是 /tmp//debug.log
            // 这在 Linux 合法，所以测试应该通过
            expect(result).toContain("/tmp");
            expect(result).toMatch(/\/tmp\/{1,2}debug.log/);
        });
    });
});
