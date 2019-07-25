import * as vscode from 'vscode'
import { getLanguage, getConfig } from './config'
import { query } from './query'
import { showSnippet } from './document'
import { Snippet } from './snippet'
import { encodeRequest } from './provider'

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text = `$(clock) Loading Snippet ...`

let snippet = new Snippet()

export async function findWithProvider() {
    let language = await getLanguage()
    let userQuery = await query(language)
    loadingStatus.show()
    if (userQuery) {
        let uri = encodeRequest(userQuery, language);

        // Calls back into the provider
        let doc = await vscode.workspace.openTextDocument(uri);
        vscode.languages.setTextDocumentLanguage(doc, language);

        let column = vscode.ViewColumn.Two
        if (!vscode.ViewColumn) {
            column = vscode.ViewColumn.One
        }
        await vscode.window.showTextDocument(doc, { viewColumn: column, preview: true });
    }
    loadingStatus.hide()
}

export async function find() {
    let language = await getLanguage()
    let userQuery = await query(language)
    loadingStatus.show()
    let response = await snippet.load(language, userQuery, 0)
    loadingStatus.hide()
    return response
}

export async function findForLanguage() {
    let language = await vscode.window.showInputBox({
        value: 'python',
        placeHolder: 'Find snippet for which programming language?',
    });
    let userQuery = await query(language)
    loadingStatus.show()
    let response = await snippet.load(language, userQuery, 0)
    loadingStatus.hide()
    showSnippet(response.data, response.language, false)
}

export async function findDefault() {
    let response = await find()
    showSnippet(response.data, response.language, getConfig("openInNewEditor"))
}

export async function findInplace() {
    let response = await find()
    showSnippet(response.data, response.language, false)
}

export async function findInNewEditor() {
    let response = await find()
    showSnippet(response.data, response.language, true)
}

export async function showNextAnswer() {
    if (!snippet.getCurrentQuery()) {
        return await findDefault()
    }
    loadingStatus.show()
    let response = await snippet.loadNext()
    loadingStatus.hide()
    showSnippet(response.data, await getLanguage(), false)
}

export async function showPreviousAnswer() {
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

export async function toggleComments() {
    snippet.toggleVerbose()
    loadingStatus.show()
    let response = await snippet.load()
    loadingStatus.hide()
    showSnippet(response.data, await getLanguage(), false)
}

export async function findSelectedText() {
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
