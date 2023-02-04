"use strict";

import * as vscode from "vscode";
import { cache } from "./cache";
import SnippetProvider from "./provider";
import * as endpoints from "./endpoints";
import { SnippetsTreeProvider } from "./snippetsTreeProvider";
import SnippetsStorage from "./snippetsStorage";

export function activate(ctx: vscode.ExtensionContext) {
  const snippetsStorage = new SnippetsStorage(ctx);
  const snippetsTreeProvider = new SnippetsTreeProvider(ctx, snippetsStorage);

  vscode.commands.registerCommand("snippet.find", endpoints.findDefault);
  vscode.commands.registerCommand(
    "snippet.findForLanguage",
    endpoints.findForLanguage
  );
  vscode.commands.registerCommand("snippet.findInplace", endpoints.findInplace);
  vscode.commands.registerCommand(
    "snippet.findInNewEditor",
    endpoints.findInNewEditor
  );
  vscode.commands.registerCommand(
    "snippet.findSelectedText",
    endpoints.findSelectedText
  );
  vscode.commands.registerCommand(
    "snippet.showPreviousAnswer",
    endpoints.showPreviousAnswer
  );
  vscode.commands.registerCommand(
    "snippet.showNextAnswer",
    endpoints.showNextAnswer
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
    "snippet.createFolder",
    endpoints.createFolder(snippetsTreeProvider)
  );

  cache.state = ctx.globalState;
  let provider = new SnippetProvider();
  let disposableProvider = vscode.workspace.registerTextDocumentContentProvider(
    "snippet",
    provider
  );
  ctx.subscriptions.push(disposableProvider);
}
