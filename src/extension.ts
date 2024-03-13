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

  ctx.subscriptions.push(
    vscode.commands.registerCommand("snippet.find", () =>
      endpoints.findDefault(snippetsStorage)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand("snippet.findForLanguage", () =>
      endpoints.findForLanguage(snippetsStorage)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand("snippet.findInplace", () =>
      endpoints.findInplace(snippetsStorage)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand("snippet.findInNewEditor", () =>
      endpoints.findInNewEditor(snippetsStorage)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.findSelectedText",
      endpoints.findSelectedText
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand("snippet.showPreviousAnswer", () =>
      endpoints.showPreviousAnswer(snippetsStorage)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand("snippet.showNextAnswer", () =>
      endpoints.showNextAnswer(snippetsStorage)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.toggleComments",
      endpoints.toggleComments
    )
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.saveSnippet",
      endpoints.saveSnippet(snippetsTreeProvider)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.insertSnippet",
      endpoints.insertSnippet(snippetsTreeProvider)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.deleteSnippet",
      endpoints.deleteSnippet(snippetsTreeProvider)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.renameSnippet",
      endpoints.renameSnippet(snippetsTreeProvider)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.copySnippet",
      endpoints.copySnippet(snippetsTreeProvider)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.findAndCopy",
      endpoints.findAndCopy(snippetsStorage)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.createFolder",
      endpoints.createFolder(snippetsTreeProvider)
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "snippet.restoreBackups",
      endpoints.showBackups(backupManager)
    )
  );
  if (process.env.NODE_ENV === "test") {
    ctx.subscriptions.push(
      vscode.commands.registerCommand(
        "snippet.test_moveElement",
        async (sourceId, targetId) =>
          await snippetsStorage.moveElement(sourceId, targetId)
      )
    );
  }

  cache.state = ctx.globalState;
  const provider = new SnippetProvider();
  ctx.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("snippet", provider)
  );
}
