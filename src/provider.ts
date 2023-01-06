"use strict";
import * as vscode from "vscode";
import { TextDocumentContentProvider, Uri } from "vscode";
import snippet from "./snippet";
import { getConfig } from "./config";

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

export class MockSnippetProvider implements TextDocumentContentProvider {
  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const request = decodeRequest(uri);
    return JSON.stringify(request);
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
    verbose,
  });
  const titleTemplate = getConfig("title");
  const title = titleTemplate.replace(
    /(\$\{(.*?)\})/g,
    (match: string, _, variableName: string) => {
      return variableName === "language"
        ? language
        : variableName === "query"
        ? query
        : variableName === "index"
        ? answerNumber
        : match;
    }
  );
  return vscode.Uri.parse(`snippet:${title}?${data}`);
}

export function decodeRequest(uri: vscode.Uri): any {
  let obj = JSON.parse(uri.query);
  return obj;
}
