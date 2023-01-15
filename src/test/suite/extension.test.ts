import * as assert from "assert";
import * as vscode from "vscode";
import { after, before } from "mocha";

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
        const request = getRequestFromResultDocument();

        assert.strictEqual(request.query, queryText);
      });

      test("Sends the correct language", async () => {
        const request = getRequestFromResultDocument();

        assert.strictEqual(request.language, language);
      });
    });
  });

  suite("snippet.showNextAnswer", () => {
    suite("openInNewEditor is true", () => {
      const queryText = "query";
      const language = "javascript";

      before(async () => {
        await openDocumentAndFindSelectedText({
          language,
          queryText,
          openInNewEditor: true,
        });
      });

      after(closeAllDocuments);

      test("Initial answer number is 0", async () => {
        const request = getRequestFromResultDocument();

        assert.strictEqual(request.answerNumber, 0);
      });

      test("Increments answer number", async () => {
        const maxAnswers = 5;
        const answerNumbers = Array(maxAnswers).fill(0);
        const expectedAnswerNumbers = Array(maxAnswers)
          .fill(0)
          .map((_, i) => i);

        for (let i = 0; i < maxAnswers; i++) {
          await vscode.commands.executeCommand("snippet.showNextAnswer");
          const request = getRequestFromResultDocument();
          answerNumbers[i] = request.answerNumber;
        }

        assert.deepEqual(answerNumbers, expectedAnswerNumbers);
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

interface Options {
  language: string;
  queryText: string;
  openInNewEditor: boolean;
}

async function openDocumentAndFindSelectedText(options: Options) {
  const document = await vscode.workspace.openTextDocument({
    language: options.language,
    content: options.queryText,
  });
  await vscode.window.showTextDocument(document);

  vscode.window.activeTextEditor.selection = new vscode.Selection(
    0,
    0,
    0,
    options.queryText.length
  );

  const config = vscode.workspace.getConfiguration("snippet");
  const configTargetIsGlobal = true;
  await config.update(
    "openInNewEditor",
    options.openInNewEditor,
    configTargetIsGlobal
  );

  await vscode.commands.executeCommand("snippet.findSelectedText");
}

async function closeAllDocuments() {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
}
