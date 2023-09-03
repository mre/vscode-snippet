"use strict";

import * as vscode from "vscode";
import { cache } from "./cache";
import SnippetProvider from "./provider";
import * as endpoints from "./endpoints";
import { SnippetsTreeProvider } from "./snippetsTreeProvider";
import SnippetsStorage from "./snippetsStorage";
import { CompletionManager } from "./completionManager";

export function activate(ctx: vscode.ExtensionContext) {
  const snippetStorageKey = "snippet.snippetsStorageKey";
  ctx.globalState.setKeysForSync([snippetStorageKey]);

  const snippetsStorage = new SnippetsStorage(ctx, snippetStorageKey);
  const snippetsTreeProvider = new SnippetsTreeProvider(ctx, snippetsStorage);
  new CompletionManager(ctx, snippetsStorage);

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
    "snippet.createFolder",
    endpoints.createFolder(snippetsTreeProvider)
  );

  cache.state = ctx.globalState;
  const provider = new SnippetProvider();
  const disposableProvider =
    vscode.workspace.registerTextDocumentContentProvider("snippet", provider);
  ctx.subscriptions.push(disposableProvider);
}
