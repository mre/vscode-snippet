import * as assert from "assert";
import { randomUUID } from "crypto";
import { afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { MessageItem } from "vscode";
import { BackupItem } from "../../backupManager";
import { cache } from "../../cache";
import SnippetsStorage, { TreeElement } from "../../snippetsStorage";
import { closeAllEditors, openDocumentAndSelectText } from "../testUtils";

suite("snippet.restoreBackups", () => {
  afterEach(() => {
    sinon.restore();
  });

  test("No backups initially", async () => {
    await getBackups(async (backups: BackupItem[]) => {
      assert.strictEqual(backups.length, 0);
    });
  });

  test("Creates a backup after rename", async () => {
    sinon.stub(vscode.window, "showInputBox").callsFake(() => {
      return Promise.resolve("new name");
    });
    const originalElementsJson = getElementsJson();
    const snippet = getAnySnippet(originalElementsJson);

    await vscode.commands.executeCommand("snippet.renameSnippet", {
      id: snippet.data.id,
    });

    await getBackups(async (backups: BackupItem[]) => {
      assert.strictEqual(backups.length, 1);
      assert.strictEqual(
        JSON.stringify(backups[0].item.elements),
        originalElementsJson
      );
    });
  });

  test("Creates a backup after delete", async () => {
    sinon.stub(vscode.window, "showInformationMessage").callsFake(() => {
      return Promise.resolve("Yes" as unknown as MessageItem);
    });
    const originalElementsJson = getElementsJson();
    const snippet = getAnySnippet(originalElementsJson);

    await vscode.commands.executeCommand("snippet.deleteSnippet", {
      id: snippet.data.id,
    });

    await getBackups(async (backups: BackupItem[]) => {
      assert.strictEqual(backups.length, 2);
      assert.strictEqual(
        JSON.stringify(backups[0].item.elements),
        originalElementsJson
      );
    });
  });

  test("Creates a backup after save", async () => {
    await openDocumentAndSelectText({
      language: "javascript",
      queryText: "query",
      openInNewEditor: true,
    });
    sinon.stub(vscode.window, "showQuickPick").callsFake((folders) => {
      return folders[0];
    });
    sinon.stub(vscode.window, "showInputBox").callsFake(() => {
      return Promise.resolve("new snippet");
    });
    const originalElementsJson = getElementsJson();

    await vscode.commands.executeCommand("snippet.saveSnippet");
    sinon.restore();

    await getBackups(async (backups: BackupItem[]) => {
      await closeAllEditors();

      assert.strictEqual(backups.length, 3);
      assert.strictEqual(
        JSON.stringify(backups[0].item.elements),
        originalElementsJson
      );
    });
  });

  test("Creates a backup after move", async () => {
    const originalElementsJson = getElementsJson();
    const elements = parseElements(originalElementsJson);

    await vscode.commands.executeCommand(
      "snippet.test_moveElement",
      elements[2].data.id,
      elements[1].data.id
    );

    await getBackups(async (backups: BackupItem[]) => {
      assert.strictEqual(backups.length, 4);
      assert.strictEqual(
        JSON.stringify(backups[0].item.elements),
        originalElementsJson
      );
    });
  });

  test("Saves up to 10 backups", async () => {
    sinon.stub(vscode.window, "showInputBox").callsFake(() => {
      return Promise.resolve(randomUUID());
    });
    const originalElementsJson = getElementsJson();
    const snippet = getAnySnippet(originalElementsJson);

    for (let i = 0; i < 11; i++) {
      await vscode.commands.executeCommand("snippet.renameSnippet", {
        id: snippet.data.id,
      });
    }

    await getBackups(async (backups: BackupItem[]) => {
      assert.strictEqual(backups.length, 10);
    });
  });
});

async function getBackups(
  callback: (backups: BackupItem[]) => Promise<void>
): Promise<void> {
  const showQuickPickStub = sinon.stub(vscode.window, "showQuickPick");

  showQuickPickStub.callsFake(async (backups: BackupItem[]) => {
    await callback(backups);
    return null;
  });

  await vscode.commands.executeCommand("snippet.restoreBackups");
}

function getElementsJson(): string {
  return cache.state.get<string>("snippet.snippetsStorageKey") || "[]";
}

function parseElements(json: string): TreeElement[] {
  return JSON.parse(json);
}

function getAnySnippet(elementsJson: string): TreeElement {
  return parseElements(elementsJson).find((x) => !SnippetsStorage.isFolder(x));
}
