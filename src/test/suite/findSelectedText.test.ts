import * as assert from "assert";
import * as vscode from "vscode";
import { after, before } from "mocha";
import {
  closeAllEditors,
  getResponseFromResultDocument,
  openDocumentAndFindSelectedText,
} from "../testUtils";

suite("snippet.findSelectedText", () => {
  suite("openInNewEditor is true", () => {
    const queryText = "query";
    const language = "javascript";

    before(
      async () =>
        await openDocumentAndFindSelectedText({
          language,
          queryText,
          openInNewEditor: true,
        })
    );

    after(closeAllEditors);

    test("Opens a new editor", async () => {
      assert.strictEqual(vscode.window.visibleTextEditors.length, 2);
    });

    test("The text of the initial document is not changed", async () => {
      const initialDocument =
        vscode.window.visibleTextEditors.find(
          (editor) => editor !== vscode.window.activeTextEditor
        )?.document ?? vscode.window.activeTextEditor.document;

      assert.strictEqual(initialDocument.getText(), queryText);
    });

    test("Sends the correct query", async () => {
      const response = getResponseFromResultDocument();

      assert.strictEqual(response.query, queryText);
    });

    test("Sends the correct language", async () => {
      const response = getResponseFromResultDocument();

      assert.strictEqual(response.language, language);
    });
  });
});
