'use strict'

import * as vscode from 'vscode'
import { cache } from './cache'
import SnippetProvider, { MockSnippetProvider } from './provider'
import * as endpoints from './endpoints'

export function activate(ctx: vscode.ExtensionContext) {
    vscode.commands.registerCommand('snippet.find', endpoints.findDefault)
    vscode.commands.registerCommand('snippet.findForLanguage', endpoints.findForLanguage)
    vscode.commands.registerCommand('snippet.findInplace', endpoints.findInplace)
    vscode.commands.registerCommand('snippet.findInNewEditor', endpoints.findInNewEditor)
    vscode.commands.registerCommand('snippet.findSelectedText', endpoints.findSelectedText)
    vscode.commands.registerCommand('snippet.showPreviousAnswer', endpoints.showPreviousAnswer)
    vscode.commands.registerCommand('snippet.showNextAnswer', endpoints.showNextAnswer)
    vscode.commands.registerCommand('snippet.toggleComments', endpoints.toggleComments)

    cache.state = ctx.globalState
    let provider = process.env.NODE_ENV === 'test' ? new MockSnippetProvider() : new SnippetProvider();
    let disposableProvider = vscode.workspace.registerTextDocumentContentProvider("snippet", provider);
    ctx.subscriptions.push(
        disposableProvider,
    )
}
