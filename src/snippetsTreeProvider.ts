import * as vscode from "vscode";
import SnippetsStorage from "./snippetsStorage";

export class SnippetsTreeProvider
  implements
    vscode.TreeDataProvider<SnippetsTreeItem>,
    vscode.TreeDragAndDropController<SnippetsTreeItem>
{
  dropMimeTypes = ["application/vnd.code.tree.snippetsView"];
  dragMimeTypes = ["text/uri-list"];

  private _onDidChangeTreeData: vscode.EventEmitter<
    SnippetsTreeItem | undefined | null | void
  > = new vscode.EventEmitter<SnippetsTreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<
    SnippetsTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(
    context: vscode.ExtensionContext,
    public readonly storage: SnippetsStorage
  ) {
    const view = vscode.window.createTreeView("snippetsView", {
      treeDataProvider: this,
      showCollapseAll: true,
      canSelectMany: false,
      dragAndDropController: this,
    });
    context.subscriptions.push(view);
    this.storage.onSave = () => this.refresh();
  }

  getTreeItem(
    element: SnippetsTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: SnippetsTreeItem | undefined
  ): vscode.ProviderResult<SnippetsTreeItem[]> {
    return (
      this.storage.getElement(element?.id)?.childIds?.map((id) => {
        const curElement = this.storage.getElement(id);

        return new SnippetsTreeItem(
          curElement.data.label,
          curElement.data.content,
          curElement.childIds == null
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Expanded,
          id,
          curElement.data.fileExtension
        );
      }) ?? []
    );
  }

  handleDrag(
    source: readonly SnippetsTreeItem[],
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    if (token.isCancellationRequested) {
      return;
    }

    if (source.length > 1) {
      throw new Error("Expected canSelectMany to be false");
    }

    dataTransfer.set(
      "application/vnd.code.tree.snippetsView",
      new vscode.DataTransferItem(source[0])
    );
  }

  handleDrop(
    target: SnippetsTreeItem | undefined,
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    if (token.isCancellationRequested) {
      return;
    }

    const transferItem = dataTransfer.get(
      "application/vnd.code.tree.snippetsView"
    );

    if (!transferItem) {
      return;
    }

    return this.storage.moveElement(transferItem.value.id, target?.id);
  }

  private refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export class SnippetsTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    content: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    id: string,
    fileExtension?: string
  ) {
    super(label, collapsibleState);

    this.id = id;
    this.tooltip = content;
    this.contextValue =
      collapsibleState === vscode.TreeItemCollapsibleState.None
        ? "snippet"
        : "folder";

    if (collapsibleState !== vscode.TreeItemCollapsibleState.None) {
      return;
    }

    this.resourceUri = vscode.Uri.file(`./some-file${fileExtension || ""}`);
    this.command = {
      arguments: [this.id],
      command: "snippet.insertSnippet",
      title: "Insert code",
      tooltip: "Insert code",
    };
  }
}
