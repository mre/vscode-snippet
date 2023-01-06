import * as assert from "assert";
import * as vscode from "vscode";
import { after } from "mocha";

suite("Extension Test Suite", () => {
  suite("snippet.findSelectedText", () => {
    after(async () => {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    });

    test("Opens result in the new editor if openInNewEditor is true", async () => {
      const queryText = "query";
      const language = "js";
      const doc = await vscode.workspace.openTextDocument({
        language,
        content: queryText,
      });
      await vscode.window.showTextDocument(doc);
      vscode.window.activeTextEditor.selection = new vscode.Selection(
        0,
        0,
        0,
        queryText.length
      );
      const config = vscode.workspace.getConfiguration("snippet");
      await config.update("openInNewEditor", true, true);

      await vscode.commands.executeCommand("snippet.findSelectedText");

      assert.strictEqual(
        vscode.window.activeTextEditor.document.getText(),
        queryText
      );
      assert.strictEqual(vscode.workspace.textDocuments.length, 2);
    });
  });
});
