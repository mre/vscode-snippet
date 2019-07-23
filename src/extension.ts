'use strict'

import * as vscode from 'vscode'
import { getLanguage, getConfig } from './config'
import { cache } from './cache'
import { query } from './query'
import { Snippet } from './snippet'

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text = `$(clock) Loading Snippet ...`

let snippet = new Snippet()

export function activate(ctx: vscode.ExtensionContext) {
    cache.state = ctx.globalState

    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.find', findDefault))
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

async function find() {
    let language = await getLanguage()
    let userQuery = await query(language)
    loadingStatus.show()
    let response = await snippet.load(language, userQuery, 0)
    loadingStatus.hide()
    return response
}

async function findDefault() {
    let response = await find()
    showSnippet(response.data, response.language, getConfig("openInNewEditor"))
}

async function findInplace() {
    let response = await find()
    showSnippet(response.data, response.language, false)
}

async function findInNewEditor() {
    let response = await find()
    showSnippet(response.data, response.language, true)
}

async function showNextAnswer() {
    if (!snippet.getCurrentQuery()) {
        return await findDefault()
    }
    loadingStatus.show()
    let response = await snippet.loadNext()
    loadingStatus.hide()
    showSnippet(response.data, await getLanguage(), false)
}

async function showPreviousAnswer() {
    if (!snippet.getCurrentQuery()) {
        return await findDefault()
    }
    loadingStatus.show()
    snippet.loadPrevious().then((res) => {
        showSnippet(res.data, res.language, false)
    }).catch((err) => {
        vscode.window.showInformationMessage(err)
    });
    loadingStatus.hide()
}

async function toggleComments() {
    snippet.toggleVerbose()
    loadingStatus.show()
    let response = await snippet.load()
    loadingStatus.hide()
    showSnippet(response.data, await getLanguage(), false)
}

async function findSelectedText() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }
    let selection = editor.selection;
    let query = editor.document.getText(selection);
    let language = await getLanguage()
    loadingStatus.show()
    let response = await snippet.load(language, query, 0)
    loadingStatus.hide()
    showSnippet(response.data, language, getConfig("openInNewEditor"))
}

async function newDocument(language, content) {
    let document = await vscode.workspace.openTextDocument({ language, content })
    let column = vscode.ViewColumn.Two
    if (!vscode.ViewColumn) {
        column = vscode.ViewColumn.One
    }
    vscode.window.showTextDocument(document, column)
}

async function showSnippet(content: string, language: string, openInNewEditor = true) {
    if (openInNewEditor) {
        newDocument(language, content)
        return
    }

    let editor = vscode.window.activeTextEditor
    if (!editor) {
        newDocument(language, content)
    }

    if (openInNewEditor) {
        editor.edit(
            edit => editor.selections.forEach(
                selection => {
                    edit.insert(selection.end, "\n" + content);
                }
            )
        );
    } else {
        // Replace the old contents of the current editor window.
        // This should be improved since we use a range over all lines of the document
        // rather than replacing the entire document of the editor.
        let lineCount = editor.document.lineCount
        editor.edit(
            edit => edit.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(lineCount, 10000)), content)
        );
    }
}