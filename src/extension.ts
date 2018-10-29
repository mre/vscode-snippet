'use strict'
import * as cp from 'child_process'
import * as http from 'http'
import * as vscode from 'vscode'
import * as HttpProxyAgent from 'http-proxy-agent'

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text =  'Loading Snippet ...'

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.find', find))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findInplace', findInplace))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findInNewEditor', findInNewEditor))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findSelectedText', findSelectedText))
}

function find() {
    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]
    query(openInNewEditor)
}

function query(openInNewEditor: boolean) {
    vscode.window.showInputBox()
        .then(query => {
            asyncRequest(query, function (data) {
                insertText(data, openInNewEditor)
            })
        });
}

function findInplace() {
    query(false)
}

function findInNewEditor() {
    query(true)
}

function findSelectedText() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }

    let selection = editor.selection;
    let query = editor.document.getText(selection);

    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]

    asyncRequest(query, function (data) {
        insertText(data, openInNewEditor)
    })
}


var requestCache = new Object()
function asyncRequest(queryRaw: string, callback: (data: string) => void) {
    loadingStatus.show()

    try {
        let query = encodeURI(queryRaw.replace(/ /g, '+'))
    } catch(TypeError) {
        loadingStatus.hide()
        return
    }
    
    let query = encodeURI(queryRaw.replace(/ /g, '+'))
    let language = vscode.window.activeTextEditor.document.languageId

    let configuration = vscode.workspace.getConfiguration('snippet')
    let verbose: boolean = configuration["verbose"]
    let params = "QT"
    if (verbose) {
        params = "qT"
    }

    let baseUrl: String = configuration["baseUrl"]

    let path = `/vscode:${language}/${query}?${params}&style=bw`;

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

    if(proxy !== ''){
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
            loadingStatus.hide()
            callback(data)
        })
    }).on("error", function (err) {
        vscode.window.showInformationMessage(err.message)
    })
}

function insertText(content: string, openInNewEditor = true) {

    if (openInNewEditor) {
        let language = vscode.window.activeTextEditor.document.languageId
        vscode.workspace.openTextDocument({ language, content }).then(
            document => vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
        )
    }
    else {
        let editor = vscode.window.activeTextEditor
        if (!editor) {
            vscode.window.showErrorMessage('There is no open editor window');
            return;
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