import * as vscode from 'vscode';
import { cache } from './cache';
import SnippetProvider from './provider';
import * as endpoints from './endpoints';

const loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
loadingStatus.text = `$(clock) Loading Snippet ...`;


export function activate(ctx: vscode.ExtensionContext) {
    vscode.commands.registerCommand('snippet.find', () => {
        loadingStatus.show();
        endpoints.findDefault().finally(() => loadingStatus.hide());
    });
    vscode.commands.registerCommand('snippet.findForLanguage', () => {
        loadingStatus.show();
        endpoints.findForLanguage().finally(() => loadingStatus.hide());
    });
    vscode.commands.registerCommand('snippet.findInplace', () => {
        loadingStatus.show();
        endpoints.findInplace().finally(() => loadingStatus.hide());
    });
    vscode.commands.registerCommand('snippet.findInNewEditor', () => {
        loadingStatus.show();
        endpoints.findInNewEditor().finally(() => loadingStatus.hide());
    });
    vscode.commands.registerCommand('snippet.findSelectedText', () => {
        loadingStatus.show();
        endpoints.findSelectedText()
            .catch(message => vscode.window.showErrorMessage(message))
            .finally(() => loadingStatus.hide());
    });
    vscode.commands.registerCommand('snippet.showPreviousAnswer', () => {
        loadingStatus.show();
        endpoints.showPreviousAnswer().finally(() => loadingStatus.hide());
    });
    vscode.commands.registerCommand('snippet.showNextAnswer', () => {
        loadingStatus.show();
        endpoints.showNextAnswer().finally(() => loadingStatus.hide());
    });
    vscode.commands.registerCommand('snippet.toggleComments', () => {
        loadingStatus.show();
        endpoints.toggleComments().finally(() => loadingStatus.hide());
    });

    cache.state = ctx.globalState;
    const provider = new SnippetProvider();
    const disposableProvider = vscode.workspace.registerTextDocumentContentProvider('snippet', provider);
    ctx.subscriptions.push(disposableProvider);
};
