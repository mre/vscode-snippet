import * as vscode from 'vscode';
import {
    getLanguage,
    getOpenInNewEditorConfig
} from './config';
import { query } from './query';
import { showSnippet } from './document';
import { Snippet } from './snippet';
import { encodeRequest } from './provider';

export interface Request {
    language: string
    query: string
};


const snippet = new Snippet();

/**
 * FIXME: this method must be here? It's only that won't return promise (void)
 * but an Text Editor
 */
export const findWithProvider = async (
    language: string,
    userQuery: string
): Promise<vscode.TextEditor> => {
    const uri = encodeRequest(userQuery, language);
    const doc = await vscode.workspace.openTextDocument(uri);

    vscode.languages.setTextDocumentLanguage(doc, language);

    let column = vscode.ViewColumn.Two;
    const hasViewColumn = vscode.ViewColumn;
    
    if (!hasViewColumn) { column = vscode.ViewColumn.One; }

    return vscode.window.showTextDocument(doc, { viewColumn: column, preview: true });
};

export const getInput = async (): Promise<Request> => {
    const language = await getLanguage();
    const userQuery = await query(language);
    return { language, query: userQuery };
};

export const findForLanguage = async (): Promise<void> => {
    const language = await vscode.window.showInputBox({
        value: 'python',
        placeHolder: 'Find snippet for which programming language?',
    });

    const userQuery = await query(language);
    const response = await snippet.load(language, userQuery, 0);
    return showSnippet(response.data, response.language, true);
};

export const findDefault = async (): Promise<void> => {
    const request = await getInput();
    const response = await snippet.load(request.language, request.query, 0);
    return showSnippet(response.data, response.language, getOpenInNewEditorConfig('openInNewEditor'));
};

export const findInplace = async (): Promise<void> =>  {
    const request = await getInput();
    const response = await snippet.load(request.language, request.query, 0);
    return showSnippet(response.data, response.language, false);
};

export const findInNewEditor = async (): Promise<void> => {
    const request = await getInput();
    const response = await snippet.load(request.language, request.query, 0);
    return showSnippet(response.data, response.language, true);
};

export const showNextAnswer = async (): Promise<void> => {
    if (!snippet.getCurrentQuery()) { return findDefault(); }
    const response = await snippet.loadNext();
    return showSnippet(response.data, await getLanguage(), false);
};

export const showPreviousAnswer = async (): Promise<void> => {
    if (!snippet.getCurrentQuery()) { return await findDefault(); }
    const res = await snippet.loadPrevious();
    return showSnippet(res.data, res.language, false);
};

export const toggleComments = async (): Promise<void> => {
    snippet.toggleVerbose();
    const response = await snippet.load();
    showSnippet(response.data, await getLanguage(), false);
};

export const findSelectedText = async (): Promise<void> => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) { return Promise.reject('There is no open editor window'); }

    const selection = editor.selection;
    const query = editor.document.getText(selection);
    const language = await getLanguage();
    const response = await snippet.load(language, query, 0);
    return showSnippet(response.data, language, getOpenInNewEditorConfig('openInNewEditor'));
};
