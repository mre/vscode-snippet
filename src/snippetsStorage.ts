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

export default class SnippetsStorage {
  public onSave = () => {};
  private readonly storageKey = "snippet.snippetsStorageKey";
  private readonly elements = new Map<string, TreeElement>();
  private rootId: string = "";

  constructor(private readonly context: vscode.ExtensionContext) {
    this.load();

    if (!this.elements.size) {
      this.loadDefaultElements();
    }
  }

  getFoldersList(): string[] {
    const list: string[] = [];

    this.populateFoldersList(list, this.getElement(this.rootId), "/");
    list.sort((a, b) => a.localeCompare(b));

    return list;
  }

  private populateFoldersList(
    list: string[],
    parent: TreeElement,
    currentFolder: string
  ): void {
    list.push(currentFolder);

    for (const childId of parent.childIds) {
      const child = this.getElement(childId);

      if (this.isFolder(child)) {
        const joinedName = `${
          currentFolder === "/" ? "/" : `${currentFolder}/`
        }${child.data.label}`;

        this.populateFoldersList(list, child, joinedName);
      }
    }
  }

  getElement(id?: string): TreeElement | undefined {
    const providedOrRootId = id ?? this.rootId;

    const result = this.elements.get(providedOrRootId);

    return result || undefined;
  }

  async deleteElement(id: string): Promise<void> {
    const toDelete = this.getElement(id);
    const messageForUser = this.isFolder(toDelete)
      ? "Are you sure you want to delete this folder? Everything inside it will be deleted too."
      : "Are you sure you want to delete this snippet?";

    const answer = await vscode.window.showInformationMessage(
      messageForUser,
      { modal: true },
      "Yes",
      "No"
    );

    if (answer !== "Yes") {
      return;
    }

    this.elements.delete(id);
    const parent = this.getElement(toDelete.parentId);
    parent.childIds?.splice(
      parent.childIds.findIndex((x) => x === id),
      1
    );

    await this.save();
  }

  async renameElement(id: string, newName: string): Promise<void> {
    this.getElement(id).data.label = newName;
    await this.save();
  }

  // TODO: add checks if folder with the name exists or snippet with the name exists (one create, on rename and on move)
  async createFolder(name: string, relativeToId?: string): Promise<void> {
    const relativeToElement = this.getElement(relativeToId);

    const parentId = this.isFolder(relativeToElement)
      ? relativeToElement.data.id
      : relativeToElement.parentId;

    const folder: TreeElementData = {
      id: nanoid(),
      label: name,
      content: "",
    };

    this.elements.set(folder.id, { childIds: [], data: folder, parentId });
    this.getElement(parentId).childIds?.push(folder.id);

    await this.save();
  }

  async moveElement(sourceId: string, targetId?: string): Promise<void> {
    if (targetId === sourceId) {
      return;
    }

    const sourceElement = this.getElement(sourceId);
    const targetElement = this.getElement(targetId);

    const newParentId = this.isFolder(targetElement)
      ? targetElement.data.id
      : targetElement.parentId;

    let tempId = newParentId;
    while (tempId) {
      const curElement = this.getElement(tempId);
      if (
        curElement?.data.id === sourceId ||
        curElement?.parentId === sourceId
      ) {
        return;
      }
      tempId = curElement?.parentId;
    }

    const previousParent = this.getElement(sourceElement.parentId);
    previousParent.childIds?.splice(
      previousParent.childIds.findIndex((id) => id === sourceId),
      1
    );

    sourceElement.parentId = newParentId;
    const newParentElement = this.getElement(newParentId);
    newParentElement.childIds?.push(sourceId);

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
    this.getElement(this.rootId).childIds?.push(data.id);

    await this.save();
  }

  getCode(id: string): string {
    return this.getElement(id).data.content?.toString() || "";
  }

  async save(): Promise<void> {
    await this.context.globalState.update(this.storageKey, this.serialize());
    this.onSave();
  }

  load(): void {
    this.deserialize(this.context.globalState.get(this.storageKey) || "[]");
  }

  private async loadDefaultElements(): Promise<void> {
    const root: TreeElementData = {
      id: nanoid(),
      label: "root",
      content: "",
    };
    const exampleFolder: TreeElementData = {
      id: nanoid(),
      label: "example folder",
      content: "",
    };
    const exampleSnippet: TreeElementData = {
      id: nanoid(),
      label: "example snippet",
      fileExtension: ".js",
      content: `for (let i = 0; i < 5; i++) {
  console.log('Hello world!');
}
`,
    };

    this.rootId = root.id;

    this.elements.set(root.id, {
      data: root,
      childIds: [exampleFolder.id],
    });
    this.elements.set(exampleFolder.id, {
      data: exampleFolder,
      childIds: [exampleSnippet.id],
      parentId: root.id,
    });
    this.elements.set(exampleSnippet.id, {
      data: exampleSnippet,
      parentId: exampleFolder.id,
    });

    await this.save();
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

  private isFolder(element: TreeElement): boolean {
    return element.childIds != null;
  }
}
