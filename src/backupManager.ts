import { randomUUID } from "crypto";
import * as vscode from "vscode";
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

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly snippets: SnippetsStorage
  ) {
    this.load();
    if (!this.backups.length) {
      this.makeBackup([...this.snippets.getSnippets()]);
    }
    snippets.onBeforeSave = (elements) => this.makeBackup(elements);
  }

  getBackupItems(): BackupItem[] {
    const items = this.backups.map((backup) => ({
      id: backup.id,
      label: `${this.formatUnixTime(
        backup.dateUnix
      )} • ${this.snippets.getSnippetCount(backup.elements)} snippet${
        backup.elements.length === 1 ? "" : "s"
      }`,
      dateUnix: backup.dateUnix,
    }));

    items.sort((a, b) => b.dateUnix - a.dateUnix);

    return items;
  }

  private formatUnixTime(seconds: number) {
    const date = new Date(seconds * 1000);
    return `${date.toDateString()}, ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
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
