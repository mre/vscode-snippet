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
    const request = decodeRequest(uri);
    const response = await snippet.load(
      request.language,
      request.query,
      request.answerNumber
    );

    if (response.data.trimLeft().startsWith("/LANG/QUESTION")) {
      return `404 NOT FOUND

Unknown cheat sheet. Please try to reformulate your query.
Query format:

    /LANG/QUESTION

Examples:

    /python/read+json
    /golang/run+external+program
    /js/regex+search

See /:help for more info.

If the problem persists, file a GitHub issue at
github.com/chubin/cheat.sh or ping @igor_chubin
`;
    }

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

export function decodeRequest(uri: vscode.Uri): object {
  const obj = JSON.parse(uri.query);
  return obj;
}
