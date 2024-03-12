import * as assert from "assert";
import { after, afterEach, before } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { MessageItem } from "vscode";
import { BackupItem } from "../../backupManager";
import { cache } from "../../cache";
import SnippetsStorage, { TreeElement } from "../../snippetsStorage";
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
      await getBackups((backups: BackupItem[]) => {
        assert.strictEqual(backups.length, 0);
      });
    });

    test("Creates a backup after delete", async () => {
      sinon.stub(vscode.window, "showInformationMessage").callsFake(() => {
        return Promise.resolve("Yes" as unknown as MessageItem);
      });

      const originalElements =
        cache.state.get<string>("snippet.snippetsStorageKey") || "[]";

      const snippet = (JSON.parse(originalElements) as TreeElement[]).find(
        (x) => !SnippetsStorage.isFolder(x)
      );

      await vscode.commands.executeCommand("snippet.deleteSnippet", {
        id: snippet.data.id,
      });

      await getBackups((backups: BackupItem[]) => {
        assert.strictEqual(backups.length, 1);
        assert.strictEqual(
          JSON.stringify(backups[0].item.elements),
          originalElements
        );
      });
    });
  });
});

async function getBackups(
  callback: (backups: BackupItem[]) => void
): Promise<void> {
  const showQuickPickStub = sinon.stub(vscode.window, "showQuickPick");

  showQuickPickStub.callsFake((backups: BackupItem[]) => {
    callback(backups);
    return null;
  });

  await vscode.commands.executeCommand("snippet.restoreBackups");
}
