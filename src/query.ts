"use strict";

import * as vscode from "vscode";
import { cache } from "./cache";
import SnippetsStorage from "./snippetsStorage";
import languages from "./languages";

function quickPickCustom(
  items: vscode.QuickPickItem[],
  clearActiveItems = true
): Promise<string | vscode.QuickPickItem> {
  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = 'Enter keywords for snippet search (e.g. "read file")';
    quickPick.items = items;

    quickPick.onDidChangeValue(() => {
      if (clearActiveItems) {
        quickPick.activeItems = [];
      }
    });

    quickPick.onDidAccept(() => {
      let search: string | vscode.QuickPickItem = "";
      if (quickPick.activeItems.length) {
        search = quickPick.activeItems[0];
      } else {
        search = quickPick.value;
      }
      quickPick.hide();
      resolve(search);
    });
    quickPick.show();
  });
}

export interface QueryResult {
  input: string;
  savedSnippetContent?: string;
}

export async function query(
  language: string,
  snippetsStorage: SnippetsStorage,
  suggestOnlySaved = false
): Promise<QueryResult> {
  const suggestions = new Set(
    cache.state.get<string[]>(`snippet_suggestions_${language}`, [])
  );

  const suggestionsQuickItems: Array<vscode.QuickPickItem> = [];
  const languageFileExtensions = languages.getExtensions(language);
  const savedSnippetDescription = "[saved snippet]";

  for (const snippet of snippetsStorage.getSnippets()) {
    if (languageFileExtensions.includes(snippet.data.fileExtension)) {
      suggestionsQuickItems.push({
        label: snippet.data.label,
        detail: snippet.data.content,
        description: savedSnippetDescription,
      });
    }
  }

  if (!suggestOnlySaved) {
    for (const suggestion of suggestions) {
      const tempQuickItem: vscode.QuickPickItem = {
        label: suggestion,
        description: "",
      };
      suggestionsQuickItems.push(tempQuickItem);
    }
  }

  const selectedItem = await quickPickCustom(
    suggestionsQuickItems,
    !suggestOnlySaved
  );
  const input =
    typeof selectedItem === "string" ? selectedItem : selectedItem.label;
  const savedSnippetContent =
    typeof selectedItem === "string" ||
    selectedItem.description !== savedSnippetDescription
      ? undefined
      : selectedItem.detail;

  if (!savedSnippetContent) {
    suggestions.add(input);
    cache.state.update(
      `snippet_suggestions_${language}`,
      [...suggestions].sort()
    );
  }
  return { input, savedSnippetContent };
}
