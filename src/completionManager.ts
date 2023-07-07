import SnippetsStorage, { TreeElement } from "./snippetsStorage";
import * as vscode from "vscode";

export class CompletionManager {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly snippets: SnippetsStorage,
    private readonly registeredFileExtensions = new Set<string>()
  ) {
    for (const snippet of snippets.getSnippets()) {
      this.ensureRegistered(snippet);
    }

    snippets.onSnippetSave = (snippet) => {
      this.ensureRegistered(snippet);
    };
  }

  private ensureRegistered(snippet: TreeElement): void {
    const fileExtension = snippet.data.fileExtension;

    if (!fileExtension) {
      return;
    }

    if (this.registeredFileExtensions.has(fileExtension)) {
      return;
    }

    const fileSelector: vscode.DocumentSelector = {
      pattern: `**/*${fileExtension}`,
    };
    const provider = vscode.languages.registerCompletionItemProvider(
      fileSelector,
      ((snippets: SnippetsStorage) => ({
        provideCompletionItems() {
          const completions: vscode.CompletionItem[] = [];

          for (const snippet of snippets.getSnippets()) {
            if (snippet.data.fileExtension === fileExtension) {
              const completion = new vscode.CompletionItem(snippet.data.label);
              completion.insertText = snippet.data.content;
              completion.detail = "[snippet]";
              completion.documentation = snippet.data.content;
              completions.push(completion);
            }
          }

          return completions;
        },
      }))(this.snippets)
    );
    this.context.subscriptions.push(provider);
    this.registeredFileExtensions.add(fileExtension);
  }
}
