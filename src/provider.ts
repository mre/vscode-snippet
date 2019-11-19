"use strict";
import * as vscode from "vscode";
import { TextDocumentContentProvider, Uri } from "vscode";
import snippet from "./snippet";

export default class SnippetProvider implements TextDocumentContentProvider {
  /**
   *
   * @param {vscode.Uri} uri - a fake uri
   * @returns {string} - Code Snippet
   **/
  public async provideTextDocumentContent(uri?: Uri): Promise<string> {
    let request = decodeRequest(uri);
    let response = await snippet.load(
      request.language,
      request.query,
      request.answerNumber
    );
    return response.data;
  }
}

export function encodeRequest(
  query: string,
  language: string,
  verbose: boolean,
  answerNumber: number
): vscode.Uri {
  const data = JSON.stringify({
    query: query,
    language: language,
    answerNumber,
    verbose
  });
  return vscode.Uri.parse(
    `snippet:[${language}] ${query} (${answerNumber})?${data}`
  );
}

export function decodeRequest(uri: vscode.Uri): any {
  let obj = JSON.parse(uri.query);
  return obj;
}
