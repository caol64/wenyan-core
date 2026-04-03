import { describe, it, expect, beforeEach } from "vitest";
import {
    registerTheme,
    getTheme,
    getAllThemes,
    getAllGzhThemes,
    registerAllBuiltInThemes,
    Theme,
    ThemeMeta,
} from "../../../src/core/theme/themeRegistry";

describe("themeRegistry", () => {
    beforeEach(() => {
        // Register all built-in themes before each test
        registerAllBuiltInThemes();
    });
    describe("registerTheme", () => {
        it("should register a theme", () => {
            const meta: ThemeMeta = {
                id: "test-theme",
                name: "Test Theme",
                description: "A test theme",
                appName: "Test",
                author: "Tester",
            };

            const theme: Theme = {
                meta,
                getCss: async () => "#wenyan { color: black; }",
            };

            registerTheme(theme);
            const registered = getTheme("test-theme");

            expect(registered).toBeDefined();
            expect(registered?.meta.id).toBe("test-theme");
        });
    });

    describe("getTheme", () => {
        it("should return undefined for non-existent theme", () => {
            const theme = getTheme("non-existent-theme");
            expect(theme).toBeUndefined();
        });

        it("should return registered theme", async () => {
            const meta: ThemeMeta = {
                id: "custom-theme",
                name: "Custom Theme",
                description: "A custom theme",
                appName: "Custom",
                author: "Custom Author",
            };

            const theme: Theme = {
                meta,
                getCss: async () => "#wenyan { background: #fff; }",
            };

            registerTheme(theme);
            const registered = getTheme("custom-theme");

            expect(registered).toBeDefined();
            expect(registered?.meta.name).toBe("Custom Theme");
            expect(await registered?.getCss()).toContain("background: #fff;");
        });
    });

    describe("getAllThemes", () => {
        it("should return array of themes", () => {
            const themes = getAllThemes();
            expect(Array.isArray(themes)).toBe(true);
        });

        it("should include all registered themes", () => {
            const themes = getAllThemes();

            expect(themes.length).toBeGreaterThan(0);
        });
    });

    describe("getAllGzhThemes", () => {
        it("should return array of GZH themes", () => {
            const themes = getAllGzhThemes();

            expect(Array.isArray(themes)).toBe(true);
            expect(themes.length).toBeGreaterThan(0);
        });

        it("should include phycat theme", () => {
            const themes = getAllGzhThemes();

            const phycatTheme = themes.find((t) => t.meta.id === "phycat");
            expect(phycatTheme).toBeDefined();
            expect(phycatTheme?.meta.name).toBe("Phycat");
        });

        it("should include default theme", () => {
            const themes = getAllGzhThemes();

            const defaultTheme = themes.find((t) => t.meta.id === "default");
            expect(defaultTheme).toBeDefined();
        });
    });

    describe("registerAllBuiltInThemes", () => {
        it("should register all built-in themes", () => {
            const themes = getAllThemes();

            expect(themes.length).toBeGreaterThan(0);

            // Check some known themes
            const themeIds = themes.map((t) => t.meta.id);
            expect(themeIds).toContain("default");
            expect(themeIds).toContain("phycat");
        });
    });
});
