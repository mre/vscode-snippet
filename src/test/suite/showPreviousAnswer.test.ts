import * as assert from "assert";
import * as vscode from "vscode";
import { after, before } from "mocha";
import {
  closeAllEditors,
  getResponseFromResultDocument,
  openDocumentAndFindSelectedText,
} from "../testUtils";

suite("snippet.showPreviousAnswer", () => {
  suite("openInNewEditor is true", () => {
    before(async () => {
      await openDocumentAndFindSelectedText({
        openInNewEditor: true,
      });
    });

    after(closeAllEditors);

    test("Answer number does not go below 0", async () => {
      await vscode.commands.executeCommand("snippet.showPreviousAnswer");
      const response = getResponseFromResultDocument();

      assert.strictEqual(response.answerNumber, 0);
    });

    test("Decrements answer number", async () => {
      await vscode.commands.executeCommand("snippet.showNextAnswer");
      await vscode.commands.executeCommand("snippet.showNextAnswer");
      await vscode.commands.executeCommand("snippet.showPreviousAnswer");
      const response = getResponseFromResultDocument();

      assert.strictEqual(response.answerNumber, 1);
    });
  });
});
