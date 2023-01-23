'use strict'

import * as vscode from 'vscode'
import { cache } from './cache'
import SnippetProvider from './provider'
import * as endpoints from './endpoints'
import { CodeToolboxTreeProvider } from './codeToolboxTreeProvider'
import CodeToolbox from './codeToolbox'

export function activate(ctx: vscode.ExtensionContext) {
    const toolbox = new CodeToolbox(ctx);
    const toolboxTreeProvider = new CodeToolboxTreeProvider(ctx, toolbox);

    vscode.commands.registerCommand('snippet.find', endpoints.findDefault)
    vscode.commands.registerCommand('snippet.findForLanguage', endpoints.findForLanguage)
    vscode.commands.registerCommand('snippet.findInplace', endpoints.findInplace)
    vscode.commands.registerCommand('snippet.findInNewEditor', endpoints.findInNewEditor)
    vscode.commands.registerCommand('snippet.findSelectedText', endpoints.findSelectedText)
    vscode.commands.registerCommand('snippet.showPreviousAnswer', endpoints.showPreviousAnswer)
    vscode.commands.registerCommand('snippet.showNextAnswer', endpoints.showNextAnswer)
    vscode.commands.registerCommand('snippet.toggleComments', endpoints.toggleComments)

    vscode.commands.registerCommand('snippet.saveToCodeToolbox', endpoints.saveToCodeToolbox(toolbox, toolboxTreeProvider))
    vscode.commands.registerCommand('snippet.insertCodeFromToolbox', endpoints.insertCodeFromToolbox(toolbox))

    cache.state = ctx.globalState
    let provider = new SnippetProvider();
    let disposableProvider = vscode.workspace.registerTextDocumentContentProvider("snippet", provider);
    ctx.subscriptions.push(
        disposableProvider,
    )
}
