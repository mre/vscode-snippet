import * as assert from "assert";
import * as vscode from "vscode";
import { after, before } from "mocha";

suite("Extension Test Suite", function () {
  this.timeout(10000);

  suite("snippet.findSelectedText", () => {
    suite("openInNewEditor is true", () => {
      const queryText = "query";
      const language = "javascript";

      before(async () => {
        const document = await vscode.workspace.openTextDocument({
          language,
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
        await config.update("openInNewEditor", true, true);

        await vscode.commands.executeCommand("snippet.findSelectedText");
      });

      after(async () => {
        await vscode.commands.executeCommand(
          "workbench.action.closeAllEditors"
        );
      });

      test("Opens a new document", async () => {
        assert.strictEqual(vscode.workspace.textDocuments.length, 2);
      });

      test("The text of the initial document is not changed", async () => {
        assert.strictEqual(
          vscode.window.activeTextEditor.document.getText(),
          queryText
        );
      });

      test("Sends the correct query", async () => {
        const request = getRequestFromResultDocument();

        assert.strictEqual(request.query, queryText);
      });

      test("Sends the correct language", async () => {
        const request = getRequestFromResultDocument();

        assert.strictEqual(request.language, language);
      });
    });
  });
});

function getRequestFromResultDocument() {
  const requestStr = vscode.workspace.textDocuments
    .find((document) => document !== vscode.window.activeTextEditor.document)
    .getText();
  return JSON.parse(requestStr);
}
