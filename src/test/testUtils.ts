import * as vscode from "vscode";
import { MockResponseData } from "../snippet";

export function getResponseFromResultDocument(): MockResponseData {
  const editors = vscode.window.visibleTextEditors.filter(
    (x) => !x.document.isUntitled
  );
  const responseText = editors[editors.length - 1].document.getText();
  return JSON.parse(responseText);
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
  const document = await vscode.workspace.openTextDocument({
    language: language,
    content: queryText,
  });
  await vscode.window.showTextDocument(document);

  vscode.window.activeTextEditor.selection = new vscode.Selection(
    0,
    0,
    0,
    queryText.length
  );

  const config = vscode.workspace.getConfiguration("snippet");
  const configTarget = vscode.ConfigurationTarget.Global;
  await config.update("openInNewEditor", openInNewEditor, configTarget);

  await vscode.commands.executeCommand("snippet.findSelectedText");
}

export async function closeAllEditors(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
}
