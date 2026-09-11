/**
 * Completion in `luaut.config.json`.
 *
 * The JSON schema already offers the options and their documentation. What it
 * cannot know is which type libraries a project has: inside `"types": [...]`
 * this suggests every `@luaut/*` package installed in `node_modules` above the
 * config, and the official ones that are not installed yet, with the command
 * that installs them.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import * as vscode from "vscode"

/** Libraries worth suggesting even before they are installed. */
const KNOWN: Record<string, string> = {
    roblox: "The whole Roblox API: every class, enum, data type and global",
    luau: "The Luau standard library (roblox brings it along)",
}

export function registerConfigCompletion(): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(
        [{ pattern: "**/luaut.config.json" }, { pattern: "**/luaut.config.jsonc" }],
        {
            provideCompletionItems(document, position) {
                const text = document.getText()
                const offset = document.offsetAt(position)
                const array = typesArray(text, offset)
                if (!array) return undefined

                const inString = (text.slice(array.start, offset).match(/"/g)?.length ?? 0) % 2 === 1
                const listed = new Set([...text.slice(array.start, array.end).matchAll(/"([^"]*)"/g)].map(m => m[1]))
                const installed = installedLibraries(dirname(document.uri.fsPath))

                const items: vscode.CompletionItem[] = []
                const names = new Set([...installed.keys(), ...Object.keys(KNOWN)])
                for (const name of names) {
                    if (listed.has(name)) continue
                    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Module)
                    const description = installed.get(name)
                    if (description !== undefined) {
                        item.detail = `@luaut/${name}`
                        item.documentation = description || KNOWN[name]
                        item.sortText = `0${name}`
                    } else {
                        item.detail = `@luaut/${name} — not installed`
                        item.documentation = new vscode.MarkdownString(`${KNOWN[name]}\n\n\`npm i -D @luaut/${name}\``)
                        item.sortText = `1${name}`
                    }
                    item.insertText = inString ? name : `"${name}"`
                    items.push(item)
                }
                return items
            },
        },
        '"',
    )
}

/** Where the `"types": [ ... ]` holding `offset` is, if any. */
function typesArray(text: string, offset: number): { start: number; end: number } | undefined {
    for (const match of text.matchAll(/"types"\s*:\s*\[/g)) {
        const start = match.index! + match[0].length
        const close = text.indexOf("]", start)
        const end = close < 0 ? text.length : close
        if (offset >= start && offset <= end) return { start, end }
    }
    return undefined
}

/** `@luaut/*` packages in `node_modules` folders from `directory` upward,
 *  by name, with their descriptions. */
function installedLibraries(directory: string): Map<string, string> {
    const found = new Map<string, string>()
    for (let dir = directory; ; dir = dirname(dir)) {
        const scope = join(dir, "node_modules", "@luaut")
        if (existsSync(scope)) {
            for (const name of readdirSync(scope)) {
                if (found.has(name)) continue
                let description = ""
                try {
                    description = JSON.parse(readFileSync(join(scope, name, "package.json"), "utf8")).description ?? ""
                } catch {
                    // A folder without a readable manifest is still a candidate.
                }
                found.set(name, description)
            }
        }
        if (dirname(dir) === dir) return found
    }
}
