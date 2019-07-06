'use strict'
import * as cp from 'child_process'
import * as http from 'http'
import * as vscode from 'vscode'
import * as HttpProxyAgent from 'http-proxy-agent'

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text = 'Loading Snippet ...'

const cache = {
    state: <vscode.Memento>null
}

// Query string that was executed (not escaped)
var currQuery = null
// Answer number that was shown
var currNum = 0
// Current state of comments (for toggleComments)
var verboseState = true

export function activate(ctx: vscode.ExtensionContext) {
    cache.state = ctx.globalState

    // Required for toggleComments
    let configuration = vscode.workspace.getConfiguration('snippet')
    verboseState = configuration["verbose"]

    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.find', find))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findInplace', findInplace))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findInNewEditor', findInNewEditor))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findSelectedText', findSelectedText))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.showPreviousAnswer', showPreviousAnswer))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.showNextAnswer', showNextAnswer))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.toggleComments', toggleComments))
}

function find() {
    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]
    query(openInNewEditor)
}

function query(openInNewEditor: boolean) {
    let language: string = null
    let editor = vscode.window.activeTextEditor
    let configuration = vscode.workspace.getConfiguration('snippet')
    if (!editor) {
        let defaultLanguage: string = configuration['defaultLanguage']
        if (!defaultLanguage || /^\s+$/i.test(defaultLanguage) || !openInNewEditor) {
            vscode.window.showErrorMessage('There is no open editor window');
            return
        }
        language = defaultLanguage
    } else {
        language = editor.document.languageId
    }

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

    let window = vscode.window
    const quickPick = (<any>window).createQuickPick()
    quickPick.items = suggestionsQuickItems
    quickPick.onDidChangeValue(() => {
        quickPick.activeItems = []
    })

    let verbose: boolean = configuration["verbose"]

    quickPick.onDidAccept(() => {
        if (quickPick.activeItems.length) {
            asyncRequest(quickPick.activeItems[0]['label'], 0, verbose, language, function (data) {
                insertText(data, language, openInNewEditor)
            })
        } else {
            asyncRequest(quickPick.value, 0, verbose, language, function (data) {
                insertText(data, language, openInNewEditor)
            })
        }
        quickPick.hide()
        quickPick.dispose()
    })
    quickPick.show()
}

function findInplace() {
    query(false)
}

function findInNewEditor() {
    query(true)
}

function showNextAnswer() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }

    let language = editor.document.languageId

    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]

    currNum += 1;

    let verbose: boolean = configuration["verbose"]
    asyncRequest(currQuery, currNum, verbose, language, function (data) {
        insertText(data, language, openInNewEditor)
    })
}

function showPreviousAnswer() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }

    let language = editor.document.languageId

    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]

    if (currNum > 0) {
        currNum -= 1;
    }
    let verbose: boolean = configuration["verbose"]

    asyncRequest(currQuery, currNum, verbose, language, function (data) {
        insertText(data, language, openInNewEditor)
    })
}

function toggleComments() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }

    let language = editor.document.languageId

    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]
    verboseState = !verboseState

    asyncRequest(currQuery, currNum, verboseState, language, function (data) {
        insertText(data, language, openInNewEditor)
    })
}

function findSelectedText() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }

    let language = editor.document.languageId

    let selection = editor.selection;
    let query = editor.document.getText(selection);

    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]
    let verbose: boolean = configuration["verbose"]

    asyncRequest(query, 0, verbose, language, function (data) {
        insertText(data, language, openInNewEditor)
    })
}


var requestCache = new Object()
function asyncRequest(queryRaw: string, num: number, verbose: boolean, language: string, callback: (data: string) => void) {

    currQuery = queryRaw
    currNum = num

    loadingStatus.show()

    try {
        let query = encodeURI(queryRaw.replace(/ /g, '+'))
    } catch (TypeError) {
        loadingStatus.hide()
        return
    }

    let query = encodeURI(queryRaw.replace(/ /g, '+'))

    let configuration = vscode.workspace.getConfiguration('snippet')
    let params = "QT"
    if (verbose) {
        params = "qT"
    }

    let baseUrl: String = configuration["baseUrl"]

    let path = `/vscode:${language}/${query}/${num}?${params}&style=bw`;

    let data = requestCache[path]
    if (data) {
        loadingStatus.hide()
        callback(data)
        return
    }

    console.log(`asyncRequest: ${query}`)

    let opts = {
        'host': baseUrl,
        'path': path,
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

    http.get(opts, function (message) {
        let data = ""

        message.on("data", function (chunk) {
            data += chunk
        })

        message.on("end", function () {
            requestCache[path] = data
            let cacheData = cache.state.get(`snippet_${language}`)
            if (query !== undefined && query !== '') {
                if (!cacheData[queryRaw]) {
                    cacheData[queryRaw] = queryRaw
                    cache.state.update(`snippet_${language}`, cacheData)
                }
            }
            loadingStatus.hide()
            callback(data)
        })
    }).on("error", function (err) {
        vscode.window.showInformationMessage(err.message)
    })
}

function insertText(content: string, language: string, openInNewEditor = true) {

    if (openInNewEditor) {
        vscode.workspace.openTextDocument({ language, content }).then(
            document => vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
        )
    }
    else {
        let editor = vscode.window.activeTextEditor
        if (!editor) {
            let configuration = vscode.workspace.getConfiguration('snippet')
            let defaultLanguage = configuration['defaultLanguage']
            if (!defaultLanguage || defaultLanguage != language) {
                vscode.window.showErrorMessage('There is no open editor window');
                return;
            } else {
                vscode.workspace.openTextDocument({ language, content }).then(
                    document => vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
                )
            }
        }
        editor.edit(
            edit => editor.selections.forEach(
                selection => {
                    edit.insert(selection.end, "\n" + content);
                }
            )
        );
    }
}