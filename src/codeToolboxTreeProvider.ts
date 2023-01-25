import * as vscode from "vscode";
import CodeToolbox from "./codeToolbox";

export class CodeToolboxTreeProvider
  implements
    vscode.TreeDataProvider<ToolboxTreeItem>,
    vscode.TreeDragAndDropController<ToolboxTreeItem>
{
  dropMimeTypes = ["application/vnd.code.tree.codeToolbox"];
  dragMimeTypes = ["text/uri-list"];

  private _onDidChangeTreeData: vscode.EventEmitter<
    ToolboxTreeItem | undefined | null | void
  > = new vscode.EventEmitter<ToolboxTreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<
    ToolboxTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(
    context: vscode.ExtensionContext,
    public readonly toolbox: CodeToolbox
  ) {
    const view = vscode.window.createTreeView("codeToolbox", {
      treeDataProvider: this,
      showCollapseAll: true,
      canSelectMany: false,
      dragAndDropController: this,
    });
    context.subscriptions.push(view);
    this.toolbox.onSave = () => this.refresh();
  }

  getTreeItem(
    element: ToolboxTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: ToolboxTreeItem | undefined
  ): vscode.ProviderResult<ToolboxTreeItem[]> {
    return (
      this.toolbox.getElement(element?.id).childIds?.map((id) => {
        const curElement = this.toolbox.getElement(id);

        return new ToolboxTreeItem(
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
    source: readonly ToolboxTreeItem[],
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
      "application/vnd.code.tree.codeToolbox",
      new vscode.DataTransferItem(source[0])
    );
  }

  handleDrop(
    target: ToolboxTreeItem | undefined,
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    if (token.isCancellationRequested) {
      return;
    }

    const transferItem = dataTransfer.get(
      "application/vnd.code.tree.codeToolbox"
    );

    if (!transferItem) {
      return;
    }

    return this.toolbox.moveElement(transferItem.value.id, target?.id);
  }

  private refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export class ToolboxTreeItem extends vscode.TreeItem {
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

    if (collapsibleState !== vscode.TreeItemCollapsibleState.None) {
      return;
    }

    this.resourceUri = vscode.Uri.file(`./some-file${fileExtension || ""}`);
    this.command = {
      arguments: [this.id],
      command: "snippet.insertCodeFromToolbox",
      title: "Insert code",
      tooltip: "Insert code",
    };
  }
}
