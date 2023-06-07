import * as assert from "assert";
import * as vscode from "vscode";
import { after, before, afterEach } from "mocha";
import {
  closeAllEditors,
  getInitialDocument,
  getResponseFromResultDocument,
  openDocument,
} from "../testUtils";
import * as sinon from "sinon";

suite("snippet.find", () => {
  suite("openInNewEditor is true", () => {
    const queryText = "sort an array";
    const language = "javascript";
    const documentText = "let i = 0;";

    before(
      async () =>
        await openDocument({
          language,
          documentText,
          openInNewEditor: true,
        })
    );

    after(closeAllEditors);

    afterEach(() => {
      sinon.restore();
    });

    test("Opens a new editor", async () => {
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
