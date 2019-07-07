import * as vscode from 'vscode'

export function getConfig(param: string) {
    return vscode.workspace.getConfiguration('snippet')[param]
}

export async function getLanguage(): Promise<string> {
    let editor = vscode.window.activeTextEditor
    if (editor) {
        return editor.document.languageId
    }
    let defaultLanguage: string = getConfig('defaultLanguage')
    if (defaultLanguage && defaultLanguage.trim()) {
        return defaultLanguage
    }
    return await vscode.window.showInputBox({
        value: 'python',
        placeHolder: 'Find snippet for which programming language?',
    });
}
