import * as vscode from 'vscode';


export const getDefaultLanguageConfig = (param: string): string => {
    return vscode.workspace.getConfiguration('snippet')[param];
};

export const getCommentCurrentStateConfig = (param: string): boolean => {
    return vscode.workspace.getConfiguration('snippet')[param];
};

export const getOpenInNewEditorConfig = (param: string): boolean => {
    return vscode.workspace.getConfiguration('snippet')[param];
};

export const getLanguage = async (): Promise<string> => {
    const editor = vscode.window.activeTextEditor;

    if (editor) { return Promise.resolve(editor.document.languageId); }

    const defaultLanguage: string = getDefaultLanguageConfig('defaultLanguage');
    const hasDefaultLanguage = defaultLanguage && defaultLanguage.trim();

    if (hasDefaultLanguage) { return Promise.resolve(defaultLanguage); }

    const language = await vscode.window.showInputBox({
        value: 'python',
        placeHolder: 'Find snippet for which programming language?',
    });

    return Promise.resolve(language);
};
