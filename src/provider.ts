'use strict';
import * as vscode from 'vscode';
import { TextDocumentContentProvider, Uri } from 'vscode';

export default class SnippetProvider implements TextDocumentContentProvider {
    /**
     *
     * @param {vscode.Uri} uri - a fake uri
     * @returns {string} - Code Snippet
     **/
    public provideTextDocumentContent(uri: Uri): string {

        return "x = [i for i in fib() where i > 10]"

        // already loaded?
        // let document = this._documents.get(uri.toString());
        // if (document) {
        //     return document.value;
        // }

        // let settingsFilePath = vscode.extensions.getExtension('vicerust.snes-asm').extensionPath + "/server/src/Memory/Disassembly.asm";
        // let returnString: string;


        // // read settings file
        // if (fs.existsSync(settingsFilePath)) {
        //     returnString = fs.readFileSync(settingsFilePath).toString()
        // }

        // // return JSON object as a string
        // return returnString
    }
}