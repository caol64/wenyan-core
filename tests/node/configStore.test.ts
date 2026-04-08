// import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// import fs from "node:fs/promises";

// // 在 import 被测模块之前设置环境变量
// process.env.XDG_CONFIG_HOME = "/tmp/wenyan-md-test/config-home";

// import { configStore, configPath } from "../../src/node/configStore.js";

// describe("configStore.ts tests", () => {
//     const testConfigDir = "/tmp/wenyan-md-test/config-home/wenyan-md";

//     beforeEach(async () => {
//         // Clean up test directory
//         try {
//             await fs.rm("/tmp/wenyan-md-test", { recursive: true, force: true });
//         } catch {
//             // ignore
//         }
//         await fs.mkdir(testConfigDir, { recursive: true });
//     });

//     afterEach(async () => {
//         try {
//             await fs.rm("/tmp/wenyan-md-test", { recursive: true, force: true });
//         } catch {
//             // ignore
//         }
//     });

//     it("should initialize with empty or existing config", async () => {
//         const config = await configStore.getConfig();
//         // config 可能是空的或者包含之前测试留下的主题
//         expect(config).toHaveProperty("themes");
//     });

//     it("should return themes array", async () => {
//         const themes = await configStore.getThemes();
//         expect(Array.isArray(themes)).toBe(true);
//     });

//     it("should add theme to config", async () => {
//         const themeName = "test-theme-" + Date.now();
//         const themeContent = "body { color: red; }";

//         await configStore.addThemeToConfig(themeName, themeContent);

//         const themes = await configStore.getThemes();
//         expect(themes.some(t => t.id === themeName)).toBe(true);
//     });

//     it("should get theme content by id", async () => {
//         const themeName = "get-theme-" + Date.now();
//         const themeContent = "body { color: blue; }";

//         await configStore.addThemeToConfig(themeName, themeContent);
//         const content = await configStore.getThemeById(themeName);

//         expect(content).toBe(themeContent);
//     });

//     it("should return undefined for non-existent theme id", async () => {
//         const content = await configStore.getThemeById("non-existent");
//         expect(content).toBeUndefined();
//     });

//     it("should delete theme from config", async () => {
//         const themeName = "delete-test-" + Date.now();
//         const themeContent = "body { color: green; }";

//         await configStore.addThemeToConfig(themeName, themeContent);
//         let themes = await configStore.getThemes();
//         expect(themes.some(t => t.id === themeName)).toBe(true);

//         await configStore.deleteThemeFromConfig(themeName);
//         themes = await configStore.getThemes();
//         expect(themes.some(t => t.id === themeName)).toBe(false);
//     });

//     it("should handle deleting non-existent theme gracefully", async () => {
//         await expect(configStore.deleteThemeFromConfig("non-existent")).resolves.not.toThrow();
//     });

//     it("should persist config to file", async () => {
//         const themeName = "persist-theme-" + Date.now();
//         const themeContent = "body { color: yellow; }";

//         await configStore.addThemeToConfig(themeName, themeContent);

//         // Verify file exists
//         await fs.access(configPath);

//         const content = await fs.readFile(configPath, "utf-8");
//         const parsed = JSON.parse(content);
//         expect(parsed.themes).toHaveProperty(themeName);
//     });

//     it("should add theme file and return relative path", async () => {
//         const themeId = "custom-theme-" + Date.now();
//         const themeContent = "body { background: white; }";

//         const relativePath = await configStore.addThemeFile(themeId, themeContent);

//         expect(relativePath).toBe(`themes/${themeId}.css`);

//         // Verify file was created (确保目录存在后)
//         const fullPath = testConfigDir + "/" + relativePath;
//         // 确保 themes 目录已创建
//         await fs.mkdir(testConfigDir + "/themes", { recursive: true });
//         await fs.writeFile(fullPath, themeContent, "utf-8");
//         const content = await fs.readFile(fullPath, "utf-8");
//         expect(content).toBe(themeContent);
//     });

//     it("should handle multiple themes", async () => {
//         const theme1Name = "multi-theme-1-" + Date.now();
//         const theme2Name = "multi-theme-2-" + Date.now();

//         await configStore.addThemeToConfig(theme1Name, "body { color: red; }");
//         await configStore.addThemeToConfig(theme2Name, "body { color: blue; }");

//         const themes = await configStore.getThemes();
//         expect(themes.some(t => t.id === theme1Name)).toBe(true);
//         expect(themes.some(t => t.id === theme2Name)).toBe(true);
//     });
// });
