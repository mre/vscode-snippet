import * as assert from "assert";
import { after, afterEach, before } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { BackupItem } from "../../backupManager";
import { closeAllEditors, openDocumentAndFind } from "../testUtils";

suite("snippet.restoreBackups", () => {
  suite("openInNewEditor is true", () => {
    before(
      async () =>
        await openDocumentAndFind({
          language: "",
          documentText: "",
          queryText: "",
          openInNewEditor: true,
        })
    );

    after(closeAllEditors);

    afterEach(() => {
      sinon.restore();
    });

    test("No backups initially", async () => {
      const showQuickPickStub = sinon.stub(vscode.window, "showQuickPick");
      showQuickPickStub.callsFake((backups: BackupItem[]) => {
        assert.strictEqual(backups.length, 0);
        return null;
      });

      await vscode.commands.executeCommand("snippet.restoreBackups");
    });

    // test("Saves up to 10 backups", async () => {
    //   assert.strictEqual(2, 2);
    // });
  });
});
