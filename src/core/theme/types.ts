export type CssSource =
    | { type: "inline"; css: string }
    | { type: "asset"; loader: () => Promise<string> }
    // | { type: "file"; path: string }
    | { type: "url"; url: string };
