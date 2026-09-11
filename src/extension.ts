/**
 * VS Code client for the luaut language server.
 *
 * The extension itself does nothing clever: it locates the server, starts it
 * as a child process, and lets `vscode-languageclient` handle the protocol.
 * Every feature lives in the server, so it works the same in any editor that
 * speaks LSP.
 */
import { existsSync } from "node:fs"
import { join } from "node:path"
import * as vscode from "vscode"
import {
    LanguageClient, TransportKind,
    type LanguageClientOptions, type ServerOptions,
} from "vscode-languageclient/node"

let client: LanguageClient | undefined

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const module = resolveServer(context)
    if (!module) {
        void vscode.window.showErrorMessage(
            "luaut: could not find the language server. Run `npm run build` in luaut-language-server, "
            + "or set `luaut.server.path`.",
        )
        return
    }

    const server: ServerOptions = {
        run: { module, transport: TransportKind.ipc },
        // The debug instance gets an inspector port, so you can attach to the
        // server itself while the extension is running.
        debug: {
            module,
            transport: TransportKind.ipc,
            options: { execArgv: ["--nolazy", "--inspect=6009"] },
        },
    }

    const options: LanguageClientOptions = {
        documentSelector: [{ scheme: "file", language: "luaut" }],
        outputChannel: vscode.window.createOutputChannel("luaut"),
        // A module, `luaut.config.json`, type library or sourcemap changed,
        // created or deleted outside the editor can change the types of every
        // file that uses it, so the server hears about all of them.
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher("**/*.{luaut,json,jsonc}"),
        },
    }

    client = new LanguageClient("luaut", "luaut Language Server", server, options)
    await client.start()

    context.subscriptions.push(
        vscode.commands.registerCommand("luaut.restartServer", async () => {
            await client?.restart()
            void vscode.window.showInformationMessage("luaut: server restarted")
        }),
    )
}

export async function deactivate(): Promise<void> {
    await client?.stop()
}

/** Where the server lives: an explicit setting wins, otherwise the copy
 *  bundled into this extension (`dist/server.cjs`, built from the server
 *  sources next door). */
function resolveServer(context: vscode.ExtensionContext): string | undefined {
    const configured = vscode.workspace.getConfiguration("luaut").get<string>("server.path")
    if (configured && existsSync(configured)) return configured

    const bundled = join(context.extensionPath, "dist", "server.cjs")
    return existsSync(bundled) ? bundled : undefined
}
