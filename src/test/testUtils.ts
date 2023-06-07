import * as vscode from "vscode";
import { MockResponseData } from "../snippet";

export function getResponseFromResultDocument(): MockResponseData {
  const editors = vscode.window.visibleTextEditors.filter(
    (x) => !x.document.isUntitled
  );
  const last = editors[editors.length - 1];
  if (!last) {
    throw new Error("Response document not found.");
  }
  const responseText = last.document.getText();
  return JSON.parse(responseText);
}

export async function openDocument({
  language = "javascript",
  documentText,
  openInNewEditor,
}: {
  language?: string;
  documentText: string;
  openInNewEditor: boolean;
}): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    language,
    content: documentText,
  });
  await vscode.window.showTextDocument(document);

  const config = vscode.workspace.getConfiguration("snippet");
  const configTarget = vscode.ConfigurationTarget.Global;
  await config.update("openInNewEditor", openInNewEditor, configTarget);
}

export async function openDocumentAndFindSelectedText({
  language = "javascript",
  queryText = Date.now().toString(),
  openInNewEditor,
}: {
  language?: string;
  queryText?: string;
  openInNewEditor: boolean;
}): Promise<void> {
  await openDocument({ language, documentText: queryText, openInNewEditor });

  vscode.window.activeTextEditor.selection = new vscode.Selection(
    0,
    0,
    0,
    queryText.length
  );

  await vscode.commands.executeCommand("snippet.findSelectedText");
}

export async function closeAllEditors(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
}

export function getInitialDocument(): vscode.TextDocument {
  return (
    vscode.window.visibleTextEditors.find(
      (editor) => editor !== vscode.window.activeTextEditor
    )?.document ?? vscode.window.activeTextEditor.document
  );
}
