import * as vscode from "vscode";
import { pickLanguage, getLanguage, getConfig } from "./config";
import { query } from "./query";
import { encodeRequest } from "./provider";
import snippet from "./snippet";

export interface Request {
  language: string;
  query: string;
}

let loadingStatus = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left
);
loadingStatus.text = `$(clock) Loading Snippet ...`;

export async function findWithProvider(
  language: string,
  userQuery: string,
  verbose: boolean,
  number: number,
  openInNewEditor = true
) {
  loadingStatus.show();

  let uri = encodeRequest(userQuery, language, verbose, number);

  // Calls back into the provider
  let doc = await vscode.workspace.openTextDocument(uri);
  loadingStatus.hide();

  try {
    doc = await vscode.languages.setTextDocumentLanguage(doc, language);
  } catch (e) {
    console.log(`Cannot set document language to ${language}: ${e}`);
  }
  let editor = vscode.window.activeTextEditor;

  // Open in new editor in case the respective config flag is set to true
  // or there is no open user-created editor where we could paste the snippet in.
  if (openInNewEditor || !editor || editor.document.uri.scheme == "snippet") {
    await vscode.window.showTextDocument(doc, {
      viewColumn: vscode.ViewColumn.Two,
      preview: true,
      preserveFocus: true
    });
  } else {
    let snippet = new vscode.SnippetString(doc.getText());
    let success = await editor.insertSnippet(snippet);
    if (!success) {
      vscode.window.showInformationMessage("Error while opening snippet.");
    }
  }
}

export async function getInput(): Promise<Request> {
  let language = await getLanguage();
  let userQuery = await query(language);
  return { language, query: userQuery };
}

export async function findForLanguage() {
  let language = await pickLanguage();
  let userQuery = await query(language);
  await findWithProvider(
    language,
    userQuery,
    snippet.getVerbose(),
    0,
    getConfig("openInNewEditor")
  );
}

export async function findDefault() {
  let request = await getInput();
  await findWithProvider(
    request.language,
    request.query,
    snippet.getVerbose(),
    0,
    getConfig("openInNewEditor")
  );
}

export async function findInplace() {
  let request = await getInput();
  await findWithProvider(
    request.language,
    request.query,
    snippet.getVerbose(),
    0,
    false
  );
}

export async function findInNewEditor() {
  let request = await getInput();
  await findWithProvider(
    request.language,
    request.query,
    snippet.getVerbose(),
    0,
    true
  );
}

export async function showNextAnswer() {
  if (!snippet.getCurrentQuery()) {
    return await findDefault();
  }
  const answerNumber = snippet.getNextAnswerNumber();
  await findWithProvider(
    await getLanguage(),
    snippet.getCurrentQuery(),
    snippet.getVerbose(),
    answerNumber,
    getConfig("openInNewEditor")
  );
}

export async function showPreviousAnswer() {
  if (!snippet.getCurrentQuery()) {
    return await findDefault();
  }
  const answerNumber = snippet.getPreviousAnswerNumber();
  if (answerNumber == null) {
    vscode.window.showInformationMessage("already at first snippet");
    return;
  }
  findWithProvider(
    await getLanguage(),
    snippet.getCurrentQuery(),
    snippet.getVerbose(),
    answerNumber,
    getConfig("openInNewEditor")
  );
}

export async function toggleComments() {
  snippet.toggleVerbose();
  findWithProvider(
    await getLanguage(),
    snippet.getCurrentQuery(),
    snippet.getVerbose(),
    snippet.getCurrentAnswerNumber(),
    getConfig("openInNewEditor")
  );
}

export async function findSelectedText() {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("There is no open editor window");
    return;
  }
  let selection = editor.selection;
  let query = editor.document.getText(selection);
  let language = await getLanguage();
  findWithProvider(
    language,
    query,
    snippet.getVerbose(),
    0,
    getConfig("openInNewEditor")
  );
}
