import { nanoid } from "nanoid";
import * as vscode from "vscode";

export interface TreeElement {
  item: TreeElementItem;
  parentId?: string;
  childIds?: string[];
}

export interface TreeElementItem {
  id: string;
  label: string;
  content: string;
}

export default class CodeToolbox {
  private readonly storageKey = "snippet.codeToolboxStorage";
  private elements = new Map<string, TreeElement>();
  private rootId: string = "";

  constructor(private readonly context: vscode.ExtensionContext) {
    // const root = {
    //   id: nanoid(),
    //   label: "label",
    //   content: "1",
    // };
    // const child = {
    //   id: nanoid(),
    //   label: "label",
    //   content: "2",
    // };
    // const child2 = {
    //   id: nanoid(),
    //   label: "label",
    //   content: "3",
    // };
    // const child3 = {
    //   id: nanoid(),
    //   label: "label",
    //   content: "4",
    // };
    // const leaf = {
    //   id: nanoid(),
    //   label: "label",
    //   content: "5",
    // };
    // const leaf2 = {
    //   id: nanoid(),
    //   label: "label",
    //   content: "6",
    // };

    // this.rootId = root.id!;

    // this.elements.set(this.rootId, {
    //   item: root,
    //   childIds: [child.id!, child2.id!, child3.id!],
    // });
    // this.elements.set(child2.id!, {
    //   item: child2,
    //   parentId: this.rootId,
    //   childIds: [],
    // });
    // this.elements.set(child3.id!, {
    //   item: child3,
    //   parentId: this.rootId,
    //   childIds: [],
    // });
    // this.elements.set(child.id!, {
    //   item: child,
    //   parentId: root.id,
    //   childIds: [leaf.id!, leaf2.id!],
    // });
    // this.elements.set(leaf.id!, { item: leaf, parentId: child.id });
    // this.elements.set(leaf2.id!, { item: leaf2, parentId: child.id });

    this.load();
  }

  getElement(id?: string): TreeElement {
    const result = this.elements.get(id ?? this.rootId);

    if (result == null) {
      throw new Error(`Expected to find an element with id ${id}`);
    }

    return result;
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
        curElement?.item.id === sourceId ||
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

  async saveCode(content: string, label?: string): Promise<void> {
    const item: TreeElementItem = {
      id: nanoid(),
      label: label || "untitled",
      content,
    };

    this.elements.set(item.id, { item, parentId: this.rootId });
    this.elements.get(this.rootId)?.childIds?.push(item.id);

    await this.save();
  }

  getCode(id: string): string {
    return this.elements.get(id)?.item.content?.toString() ?? "";
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
      this.elements.set(element.item.id, element);

      if (!element.parentId) {
        this.rootId = element.item.id;
      }
    });
  }
}
