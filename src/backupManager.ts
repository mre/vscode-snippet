import { randomUUID } from "crypto";
import * as vscode from "vscode";
import { formatUnixTime } from "./date";
import SnippetsStorage, { TreeElement } from "./snippetsStorage";

export interface Backup {
  id: string;
  dateUnix: number;
  elements: TreeElement[];
  beforeOperation?: string;
}

export interface BackupItem extends vscode.QuickPickItem {
  item: Backup;
}

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
    snippets.onBeforeSave = (elements, operation) =>
      this.makeBackup(elements, operation);
  }

  getBackupItems(): BackupItem[] {
    const items = this.backups.map((backup) => {
      const time = `${formatUnixTime(backup.dateUnix)}`;
      const detail = backup.beforeOperation
        ? `before "${backup.beforeOperation}"`
        : undefined;
      const description = `${this.snippets.getSnippetCount(
        backup.elements
      )} snippet${
        this.snippets.getSnippetCount(backup.elements) === 1 ? "" : "s"
      }`;

      return {
        label: time,
        item: backup,
        description,
        detail,
      };
    });

    items.sort((a, b) => b.item.dateUnix - a.item.dateUnix);

    return items;
  }

  async restoreBackup(id: string) {
    const backup = this.backups.find((backup) => backup.id === id);

    if (!backup) {
      console.error(`Backup with id ${id} not found.`);
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

  private async makeBackup(elements: TreeElement[], operation?: string) {
    const backup: Backup = {
      id: randomUUID(),
      dateUnix: Date.now(),
      elements,
      beforeOperation: operation,
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
