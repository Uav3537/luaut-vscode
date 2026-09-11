import { defineConfig } from "tsup";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// The server comes from the `luaut-language-server` package and is bundled
// *into* the extension: a `.vsix` has to be self-contained, and the extension
// launches this file as a child process. No type definitions travel with it —
// a project installs the ones it names in its `luaut.config.json`.
const server = require.resolve("luaut-language-server/server");

export default defineConfig({
    entry: { extension: "src/extension.ts", server },
    // VS Code loads extensions as CommonJS, and provides `vscode` itself.
    format: ["cjs"],
    outExtension: () => ({ js: ".cjs" }),
    // Everything is bundled except `vscode`, which the editor injects.
    // (`noExternal` wins over `external`, hence the lookahead rather than
    // listing "vscode" in both.)
    external: ["vscode"],
    noExternal: [/^(?!vscode$)/],
    platform: "node",
    target: "node18",
    sourcemap: true,
    clean: true,
    shims: true,
});
