import * as assert from "assert";
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
    const backups = await getBackups();

    assert.strictEqual(backups.length, 0);
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
    const backups = await getBackups();

    assert.strictEqual(backups.length, 1);
    assert.strictEqual(
      JSON.stringify(backups[0].item.elements),
      originalElementsJson
    );
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
    const backups = await getBackups();

    assert.strictEqual(backups.length, 2);
    assert.strictEqual(
      JSON.stringify(backups[0].item.elements),
      originalElementsJson
    );
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
    const backups = await getBackups();
    await closeAllEditors();

    assert.strictEqual(backups.length, 3);
    assert.strictEqual(
      JSON.stringify(backups[0].item.elements),
      originalElementsJson
    );
  });

  test("Creates a backup after move", async () => {
    const originalElementsJson = getElementsJson();
    const elements = parseElements(originalElementsJson);

    await vscode.commands.executeCommand(
      "snippet.test_moveElement",
      elements[2].data.id,
      elements[1].data.id
    );
    const backups = await getBackups();

    assert.strictEqual(backups.length, 4);
    assert.strictEqual(
      JSON.stringify(backups[0].item.elements),
      originalElementsJson
    );
  });

  test("Restores backup", async () => {
    sinon.stub(vscode.window, "showInputBox").callsFake(() => {
      return Promise.resolve("new name");
    });
    sinon.stub(vscode.window, "showInformationMessage").callsFake(() => {
      return Promise.resolve("Ok" as unknown as MessageItem);
    });
    const originalElementsJson = getElementsJson();
    const snippet = getAnySnippet(originalElementsJson);

    await vscode.commands.executeCommand("snippet.renameSnippet", {
      id: snippet.data.id,
    });
    const backups = await getBackups(true);

    assert.strictEqual(backups.length, 5);
    assert.strictEqual(getElementsJson(), originalElementsJson);
  });

  test("Undoes backup restoration", async () => {
    sinon.stub(vscode.window, "showInformationMessage").callsFake(() => {
      return Promise.resolve("Undo" as unknown as MessageItem);
    });
    sinon.stub(vscode.window, "showInputBox").callsFake(() => {
      return Promise.resolve("new name");
    });
    const originalElementsJson = getElementsJson();
    const snippet = getAnySnippet(originalElementsJson);

    await vscode.commands.executeCommand("snippet.renameSnippet", {
      id: snippet.data.id,
    });
    const elementsAfterChange = getElementsJson();
    const backups = await getBackups(true);

    assert.strictEqual(backups.length, 6);
    assert.notStrictEqual(getElementsJson(), originalElementsJson);
    assert.strictEqual(getElementsJson(), elementsAfterChange);
  });

  test("Saves up to 10 backups", async () => {
    sinon.stub(vscode.window, "showInputBox").callsFake(() => {
      return Promise.resolve("new name");
    });
    const originalElementsJson = getElementsJson();
    const snippet = getAnySnippet(originalElementsJson);

    for (let i = 0; i < 11; i++) {
      await vscode.commands.executeCommand("snippet.renameSnippet", {
        id: snippet.data.id,
      });
    }
    const backups = await getBackups();

    assert.strictEqual(backups.length, 10);
  });
});

async function getBackups(restoreLatest = false): Promise<BackupItem[]> {
  return new Promise((resolve) => {
    const showQuickPickStub = sinon.stub(vscode.window, "showQuickPick");

    let result: BackupItem[] = [];
    showQuickPickStub.callsFake(async (backups: BackupItem[]) => {
      result = backups;
      return restoreLatest && backups[0] ? backups[0] : null;
    });

    vscode.commands.executeCommand("snippet.restoreBackups").then(() => {
      resolve(result);
    });
  });
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
