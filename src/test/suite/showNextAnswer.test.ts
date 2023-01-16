import * as assert from "assert";
import * as vscode from "vscode";
import { after, before } from "mocha";
import {
  closeAllEditors,
  getResponseFromResultDocument,
  openDocumentAndFindSelectedText,
} from "../testUtils";

suite("snippet.showNextAnswer", () => {
  suite("openInNewEditor is true", () => {
    before(async () => {
      await openDocumentAndFindSelectedText({
        openInNewEditor: true,
      });
    });

    after(closeAllEditors);

    test("Initial answer number is 0", async () => {
      const response = getResponseFromResultDocument();

      assert.strictEqual(response.answerNumber, 0);
    });

    test("Increments answer number", async () => {
      const maxAnswers = 2;
      const answerNumbers = Array(maxAnswers).fill(0);
      const expectedAnswerNumbers = Array(maxAnswers)
        .fill(0)
        .map((_, i) => i + 1);

      for (let i = 0; i < maxAnswers; i++) {
        await vscode.commands.executeCommand("snippet.showNextAnswer");
        const response = getResponseFromResultDocument();
        answerNumbers[i] = response.answerNumber;
      }

      assert.deepEqual(answerNumbers, expectedAnswerNumbers);
    });
  });
});
