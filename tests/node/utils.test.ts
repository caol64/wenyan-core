import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
    normalizePath,
    isAbsolutePath,
    md5FromBuffer,
    safeReadJson,
    safeWriteJson,
    ensureDir,
    getNormalizeFilePath,
} from "../../src/node/utils.js";

describe("utils.ts tests", () => {
    describe("normalizePath", () => {
        it("should convert backslashes to forward slashes", () => {
            expect(normalizePath("C:\\Users\\test")).toBe("C:/Users/test");
        });

        it("should remove trailing slashes", () => {
            expect(normalizePath("/path/to/dir/")).toBe("/path/to/dir");
            expect(normalizePath("/path/to/dir///")).toBe("/path/to/dir");
        });

        it("should handle mixed slashes and trailing slashes", () => {
            expect(normalizePath("C:\\Users\\test\\")).toBe("C:/Users/test");
        });

        it("should handle empty string", () => {
            expect(normalizePath("")).toBe("");
        });

        it("should not modify already normalized paths", () => {
            expect(normalizePath("/path/to/file.txt")).toBe("/path/to/file.txt");
        });
    });

    describe("isAbsolutePath", () => {
        it("should return true for Linux absolute paths", () => {
            expect(isAbsolutePath("/usr/local/bin")).toBe(true);
        });

        it("should return true for Windows absolute paths with forward slashes", () => {
            expect(isAbsolutePath("C:/Users/test")).toBe(true);
        });

        it("should return false for Windows paths with backslashes (not supported)", () => {
            // 源码实现只匹配正斜杠，反斜杠不会被识别为绝对路径
            expect(isAbsolutePath("D:\\Games\\config")).toBe(false);
        });

        it("should return false for relative paths", () => {
            expect(isAbsolutePath("relative/path")).toBe(false);
            expect(isAbsolutePath("./current/dir")).toBe(false);
            expect(isAbsolutePath("../parent/dir")).toBe(false);
        });

        it("should return false for empty string", () => {
            expect(isAbsolutePath("")).toBe(false);
        });
    });

    describe("md5FromBuffer", () => {
        it("should generate md5 hash from buffer", () => {
            const buf = Buffer.from("hello world");
            const hash = md5FromBuffer(buf);
            expect(hash).toBe("5eb63bbbe01eeed093cb22bb8f5acdc3");
        });

        it("should generate consistent hashes for same input", () => {
            const buf1 = Buffer.from("test");
            const buf2 = Buffer.from("test");
            expect(md5FromBuffer(buf1)).toBe(md5FromBuffer(buf2));
        });

        it("should generate different hashes for different inputs", () => {
            const buf1 = Buffer.from("test1");
            const buf2 = Buffer.from("test2");
            expect(md5FromBuffer(buf1)).not.toBe(md5FromBuffer(buf2));
        });

        it("should handle empty buffer", () => {
            const buf = Buffer.from("");
            const hash = md5FromBuffer(buf);
            expect(hash).toBe("d41d8cd98f00b204e9800998ecf8427e");
        });
    });

    describe("safeReadJson", () => {
        const testFile = path.join(os.tmpdir(), "test-safe-read.json");

        afterEach(async () => {
            try {
                await fs.unlink(testFile);
            } catch {
                // ignore
            }
        });

        it("should read and parse valid JSON file", async () => {
            const testData = { key: "value", number: 42 };
            await fs.writeFile(testFile, JSON.stringify(testData), "utf-8");

            const result = await safeReadJson(testFile, {});
            expect(result).toEqual(testData);
        });

        it("should return fallback for non-existent file", async () => {
            const fallback = { default: true };
            const result = await safeReadJson("/non-existent/file.json", fallback);
            expect(result).toBe(fallback);
        });

        it("should return fallback for invalid JSON", async () => {
            await fs.writeFile(testFile, "invalid json", "utf-8");
            const fallback = { default: true };
            const result = await safeReadJson(testFile, fallback);
            expect(result).toBe(fallback);
        });
    });

    describe("safeWriteJson", () => {
        const testFile = path.join(os.tmpdir(), "test-safe-write.json");

        afterEach(async () => {
            try {
                await fs.unlink(testFile);
            } catch {
                // ignore
            }
        });

        it("should write JSON data to file", async () => {
            const testData = { name: "test", value: 123 };
            await safeWriteJson(testFile, testData);

            const content = await fs.readFile(testFile, "utf-8");
            const parsed = JSON.parse(content);
            expect(parsed).toEqual(testData);
        });

        it("should handle null data", async () => {
            await safeWriteJson(testFile, null);

            const content = await fs.readFile(testFile, "utf-8");
            const parsed = JSON.parse(content);
            // safeWriteJson 使用 data ?? {}，null 会变成 {}
            expect(parsed).toEqual({});
        });

        it("should handle undefined data", async () => {
            await safeWriteJson(testFile, undefined);

            const content = await fs.readFile(testFile, "utf-8");
            const parsed = JSON.parse(content);
            // safeWriteJson 使用 data ?? {}，undefined 会变成 {}
            expect(parsed).toEqual({});
        });

        it("should create tmp file and rename atomically", async () => {
            const testData = { atomic: true };
            await safeWriteJson(testFile, testData);

            // Verify the tmp file doesn't exist after successful write
            const tmpFile = testFile + ".tmp";
            try {
                await fs.access(tmpFile);
                throw new Error("Tmp file should not exist");
            } catch (error: any) {
                expect(error.code).toBe("ENOENT");
            }

            // Verify the main file exists
            await fs.access(testFile);
        });
    });

    describe("ensureDir", () => {
        const testDir = path.join(os.tmpdir(), "test-ensure-dir", "nested", "dir");

        afterEach(async () => {
            try {
                await fs.rm(path.join(os.tmpdir(), "test-ensure-dir"), { recursive: true, force: true });
            } catch {
                // ignore
            }
        });

        it("should create directory if it doesn't exist", async () => {
            await ensureDir(testDir);
            const stats = await fs.stat(testDir);
            expect(stats.isDirectory()).toBe(true);
        });

        it("should not throw if directory already exists", async () => {
            await ensureDir(testDir);
            await expect(ensureDir(testDir)).resolves.not.toThrow();
        });

        it("should create nested directories", async () => {
            await ensureDir(testDir);
            const stats = await fs.stat(testDir);
            expect(stats.isDirectory()).toBe(true);
        });
    });

    describe("getNormalizeFilePath", () => {
        const originalEnv = { ...process.env };

        afterEach(() => {
            process.env = { ...originalEnv };
        });

        it("should resolve path in non-container environment", () => {
            process.env.CONTAINERIZED = "";
            const inputPath = "./test/file.txt";
            const result = getNormalizeFilePath(inputPath);
            expect(path.isAbsolute(result)).toBe(true);
        });

        it("should map host path to container path in container environment", () => {
            process.env.CONTAINERIZED = "true";
            process.env.HOST_FILE_PATH = "/host/project";
            process.env.CONTAINER_FILE_PATH = "/app";

            const inputPath = "/host/project/src/index.ts";
            const result = getNormalizeFilePath(inputPath);
            expect(result).toBe("/app/src/index.ts");
        });

        it("should handle container path without host path prefix", () => {
            process.env.CONTAINERIZED = "true";
            process.env.HOST_FILE_PATH = "/host/project";
            process.env.CONTAINER_FILE_PATH = "/app";

            const inputPath = "/other/path/file.txt";
            const result = getNormalizeFilePath(inputPath);
            // Should return container path with relative part appended
            expect(result).toContain("/app");
        });
    });
});
