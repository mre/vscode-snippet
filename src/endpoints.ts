import * as vscode from 'vscode'
import { getLanguage, getConfig } from './config'
import { query } from './query'
import { showSnippet } from './document'
import { Snippet } from './snippet'
import { encodeRequest } from './provider'

export interface Request {
    language: string
    query: string
}

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text = `$(clock) Loading Snippet ...`

let snippet = new Snippet()

export async function findWithProvider(language: string, userQuery: string) {
    loadingStatus.show()

    let uri = encodeRequest(userQuery, language);

    // Calls back into the provider
    let doc = await vscode.workspace.openTextDocument(uri);
    vscode.languages.setTextDocumentLanguage(doc, language);

    let column = vscode.ViewColumn.Two
    if (!vscode.ViewColumn) {
        column = vscode.ViewColumn.One
    }
    await vscode.window.showTextDocument(doc, { viewColumn: column, preview: true });

    loadingStatus.hide()
}

export async function getInput(): Promise<Request> {
    let language = await getLanguage()
    let userQuery = await query(language)
    return { language, query: userQuery }
}

export async function findForLanguage() {
    loadingStatus.show()
    let language = await vscode.window.showInputBox({
        value: 'python',
        placeHolder: 'Find snippet for which programming language?',
    });
    let userQuery = await query(language)
    let response = await snippet.load(language, userQuery, 0)
    loadingStatus.hide()
    showSnippet(response.data, response.language, false)
}

export async function findDefault() {
    loadingStatus.show()
    let request = await getInput()
    let response = await snippet.load(request.language, request.query, 0)
    showSnippet(response.data, response.language, getConfig("openInNewEditor"))
    loadingStatus.hide()
}

export async function findInplace() {
    loadingStatus.show()
    let request = await getInput()
    let response = await snippet.load(request.language, request.query, 0)
    showSnippet(response.data, response.language, false)
    loadingStatus.hide()
}

export async function findInNewEditor() {
    loadingStatus.show()
    let request = await getInput()
    let response = await snippet.load(request.language, request.query, 0)
    showSnippet(response.data, response.language, true)
    loadingStatus.hide()
}

export async function showNextAnswer() {
    if (!snippet.getCurrentQuery()) {
        return await findDefault()
    }
    loadingStatus.show()
    let response = await snippet.loadNext()
    showSnippet(response.data, await getLanguage(), false)
    loadingStatus.hide()
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
    loadingStatus.show()
    snippet.toggleVerbose()
    let response = await snippet.load()
    showSnippet(response.data, await getLanguage(), false)
    loadingStatus.hide()
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
    showSnippet(response.data, language, getConfig("openInNewEditor"))
    loadingStatus.hide()
}
