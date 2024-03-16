import * as sinon from "sinon";
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

export async function openDocumentAndSelectText({
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
  await openDocumentAndSelectText({
    language,
    queryText,
    openInNewEditor,
  });

  await vscode.commands.executeCommand("snippet.findSelectedText");
}

export async function openDocumentAndFind({
  queryText,
  language,
  documentText,
  openInNewEditor,
}: {
  queryText: string;
  language: string;
  documentText: string;
  openInNewEditor: boolean;
}): Promise<void> {
  await openDocument({ language, documentText, openInNewEditor });

  const createQuickPickStub = sinon.stub(vscode.window, "createQuickPick");
  const quickPick = createQuickPickStub.wrappedMethod();
  sinon.stub(quickPick, "show").callsFake(() => {
    // Ignore this call
  });
  sinon.stub(quickPick, "value").value(queryText);
  const onDidAcceptStub = sinon.stub(quickPick, "onDidAccept");
  onDidAcceptStub.callsFake((listener) => {
    const disposable = onDidAcceptStub.wrappedMethod(listener);
    listener();
    return disposable;
  });
  createQuickPickStub.returns(quickPick);

  await vscode.commands.executeCommand("snippet.find");
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
