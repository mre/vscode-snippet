import { nanoid } from "nanoid";
import * as vscode from "vscode";

export interface TreeElement {
  data: TreeElementData;
  parentId?: string;
  childIds?: string[];
}

export interface TreeElementData {
  id: string;
  label: string;
  content: string;
  fileExtension?: string;
}

export default class CodeToolbox {
  private readonly storageKey = "snippet.codeToolboxStorage";
  private elements = new Map<string, TreeElement>();
  private rootId: string = "";

  constructor(private readonly context: vscode.ExtensionContext) {
    const root = {
      id: nanoid(),
      label: "label 1",
      content: "1",
    };
    const child = {
      id: nanoid(),
      label: "label 2",
      content: "2",
    };
    const child2 = {
      id: nanoid(),
      label: "label 3",
      content: "3",
    };
    const child3 = {
      id: nanoid(),
      label: "label 4",
      content: "4",
    };
    const leaf = {
      id: nanoid(),
      label: "label 5",
      content: "5",
    };
    const leaf2 = {
      id: nanoid(),
      label: "label 6",
      content: "6",
    };

    this.rootId = root.id!;

    this.elements.set(this.rootId, {
      data: root,
      childIds: [child.id!, child2.id!, child3.id!],
    });
    this.elements.set(child2.id!, {
      data: child2,
      parentId: this.rootId,
      childIds: [],
    });
    this.elements.set(child3.id!, {
      data: child3,
      parentId: this.rootId,
      childIds: [],
    });
    this.elements.set(child.id!, {
      data: child,
      parentId: root.id,
      childIds: [leaf.id!, leaf2.id!],
    });
    this.elements.set(leaf.id!, { data: leaf, parentId: child.id });
    this.elements.set(leaf2.id!, { data: leaf2, parentId: child.id });

    // this.save().then(() => this.load());
    this.load();
  }

  getElement(id?: string): TreeElement {
    const result = this.elements.get(id ?? this.rootId);

    if (result == null) {
      throw new Error(`Expected to find an element with id ${id}`);
    }

    return result;
  }

  async deleteElement(id: string): Promise<void> {
    const toDelete = this.getElement(id);
    const messageForUser =
      toDelete.childIds == null
        ? "Are you sure you want to delete this code fragment?"
        : "Are you sure you want to delete this folder? Everything inside it will be deleted too.";

    const answer = await vscode.window.showInformationMessage(
      messageForUser,
      "Yes",
      "No"
    );

    if (answer !== "Yes") {
      return;
    }

    this.elements.delete(id);
    const parent = this.getElement(toDelete.parentId);
    // TODO: refactor (dup with move)
    parent.childIds?.splice(
      parent.childIds.findIndex((x) => x === id),
      1
    );

    await this.save();
  }

  async renameElement(id: string, newName: string): Promise<void> {
    // TODO: save and refresh automatically ?
    this.getElement(id).data.label = newName;
    await this.save();
  }

  async createFolder(name: string, relativeToId?: string) {
    const relativeToElement = this.getElement(relativeToId); // TODO: use getElement or this.elements.get

    const parentId =
      relativeToElement.childIds == null
        ? relativeToElement.parentId
        : relativeToElement.data.id;

    const folder: TreeElementData = {
      id: nanoid(),
      label: name,
      content: "", // TODO: make optional (not needed in folders)
    };

    this.elements.set(folder.id, { childIds: [], data: folder, parentId });
    this.elements.get(parentId).childIds?.push(folder.id);

    await this.save();
  }

  async moveElement(sourceId: string, targetId?: string) {
    if (targetId === sourceId) {
      return;
    }

    const sourceElement = this.elements.get(sourceId);
    const targetElement = this.elements.get(targetId);
    const targetIsRoot = targetId == null;

    const newParentId = targetIsRoot
      ? this.rootId
      : targetElement.childIds == null
      ? targetElement.parentId
      : targetId;

    let tempId = newParentId;
    while (tempId) {
      const curElement = this.elements.get(tempId);
      if (
        curElement?.data.id === sourceId ||
        curElement?.parentId === sourceId
      ) {
        return;
      }
      tempId = curElement?.parentId;
    }

    const previousParent = this.elements.get(sourceElement.parentId!);
    previousParent?.childIds?.splice(
      previousParent.childIds.findIndex((id) => id === sourceId),
      1
    );

    sourceElement.parentId = newParentId;
    const newParentElement = this.elements.get(newParentId!);
    newParentElement?.childIds?.push(sourceId);

    await this.save();
  }

  async saveCode(
    content: string,
    fileExtension: string,
    label?: string
  ): Promise<void> {
    const data: TreeElementData = {
      id: nanoid(),
      label: label || "untitled",
      content,
      fileExtension,
    };

    this.elements.set(data.id, { data, parentId: this.rootId });
    this.elements.get(this.rootId)?.childIds?.push(data.id);

    await this.save();
  }

  getCode(id: string): string {
    return this.elements.get(id)?.data.content?.toString() ?? "";
  }

  async save(): Promise<void> {
    await this.context.globalState.update(this.storageKey, this.serialize());
  }

  load() {
    this.deserialize(this.context.globalState.get(this.storageKey) || "[]");
  }

  private serialize(): string {
    return JSON.stringify([...this.elements.values()]);
  }

  private deserialize(json: string): void {
    this.elements.clear();
    const tree = JSON.parse(json) as TreeElement[];

    tree.forEach((element) => {
      this.elements.set(element.data.id, element);

      if (!element.parentId) {
        this.rootId = element.data.id;
      }
    });
  }
}
