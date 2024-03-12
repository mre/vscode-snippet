import * as vscode from "vscode";
import SnippetsStorage, { TreeElement } from "./snippetsStorage";

export interface Backup {
  dateUnix: number;
  elements: TreeElement[];
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

  getBackups(): Backup[] {
    return this.backups.slice();
  }

  private load(): void {
    this.backups = JSON.parse(
      this.context.globalState.get(STORAGE_KEY) || "[]"
    ) as Backup[];
  }

  private async makeBackup(elements: TreeElement[]) {
    const backup: Backup = {
      dateUnix: Math.floor(Date.now() / 1000),
      elements: elements,
    };

    this.backups.push(backup);
    await this.save();
  }

  private async save() {
    await this.context.globalState.update(
      STORAGE_KEY,
      JSON.stringify(this.backups)
    );
  }
}
