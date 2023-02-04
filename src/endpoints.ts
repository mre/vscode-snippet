import * as vscode from "vscode";
import { pickLanguage, getLanguage, getConfig } from "./config";
import { query } from "./query";
import { encodeRequest } from "./provider";
import snippet from "./snippet";
import { SnippetsTreeProvider, SnippetsTreeItem } from "./snippetsTreeProvider";

export interface Request {
  language: string;
  query: string;
}

let loadingStatus = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left
);
loadingStatus.text = `$(clock) Loading Snippet ...`;

export async function findWithProvider(
  language: string,
  userQuery: string,
  verbose: boolean,
  number: number,
  openInNewEditor = true
) {
  loadingStatus.show();

  let uri = encodeRequest(userQuery, language, verbose, number);

  // Calls back into the provider
  let doc = await vscode.workspace.openTextDocument(uri);
  loadingStatus.hide();

  try {
    doc = await vscode.languages.setTextDocumentLanguage(doc, language);
  } catch (e) {
    console.log(`Cannot set document language to ${language}: ${e}`);
  }
  let editor = vscode.window.activeTextEditor;

  // Open in new editor in case the respective config flag is set to true
  // or there is no open user-created editor where we could paste the snippet in.
  if (openInNewEditor || !editor || editor.document.uri.scheme == "snippet") {
    await vscode.window.showTextDocument(doc, {
      viewColumn: vscode.ViewColumn.Two,
      preview: true,
      preserveFocus: true,
    });
  } else {
    let snippet = new vscode.SnippetString(doc.getText());
    let success = await editor.insertSnippet(snippet);
    if (!success) {
      vscode.window.showInformationMessage("Error while opening snippet.");
    }
  }
}

export async function getInput(): Promise<Request> {
  let language = await getLanguage();
  let userQuery = await query(language);
  return { language, query: userQuery };
}

export async function findForLanguage() {
  let language = await pickLanguage();
  let userQuery = await query(language);
  await findWithProvider(
    language,
    userQuery,
    snippet.getVerbose(),
    0,
    getConfig("openInNewEditor")
  );
}

export async function findDefault() {
  let request = await getInput();
  await findWithProvider(
    request.language,
    request.query,
    snippet.getVerbose(),
    0,
    getConfig("openInNewEditor")
  );
}

export async function findInplace() {
  let request = await getInput();
  await findWithProvider(
    request.language,
    request.query,
    snippet.getVerbose(),
    0,
    false
  );
}

export async function findInNewEditor() {
  let request = await getInput();
  await findWithProvider(
    request.language,
    request.query,
    snippet.getVerbose(),
    0,
    true
  );
}

export async function showNextAnswer() {
  if (!snippet.getCurrentQuery()) {
    return await findDefault();
  }
  const answerNumber = snippet.getNextAnswerNumber();
  await findWithProvider(
    await getLanguage(),
    snippet.getCurrentQuery(),
    snippet.getVerbose(),
    answerNumber,
    getConfig("openInNewEditor")
  );
}

export async function showPreviousAnswer() {
  if (!snippet.getCurrentQuery()) {
    return await findDefault();
  }
  const answerNumber = snippet.getPreviousAnswerNumber();
  if (answerNumber == null) {
    vscode.window.showInformationMessage("already at first snippet");
    return;
  }
  await findWithProvider(
    await getLanguage(),
    snippet.getCurrentQuery(),
    snippet.getVerbose(),
    answerNumber,
    getConfig("openInNewEditor")
  );
}

export async function toggleComments() {
  snippet.toggleVerbose();
  await findWithProvider(
    await getLanguage(),
    snippet.getCurrentQuery(),
    snippet.getVerbose(),
    snippet.getCurrentAnswerNumber(),
    getConfig("openInNewEditor")
  );
}

export async function findSelectedText() {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("There is no open editor window");
    return;
  }
  let selection = editor.selection;
  let query = editor.document.getText(selection);
  let language = await getLanguage();
  await findWithProvider(
    language,
    query,
    snippet.getVerbose(),
    0,
    getConfig("openInNewEditor")
  );
}

export function saveSnippet(treeProvider: SnippetsTreeProvider) {
  return () => {
    const showNoTextMsg = () =>
      vscode.window.showInformationMessage(
        "Select a piece of code in the editor to save it."
      );

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      showNoTextMsg();
      return;
    }

    editor.edit(() => {
      const content = editor.document.getText(editor.selection);

      if (content.length < 1) {
        showNoTextMsg();
        return;
      }

      const defaultLabel = content.substring(0, 100);
      const fileName = editor.document.fileName;
      const indexOfLastDot = fileName.lastIndexOf(".");
      const fileExtension =
        indexOfLastDot === -1 ? "" : fileName.slice(indexOfLastDot);

      const opt: vscode.InputBoxOptions = {
        ignoreFocusOut: false,
        placeHolder: "Snippet Name",
        prompt: "Give the snippet a name...",
        value: defaultLabel,
      };

      vscode.window.showInputBox(opt).then(async (label) => {
        await treeProvider.storage.saveCode(content, fileExtension, label);

        await vscode.commands.executeCommand("snippetsView.focus");
      });
    });
  };
}

export function insertSnippet(treeProvider: SnippetsTreeProvider) {
  return (id: string) => {
    if (!id) {
      vscode.window.showInformationMessage(
        "Insert a snippet into the editor by clicking on it in the Snippets view."
      );
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(
        "Open a file in the editor to insert a snippet."
      );
      return;
    }

    const content = treeProvider.storage.getCode(id);

    if (content) {
      editor.edit((builder) => {
        builder.insert(editor.selection.start, content);
      });
    }
  };
}

export function deleteSnippet(treeProvider: SnippetsTreeProvider) {
  return async (item: SnippetsTreeItem) => {
    if (!item) {
      vscode.window.showInformationMessage(
        'Delete a snippet or a folder by right clicking on it in the list and selecting "Delete"'
      );
      return;
    }

    await treeProvider.storage.deleteElement(item.id!);
  };
}

export function renameSnippet(treeProvider: SnippetsTreeProvider) {
  return async (item: SnippetsTreeItem) => {
    if (!item) {
      vscode.window.showInformationMessage(
        'Rename a snippet or a folder by right clicking on it in the list and selecting "Rename"'
      );
      return;
    }

    const opt: vscode.InputBoxOptions = {
      ignoreFocusOut: false,
      placeHolder: "New Name",
      prompt: "Rename...",
      value: item.label,
    };

    const newName = await vscode.window.showInputBox(opt);

    if (!newName) {
      return;
    }

    await treeProvider.storage.renameElement(item.id, newName);
  };
}

export function createFolder(treeProvider: SnippetsTreeProvider) {
  return async (item?: SnippetsTreeItem) => {
    const opt: vscode.InputBoxOptions = {
      ignoreFocusOut: false,
      placeHolder: "Folder Name",
      prompt: "Specify Folder Name...",
      validateInput: (value: string) => {
        if (value.includes("/")) {
          return 'Folder name cannot contain "/"';
        }
        return null;
      },
    };

    const folderName = await vscode.window.showInputBox(opt);

    if (!folderName) {
      return;
    }

    await treeProvider.storage.createFolder(folderName, item?.id);
  };
}
