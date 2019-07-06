'use strict'

import * as vscode from 'vscode'
import { query, asyncRequest } from './query'
import { cache } from './cache'

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text = 'Loading Snippet ...'

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

function getLanguage(): string {
    let language: string = null
    let editor = vscode.window.activeTextEditor
    let configuration = vscode.workspace.getConfiguration('snippet')
    if (!editor) {
        let defaultLanguage: string = configuration['defaultLanguage']
        if (!defaultLanguage || !defaultLanguage.trim() || !configuration.openInNewEditor) {
            vscode.window.showErrorMessage('There is no open editor window');
            return
        }
        language = defaultLanguage
    } else {
        language = editor.document.languageId
    }
    return language
}

async function find() {
    let configuration = vscode.workspace.getConfiguration('snippet')
    let verbose: boolean = configuration["verbose"]
    let openInNewEditor: boolean = configuration["openInNewEditor"]
    let language = getLanguage()
    let response = await query(language, verbose)
    insertText(response.data, language, openInNewEditor)
}

async function findInplace() {
    let configuration = vscode.workspace.getConfiguration('snippet')
    let verbose: boolean = configuration["verbose"]
    let language = getLanguage()
    let response = await query(language, verbose)
    insertText(response.data, language, false)
}

async function findInNewEditor() {
    let configuration = vscode.workspace.getConfiguration('snippet')
    let verbose: boolean = configuration["verbose"]
    let language = getLanguage()
    let response = await query(language, verbose)
    insertText(response.data, language, true)
}

async function showNextAnswer() {
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
    let response = await asyncRequest(currQuery, currNum, verbose, language)
    insertText(response.data, language, openInNewEditor)
}

async function showPreviousAnswer() {
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

    let response = await asyncRequest(currQuery, currNum, verbose, language)
    insertText(response.data, language, openInNewEditor)
}

async function toggleComments() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }

    let language = editor.document.languageId

    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]
    verboseState = !verboseState

    let response = await asyncRequest(currQuery, currNum, verboseState, language)
    insertText(response.data, language, openInNewEditor)
}

async function findSelectedText() {
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

    let response = await asyncRequest(query, 0, verbose, language)
    insertText(response.data, language, openInNewEditor)
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