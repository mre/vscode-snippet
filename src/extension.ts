"use strict";

import * as vscode from "vscode";
import { BackupManager } from "./backupManager";
import { cache } from "./cache";
import { CompletionManager } from "./completionManager";
import * as endpoints from "./endpoints";
import SnippetProvider from "./provider";
import SnippetsStorage from "./snippetsStorage";
import { SnippetsTreeProvider } from "./snippetsTreeProvider";

export function activate(ctx: vscode.ExtensionContext) {
  const snippetStorageKey = "snippet.snippetsStorageKey";
  ctx.globalState.setKeysForSync([snippetStorageKey]);

  const snippetsStorage = new SnippetsStorage(ctx, snippetStorageKey);
  const snippetsTreeProvider = new SnippetsTreeProvider(ctx, snippetsStorage);
  new CompletionManager(ctx, snippetsStorage);
  const backupManager = new BackupManager(ctx, snippetsStorage);

  vscode.commands.registerCommand("snippet.find", () =>
    endpoints.findDefault(snippetsStorage)
  );
  vscode.commands.registerCommand("snippet.findForLanguage", () =>
    endpoints.findForLanguage(snippetsStorage)
  );
  vscode.commands.registerCommand("snippet.findInplace", () =>
    endpoints.findInplace(snippetsStorage)
  );
  vscode.commands.registerCommand("snippet.findInNewEditor", () =>
    endpoints.findInNewEditor(snippetsStorage)
  );
  vscode.commands.registerCommand(
    "snippet.findSelectedText",
    endpoints.findSelectedText
  );
  vscode.commands.registerCommand("snippet.showPreviousAnswer", () =>
    endpoints.showPreviousAnswer(snippetsStorage)
  );
  vscode.commands.registerCommand("snippet.showNextAnswer", () =>
    endpoints.showNextAnswer(snippetsStorage)
  );
  vscode.commands.registerCommand(
    "snippet.toggleComments",
    endpoints.toggleComments
  );

  vscode.commands.registerCommand(
    "snippet.saveSnippet",
    endpoints.saveSnippet(snippetsTreeProvider)
  );
  vscode.commands.registerCommand(
    "snippet.insertSnippet",
    endpoints.insertSnippet(snippetsTreeProvider)
  );
  vscode.commands.registerCommand(
    "snippet.deleteSnippet",
    endpoints.deleteSnippet(snippetsTreeProvider)
  );
  vscode.commands.registerCommand(
    "snippet.renameSnippet",
    endpoints.renameSnippet(snippetsTreeProvider)
  );
  vscode.commands.registerCommand(
    "snippet.copySnippet",
    endpoints.copySnippet(snippetsTreeProvider)
  );
  vscode.commands.registerCommand(
    "snippet.findAndCopy",
    endpoints.findAndCopy(snippetsStorage)
  );
  vscode.commands.registerCommand(
    "snippet.createFolder",
    endpoints.createFolder(snippetsTreeProvider)
  );
  vscode.commands.registerCommand(
    "snippet.restoreBackups",
    endpoints.showBackups(backupManager)
  );

  if (process.env.NODE_ENV === "test") {
    vscode.commands.registerCommand(
      "snippet.test_moveElement",
      async (sourceId, targetId) =>
        await snippetsStorage.moveElement(sourceId, targetId)
    );
  }

  cache.state = ctx.globalState;
  const provider = new SnippetProvider();
  const disposableProvider =
    vscode.workspace.registerTextDocumentContentProvider("snippet", provider);
  ctx.subscriptions.push(disposableProvider);
}
