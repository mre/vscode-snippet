import * as assert from "assert";
import * as vscode from "vscode";
import { after, before, afterEach } from "mocha";
import {
  closeAllEditors,
  getInitialDocument,
  getResponseFromResultDocument,
  openDocumentAndFind,
} from "../testUtils";
import * as sinon from "sinon";

suite("snippet.find", () => {
  suite("openInNewEditor is true", () => {
    const queryText = "sort an array";
    const language = "javascript";
    const documentText = "let i = 0;";

    before(
      async () =>
        await openDocumentAndFind({
          language,
          documentText,
          queryText,
          openInNewEditor: true,
        })
    );

    after(closeAllEditors);

    afterEach(() => {
      sinon.restore();
    });

    test("Opens a new editor", async () => {
      assert.strictEqual(vscode.window.visibleTextEditors.length, 2);
    });

    test("The text of the initial document is not changed", async () => {
      const initialDocument = getInitialDocument();

      assert.strictEqual(initialDocument.getText(), documentText);
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
