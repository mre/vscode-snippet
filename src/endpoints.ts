import * as vscode from 'vscode'
import { getLanguage, getConfig } from './config'
import { query } from './query'
import { encodeRequest } from './provider'
import snippet from './snippet'

export interface Request {
    language: string
    query: string
}

let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
loadingStatus.text = `$(clock) Loading Snippet ...`

export async function findWithProvider(language: string, userQuery: string, number?: number, openInNewEditor = true) {
    loadingStatus.show()

    let uri = encodeRequest(userQuery, language, number);

    // Calls back into the provider
    let doc = await vscode.workspace.openTextDocument(uri);
    doc = await vscode.languages.setTextDocumentLanguage(doc, language);

    let column = vscode.ViewColumn.Two
    if (!vscode.ViewColumn) {
        column = vscode.ViewColumn.One
    }
    if (openInNewEditor) {
        await vscode.window.showTextDocument(doc, { viewColumn: column, preview: true });
    } else {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let snippet = new vscode.SnippetString(doc.getText());
            await editor.insertSnippet(snippet)
        }
    }

    loadingStatus.hide()
}

export async function getInput(): Promise<Request> {
    let language = await getLanguage()
    let userQuery = await query(language)
    return { language, query: userQuery }
}

export async function findForLanguage() {
    let language = await vscode.window.showInputBox({
        value: 'python',
        placeHolder: 'Find snippet for which programming language?',
    });
    let userQuery = await query(language)
    await findWithProvider(language, userQuery, 0, true)
}

export async function findDefault() {
    let request = await getInput()
    await findWithProvider(request.language, request.query, 0, getConfig("openInNewEditor"))
}

export async function findInplace() {
    let request = await getInput()
    await findWithProvider(request.language, request.query, 0, false)
}

export async function findInNewEditor() {
    let request = await getInput()
    await findWithProvider(request.language, request.query, 0, true)    
}

export async function showNextAnswer() {
    if (!snippet.getCurrentQuery()) {
        return await findDefault()
    }
    const answerNumber = snippet.getNextAnswerNumber();
    await findWithProvider(await getLanguage(), snippet.getCurrentQuery(), answerNumber, false);
}

export async function showPreviousAnswer() {
    if (!snippet.getCurrentQuery()) {
        return await findDefault()
    }
    const answerNumber = snippet.getPreviousAnswerNumber();
    if(answerNumber == null) {
        vscode.window.showInformationMessage('already at first answer')
        return;
    }
    findWithProvider(await getLanguage(), snippet.getCurrentQuery(), answerNumber, false)
}

export async function toggleComments() {
    snippet.toggleVerbose()
    findWithProvider(await getLanguage(), snippet.getCurrentQuery(), snippet.getCurrentAnswerNumber(), false)
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
    findWithProvider(language, query, 0, getConfig("openInNewEditor"))
}
