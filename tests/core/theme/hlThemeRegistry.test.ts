import { describe, it, expect, beforeEach } from "vitest";
import {
    registerHlTheme,
    getHlTheme,
    getAllHlThemes,
    registerBuiltInHlThemes,
    HlTheme,
} from "../../../src/core/theme/hlThemeRegistry";

describe("hlThemeRegistry", () => {

    describe("registerHlTheme", () => {
        it("should register a theme", () => {
            const theme: HlTheme = {
                id: "test-theme",
                getCss: async () => ".hljs { color: black; }",
            };

            registerHlTheme(theme);
            const registered = getHlTheme("test-theme");

            expect(registered).toBeDefined();
            expect(registered?.id).toBe("test-theme");
        });
    });

    describe("getHlTheme", () => {
        it("should return undefined for non-existent theme", () => {
            const theme = getHlTheme("non-existent-theme");
            expect(theme).toBeUndefined();
        });

        it("should return registered theme", async () => {
            const theme: HlTheme = {
                id: "custom-hl-theme",
                getCss: async () => ".hljs { background: #f5f5f5; }",
            };

            registerHlTheme(theme);
            const registered = getHlTheme("custom-hl-theme");

            expect(registered).toBeDefined();
            expect(await registered?.getCss()).toContain("background: #f5f5f5;");
        });
    });

    describe("getAllHlThemes", () => {
        it("should return array of themes", () => {
            const themes = getAllHlThemes();
            expect(Array.isArray(themes)).toBe(true);
        });
    });
});
