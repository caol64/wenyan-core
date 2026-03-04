import { describe, it, expect } from "vitest";
import { getAllGzhThemes, getAllThemes, getTheme, registerAllBuiltInThemes, registerTheme } from "../dist/core";

describe("core tests", () => {
    it("should return getAllGzhThemes", async () => {
        registerAllBuiltInThemes();
        const themes = getAllGzhThemes();

        expect(themes).toContainEqual(
            expect.objectContaining({
                meta: expect.objectContaining({
                    id: "phycat",
                }),
            }),
        );
    });

    it("should add new theme", async () => {
        registerAllBuiltInThemes();
        registerTheme({
            meta: {
                id: "custom_theme",
                name: "Custom Theme",
                description: "A custom theme for testing.",
                appName: "CustomApp",
            },
            getCss: async () => {
                return `
                body {
                    background-color: #f0f0f0;
                }
            `;
            },
        });
        const themes = getAllThemes();

        expect(themes).toContainEqual(
            expect.objectContaining({
                meta: expect.objectContaining({
                    id: "custom_theme",
                }),
            }),
        );

        const getedTheme = getTheme("custom_theme");
        expect(getedTheme).toBeDefined();
        expect(await getedTheme.getCss()).toContain("background-color: #f0f0f0;");
    });
});
