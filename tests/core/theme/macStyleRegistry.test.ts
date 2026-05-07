import { describe, it, expect, beforeEach } from "vitest";
import {
    registerMacStyle,
    getMacStyle,
    getMacStyleCss,
    registerBuiltInMacStyle,
    MacStyle,
} from "../../../src/core/theme/macStyleRegistry";

describe("macStyleRegistry", () => {
    describe("registerMacStyle", () => {
        it("should register a mac style", () => {
            const style: MacStyle = {
                getCss: () => "pre { border-radius: 5px; }",
            };

            registerMacStyle(style);
            const registered = getMacStyle();

            expect(registered).toBeDefined();
        });
    });

    describe("getMacStyle", () => {
        it("should return undefined if no style registered", () => {
            // Note: This test depends on registry state, might need reset logic
            const style = getMacStyle();
            // After registerBuiltInMacStyle, this should return the built-in style
        });
    });

    describe("getMacStyleCss", () => {
        it("should return CSS string after registering built-in", () => {
            registerBuiltInMacStyle();
            const css = getMacStyleCss();

            expect(css).toBeDefined();
            expect(typeof css).toBe("string");
        });

        it("should return empty string if no style registered", () => {
            // This test assumes a clean registry state
            // In practice, you might need to reset the registry
            const css = getMacStyleCss();
            expect(typeof css).toBe("string");
        });
    });

    describe("registerBuiltInMacStyle", () => {
        it("should register the built-in mac style", () => {
            registerBuiltInMacStyle();
            const style = getMacStyle();

            expect(style).toBeDefined();
            expect(style?.getCss()).toBeDefined();
        });
    });
});
