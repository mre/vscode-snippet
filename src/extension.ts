'use strict'
import * as cp from 'child_process'
import * as http from 'http'
import * as vscode from 'vscode'

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.find', find))
}

function find() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        return
    }

    // let workspaceRoot = vscode.workspace.rootPath
    // let filename = editor.document.uri.fsPath.substr(workspaceRoot.length +
    // 1)


    vscode.window.showInputBox()
        .then(query => {
            asyncRequest(query, function (data) {
                insertText(editor, data)
            })
        });
}

var requestCache = new Object()
function asyncRequest(queryRaw: string, callback: (data: string) => void) {
    let query = encodeURI(queryRaw.replace(" ", "+").replace("\t", "+"))

    let data = requestCache[query]
    if (data) {
        callback(data)
        return
    }

    console.log(`asyncRequest: ${query}`)

    let language = vscode.window.activeTextEditor.document.languageId
    http.get({
        'host': 'cht.sh',
        'path': `/${language}/${query}?qT&style=bw`,
        // Fake user agent to get plain-text output.
        // See https://github.com/chubin/cheat.sh/blob/1e21d96d065b6cce7d198c1a3edba89081c78a0b/bin/srv.py#L47
        'headers': {
            'User-Agent': 'curl/7.43.0'
        }
    }, function (message) {
        let data = ""

        message.on("data", function (chunk) {
            data += chunk
        })

        message.on("end", function () {
            requestCache[query] = data
            callback(data)
        })
    }).on("error", function (err) {
        vscode.window.showInformationMessage(err.message)
    })
}

function insertText(editor: vscode.TextEditor, data: string) {
    editor.edit(
        edit => editor.selections.forEach(
            selection => {
                edit.delete(selection);
                edit.insert(selection.start, data);
            }
        )
    );
}