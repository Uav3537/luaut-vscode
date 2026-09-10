import { defineConfig } from "tsup";
import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

// The server comes from the `luaut-language-server` package and is bundled
// *into* the extension: a `.vsix` has to be self-contained, and the extension
// launches this file as a child process.
const server = require.resolve("luaut-language-server/server");
// Its definitions (`luau.d.luaut`, `roblox.d.luaut`) are real files that
// luaut-parser reads at load time, relative to wherever the bundle sits — so
// they have to travel with it.
const definitions = dirname(createRequire(server).resolve("luaut-parser"));

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
    // `import.meta.url` is how luaut-parser finds its definitions; in CJS the
    // shim points it at whatever directory the bundle sits in.
    shims: true,
    onSuccess: async () => {
        for (const file of ["luau.d.luaut", "roblox.d.luaut"]) {
            copyFileSync(join(definitions, file), join("dist", file));
        }
    },
});
