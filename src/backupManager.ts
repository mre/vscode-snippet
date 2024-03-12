import { randomUUID } from "crypto";
import * as vscode from "vscode";
import { formatUnixTime } from "./date";
import SnippetsStorage, { TreeElement } from "./snippetsStorage";

export interface Backup {
  id: string;
  dateUnix: number;
  elements: TreeElement[];
}

export interface BackupItem extends vscode.QuickPickItem {
  id: string;
  dateUnix: number;
}

// TODO: move all storage keys to a separate file and ensure no duplicates
const STORAGE_KEY = "snippet.snippetBackupsStorageKey";
const MAX_BACKUPS = 10;

export class BackupManager {
  private backups: Backup[] = [];
  private elementsBeforeRestore: TreeElement[] | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly snippets: SnippetsStorage
  ) {
    this.load();
    if (!this.backups.length) {
      this.makeBackup([...this.snippets.getElements()]);
    }
    snippets.onBeforeSave = (elements) => this.makeBackup(elements);
  }

  getBackupItems(): BackupItem[] {
    const items = this.backups.map((backup) => ({
      id: backup.id,
      label: `${formatUnixTime(
        backup.dateUnix
      )} • ${this.snippets.getSnippetCount(backup.elements)} snippet${
        backup.elements.length === 1 ? "" : "s"
      }`,
      dateUnix: backup.dateUnix,
    }));

    items.sort((a, b) => b.dateUnix - a.dateUnix);

    return items;
  }

  async restoreBackup(id: string) {
    const backup = this.backups.find((backup) => backup.id === id);

    if (!backup) {
      return;
    }

    this.elementsBeforeRestore = this.snippets.getElements();
    await this.snippets.replaceElements(backup.elements);
  }

  async undoLastRestore() {
    if (this.elementsBeforeRestore === null) {
      return;
    }

    await this.snippets.replaceElements(this.elementsBeforeRestore);
    this.elementsBeforeRestore = null;
  }

  private load(): void {
    this.backups = JSON.parse(
      this.context.globalState.get(STORAGE_KEY) || "[]"
    ) as Backup[];
  }

  private async makeBackup(elements: TreeElement[]) {
    const backup: Backup = {
      id: randomUUID(),
      dateUnix: Math.floor(Date.now() / 1000),
      elements: elements,
    };

    this.backups.push(backup);

    if (this.backups.length > MAX_BACKUPS) {
      this.backups.shift();
    }

    await this.save();
  }

  private async save() {
    await this.context.globalState.update(
      STORAGE_KEY,
      JSON.stringify(this.backups)
    );
  }
}
