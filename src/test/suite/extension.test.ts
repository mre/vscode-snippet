import * as assert from "assert";
import * as vscode from "vscode";
import { after, before } from "mocha";
import { MockResponseData } from "../../snippet";

suite("Extension Test Suite", () => {
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

      after(closeAllDocuments);

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
        const response = getResponseFromResultDocument();

        assert.strictEqual(response.query, queryText);
      });

      test("Sends the correct language", async () => {
        const response = getResponseFromResultDocument();

        assert.strictEqual(response.language, language);
      });
    });
  });

  suite("snippet.showNextAnswer", () => {
    suite("openInNewEditor is true", () => {
      before(async () => {
        await openDocumentAndFindSelectedText({
          openInNewEditor: true,
        });
      });

      after(closeAllDocuments);

      test("Initial answer number is 0", async () => {
        const response = getResponseFromResultDocument();

        assert.strictEqual(response.answerNumber, 0);
      });

      test("Increments answer number", async () => {
        const maxAnswers = 3;
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

  suite("snippet.showPreviousAnswer", () => {
    suite("openInNewEditor is true", () => {
      before(async () => {
        await openDocumentAndFindSelectedText({
          openInNewEditor: true,
        });
      });

      after(closeAllDocuments);

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

  suite("snippet.toggleComments", () => {
    suite("openInNewEditor is true", () => {
      before(async () => {
        await openDocumentAndFindSelectedText({
          openInNewEditor: true,
        });
      });

      after(closeAllDocuments);

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
});

function getResponseFromResultDocument(): MockResponseData {
  const editors = vscode.window.visibleTextEditors.filter(
    (x) => !x.document.isUntitled
  );
  const responseText = editors[editors.length - 1].document.getText();
  return JSON.parse(responseText);
}

async function openDocumentAndFindSelectedText({
  language = "javascript",
  queryText = Date.now().toString(),
  openInNewEditor,
}: {
  language?: string;
  queryText?: string;
  openInNewEditor: boolean;
}): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    language: language,
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
  const configTarget = vscode.ConfigurationTarget.Global;
  await config.update("openInNewEditor", openInNewEditor, configTarget);

  await vscode.commands.executeCommand("snippet.findSelectedText");
}

async function closeAllDocuments(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
}
