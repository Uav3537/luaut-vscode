# luaut for VS Code

Thin client for `luaut-language-server`. It starts the server and gets out of
the way — every feature is the server's, so anything
you see here works the same in Neovim, Zed or any other LSP client.

The server is **bundled into the extension** (`dist/server.cjs`, built from
the `luaut-language-server` package), so a packaged `.vsix` is
self-contained: no npm install on the user's machine, no path to configure.

While the server is not on npm yet, it is linked from the checkout next door
(`file:../luaut-language-server`) — swap that for a version range once it is
published. `npm run build:linked` rebuilds the server first; plain
`npm run build` assumes it is already built.

## Three ways to run it

### 1. Develop it — F5

```bash
npm install
npm run build:linked   # rebuild the linked server, then the extension
```

Open **this folder** in VS Code and press <kbd>F5</kbd>. A second window opens
on `sample/`, with `hello.luaut` to poke at: hover a name, ctrl-click it, type
`part.`, watch the deliberate type error appear as you edit.

Changed the server? Rebuild (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>)
and run **luaut: Restart Language Server** in the dev window — no need to
restart the host. To debug the server itself, run the **Attach to server**
launch configuration while the dev window is open (port 6009).

### 2. Install it into your own VS Code

```bash
npm run package                              # -> luaut-vscode-0.1.0.vsix
code --install-extension luaut-vscode-0.1.0.vsix
```

Then reload VS Code. `code --uninstall-extension luaut.luaut-vscode` removes
it. (Or: Extensions view → `...` → **Install from VSIX…**.)

This is also the file to hand someone else — it runs anywhere without a
checkout.

### 3. Publish it to the Marketplace

One-time setup:

1. Create a publisher at <https://marketplace.visualstudio.com/manage> and put
   its **id** in `package.json` → `"publisher"` (currently `luaut`, which is
   almost certainly not yours).
2. Create an Azure DevOps personal access token — <https://dev.azure.com> →
   User settings → Personal access tokens → **All accessible organizations**,
   scope **Marketplace ▸ Manage**.
3. `npx vsce login <publisher-id>` and paste the token.

Then, per release: bump `version`, and

```bash
npm run publish            # or: npx vsce publish minor
```

For the VS Codium / Cursor / Gitpod side, publish the same `.vsix` to
[Open VSX](https://open-vsx.org): `npx ovsx publish luaut-vscode-0.1.0.vsix -p <token>`.

Before the first publish, add a `LICENSE` file (vsce warns without one) and,
if you want the listing to look finished, a 128×128 `icon`.

## Settings

| setting | what it does |
|---|---|
| `luaut.server.path` | absolute path to a `cli.js`/`server.cjs` to use instead of the bundled server |
| `luaut.trace.server` | `messages` / `verbose` logs LSP traffic to the **luaut** output channel |

## What is in here

- `src/extension.ts` — locate the server, start it, register the restart command
- `syntaxes/luaut.tmLanguage.json` — TextMate grammar (colours only; the
  server does the understanding)
- `language-configuration.json` — comments, brackets, indentation
- `sample/` — the folder the dev host opens
