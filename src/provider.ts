import * as vscode from 'vscode';
import {
    TextDocumentContentProvider,
    Uri
} from 'vscode';
import { Snippet } from './snippet';


export default class SnippetProvider implements TextDocumentContentProvider {
    public async provideTextDocumentContent(fakeUrl: Uri): Promise<string> {
        const request = decodeRequest(fakeUrl);
        const snippet = new Snippet();
        const response = await snippet.load(request.language, request.query, 0);
        const codeSnippet = response.data;
        return Promise.resolve(codeSnippet);
    }
};

export const encodeRequest = (
    query: string,
    language: string
): vscode.Uri => {
    const data = JSON.stringify({ query: query, language: language });
    return vscode.Uri.parse(`snippet:[${language}] ${query}?${data}`);
};

export const decodeRequest = (uri: vscode.Uri): any => {
    const decodedRequest = JSON.parse(uri.query);
    return decodedRequest;
};
