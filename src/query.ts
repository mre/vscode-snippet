"use strict";

import * as vscode from "vscode";
import { cache } from "./cache";

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

export async function query(language: string): Promise<string> {
  const suggestions = new Set(
    cache.state.get<string[]>(`snippet_suggestions_${language}`, [])
  );

  const suggestionsQuickItems: Array<vscode.QuickPickItem> = [];
  for (const suggestion of suggestions) {
    const tempQuickItem: vscode.QuickPickItem = {
      label: suggestion,
      description: "",
    };
    suggestionsQuickItems.push(tempQuickItem);
  }
  const input = await quickPickCustom(suggestionsQuickItems);
  suggestions.add(input);
  cache.state.update(
    `snippet_suggestions_${language}`,
    [...suggestions].sort()
  );
  return input;
}
