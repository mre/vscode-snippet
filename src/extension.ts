'use strict'

import * as vscode from 'vscode'
import { getLanguage, getConfig } from './config'
import { cache } from './cache'
import { query } from './query'
import { Snippet } from './snippet'

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text = 'Loading Snippet ...'

let snippet = new Snippet()

export function activate(ctx: vscode.ExtensionContext) {
    cache.state = ctx.globalState

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

async function find() {
    let language = await getLanguage()
    let q = await query(language)
    loadingStatus.show()
    let response = await snippet.load(language, q, 0)
    loadingStatus.hide()
    showSnippet(response.data, response.language, getConfig("openInNewEditor"))
}

async function findInplace() {
    let language = await getLanguage()
    let q = await query(language)
    loadingStatus.show()
    let response = await snippet.load(language, q, 0)
    loadingStatus.hide()
    showSnippet(response.data, response.language, false)
}

async function findInNewEditor() {
    let language = await getLanguage()
    let q = await query(language)
    loadingStatus.show()
    let response = await snippet.load(language, q, 0)
    loadingStatus.hide()
    showSnippet(response.data, response.language, true)
}

async function showNextAnswer() {
    if (!snippet.getCurrentQuery()) {
        await find()
        return
    }
    loadingStatus.show()
    let response = await snippet.loadNext()
    loadingStatus.hide()
    showSnippet(response.data, await getLanguage(), getConfig("openInNewEditor"))
}

async function showPreviousAnswer() {
    if (!snippet.getCurrentQuery()) {
        await find()
        return
    }
    loadingStatus.show()
    snippet.loadPrevious().then((res) => {
        showSnippet(res.data, res.language, getConfig("openInNewEditor"))
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
    showSnippet(response.data, await getLanguage(), getConfig("openInNewEditor"))
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

async function showSnippet(content: string, language: string, openInNewEditor = true) {
    if (openInNewEditor) {
        let document = await vscode.workspace.openTextDocument({ language, content })
        vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
        return
    }

    let editor = vscode.window.activeTextEditor
    if (!editor) {
        let document = await vscode.workspace.openTextDocument({ language, content })
        vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
    }
    editor.edit(
        edit => editor.selections.forEach(
            selection => {
                edit.insert(selection.end, "\n" + content);
            }
        )
    );
}