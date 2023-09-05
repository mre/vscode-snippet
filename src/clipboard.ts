import * as vscode from "vscode";
import { getConfig } from "./config";

export async function copySnippet(content: string): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(content);

    if (getConfig("showCopySuccessNotification")) {
      await showNotification();
    }
  } catch {
    vscode.window.showErrorMessage(
      "Failed to copy the snippet to the clipboard"
    );
  }
}
async function showNotification() {
  const doNotShowAgain = await vscode.window.showInformationMessage(
    "The snippet was copied to the clipboard",
    { modal: false },
    "Do not show again"
  );

  if (doNotShowAgain) {
    const config = vscode.workspace.getConfiguration("snippet");
    await config.update(
      "showCopySuccessNotification",
      false,
      vscode.ConfigurationTarget.Global
    );
  }
}
