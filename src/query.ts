'use strict'

import * as vscode from 'vscode'
import { cache } from './cache'


function quickPickCustom(items: vscode.QuickPickItem[]): Promise<string> {
    return new Promise((resolve, _reject) => {
        let window = vscode.window
        const quickPick = (<any>window).createQuickPick()
        quickPick.title = 'Enter keywords for snippet search (e.g. "read file")'
        quickPick.items = items

        quickPick.onDidAccept(() => {
            let search = ""
            if (quickPick.activeItems.length) {
                search = quickPick.activeItems[0]['label'];
            } else {
                search = quickPick.value;
            }
            quickPick.hide()
            resolve(search)
        })
        quickPick.show()
    })
}

export async function query(language: string): Promise<string> {
    let tree = cache.state.get(`snippet_${language}`, {})
    let suggestions = []
    for (var key in tree) {
        suggestions.push(tree[key])
    }
    suggestions.sort()

    let suggestionsQuickItems: Array<vscode.QuickPickItem> = []
    let tempQuickItem: vscode.QuickPickItem = null
    for (var key in suggestions) {
        tempQuickItem = { description: '', label: suggestions[key] }
        suggestionsQuickItems.push(tempQuickItem)
    }
    let pick = await quickPickCustom(suggestionsQuickItems)
    tree[pick] = pick
    cache.state.update(`snippet_${language}`, tree)
    return pick
}
