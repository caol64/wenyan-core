import { describe, it, expect } from "vitest";
import { nodeHttpAdapter } from "../../src/node/nodeHttpAdapter.js";

describe("nodeHttpAdapter.ts tests", () => {
    describe("nodeHttpAdapter", () => {
        it("should have fetch method", () => {
            expect(nodeHttpAdapter.fetch).toBeDefined();
            expect(typeof nodeHttpAdapter.fetch).toBe("function");
        });

        it("should have createMultipart method", () => {
            expect(nodeHttpAdapter.createMultipart).toBeDefined();
            expect(typeof nodeHttpAdapter.createMultipart).toBe("function");
        });

        it("should create multipart form data with correct structure", () => {
            const field = "file";
            const file = new Blob(["test content"], { type: "text/plain" });
            const filename = "test.txt";

            const result = nodeHttpAdapter.createMultipart(field, file, filename);

            expect(result).toHaveProperty("body");
            expect(result).toHaveProperty("headers");
            expect(result).toHaveProperty("duplex", "half");
        });

        it("should include content-type header in multipart form", () => {
            const field = "image";
            const file = new Blob(["image data"], { type: "image/png" });
            const filename = "test.png";

            const result = nodeHttpAdapter.createMultipart(field, file, filename);

            expect(result.headers).toBeDefined();
            expect(result.headers).toHaveProperty("content-type");
            expect(result.headers!["content-type"]).toContain("multipart/form-data");
        });

        it("should create readable stream body", () => {
            const field = "data";
            const file = new Blob(["some data"], { type: "application/json" });
            const filename = "data.json";

            const result = nodeHttpAdapter.createMultipart(field, file, filename);

            // Body should be a readable stream or object
            expect(result.body).toBeDefined();
            expect(typeof result.body).toBe("object");
        });
    });
});
