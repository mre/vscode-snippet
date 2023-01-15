import * as assert from "assert";
import * as vscode from "vscode";
import { after, before } from "mocha";
import {
  closeAllEditors,
  getResponseFromResultDocument,
  openDocumentAndFindSelectedText,
} from "../testUtils";

suite("snippet.toggleComments", () => {
  suite("openInNewEditor is true", () => {
    before(async () => {
      await openDocumentAndFindSelectedText({
        openInNewEditor: true,
      });
    });

    after(closeAllEditors);

    test("Toggles verbose state from false to true", async () => {
      await vscode.commands.executeCommand("snippet.toggleComments");
      const response = getResponseFromResultDocument();

      assert.strictEqual(response.verbose, true);
    });

    test("Toggles verbose state from true to false", async () => {
      await vscode.commands.executeCommand("snippet.toggleComments");
      const response = getResponseFromResultDocument();

      assert.strictEqual(response.verbose, false);
    });
  });
});
