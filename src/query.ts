'use strict'

import * as vscode from 'vscode'
import { cache } from './cache'
import { HttpProxyAgent } from 'http-proxy-agent'
import axios from 'axios';

var requestCache = new Object()

function quickPickCustom(items: vscode.QuickPickItem[]): Promise<string> {
    return new Promise((resolve, _reject) => {
        let window = vscode.window
        const quickPick = (<any>window).createQuickPick()
        quickPick.title = "Enter search keywords"
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

export async function query(language: string): Promise<any> {
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
    return quickPickCustom(suggestionsQuickItems)
}

export async function asyncRequest(queryRaw: string, num: number, verbose: boolean, language: string): Promise<any> {
    let query = encodeURI(queryRaw.replace(/ /g, '+'))

    let configuration = vscode.workspace.getConfiguration('snippet')
    let params = "QT"
    if (verbose) {
        params = "qT"
    }

    let path = `/vscode:${language}/${query}/${num}?${params}&style=bw`;
    let data = await requestCache[path]
    if (data) {
        return data;
    }

    let baseUrl: String = configuration["baseUrl"]
    let url = baseUrl + path;
    let opts = {
        // Fake user agent to get plain-text output.
        // See https://github.com/chubin/cheat.sh/blob/1e21d96d065b6cce7d198c1a3edba89081c78a0b/bin/srv.py#L47
        'headers': {
            'User-Agent': 'curl/7.43.0'
        },
    }

    // Apply proxy setting if provided
    let httpConfiguration = vscode.workspace.getConfiguration('http')
    let proxy = httpConfiguration['proxy']

    if (proxy !== '') {
        let agent = new HttpProxyAgent(proxy)
        opts['agent'] = agent
    }

    return await axios.get(url, opts)
}
