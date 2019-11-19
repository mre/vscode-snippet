import * as vscode from "vscode";

export function getConfig(param: string) {
  return vscode.workspace.getConfiguration("snippet")[param];
}

export async function pickLanguage() {
  let languages = await vscode.languages.getLanguages();
  return await vscode.window.showQuickPick(languages);
}

async function getDefaultLanguage() {
  let defaultLanguage: string = getConfig("defaultLanguage");
  if (defaultLanguage && defaultLanguage.trim()) {
    return defaultLanguage;
  }
  return await pickLanguage();
}

export async function getLanguage(): Promise<string> {
  if (vscode.window.visibleTextEditors.length === 0) {
    return getDefaultLanguage();
  }
  let editor = vscode.window.activeTextEditor;
  return editor.document.languageId;
}
