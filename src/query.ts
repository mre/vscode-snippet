"use strict";

import * as vscode from "vscode";
import { cache } from "./cache";
import SnippetsStorage from "./snippetsStorage";
import languages from "./languages";

function quickPickCustom(items: vscode.QuickPickItem[]): Promise<string> {
  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = 'Enter keywords for snippet search (e.g. "read file")';
    quickPick.items = items;

    quickPick.onDidChangeValue(() => {
      quickPick.activeItems = [];
    });

    quickPick.onDidAccept(() => {
      let search = "";
      if (quickPick.activeItems.length) {
        vscode.window.showInformationMessage(
          JSON.stringify(quickPick.activeItems[0]) // TODO: check if it's a saved snippet using a description (extract a class)
        );
        search = quickPick.activeItems[0]["label"];
      } else {
        search = quickPick.value;
      }
      quickPick.hide();
      resolve(search);
    });
    quickPick.show();
  });
}

export async function query(
  language: string,
  snippetsStorage: SnippetsStorage
): Promise<string> {
  const suggestions = new Set(
    cache.state.get<string[]>(`snippet_suggestions_${language}`, [])
  );

  const suggestionsQuickItems: Array<vscode.QuickPickItem> = [];

  const languageFileExtensions = languages.getExtensions(language);
  for (const snippet of snippetsStorage.getSnippets()) {
    if (languageFileExtensions.includes(snippet.data.fileExtension)) {
      suggestionsQuickItems.push({
        label: snippet.data.label,
        description: "[saved snippet]",
      });
    }
  }

  for (const suggestion of suggestions) {
    const tempQuickItem: vscode.QuickPickItem = {
      label: suggestion,
      description: "",
    };
    suggestionsQuickItems.push(tempQuickItem);
  }

  const input = await quickPickCustom(suggestionsQuickItems);
  // TODO: do not add if a snippet was selected
  suggestions.add(input);
  cache.state.update(
    `snippet_suggestions_${language}`,
    [...suggestions].sort()
  );
  return input;
}
