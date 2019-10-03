
import * as vscode from 'vscode';


async function newDocument(
    language: string,
    content: string
) {
    const document = await vscode.workspace.openTextDocument({ language, content });
    let column = vscode.ViewColumn.Two;

    if (!vscode.ViewColumn) { column = vscode.ViewColumn.One; }

    vscode.window.showTextDocument(document, column);
};

export const showSnippet = async (
    content: string,
    language: string,
    openInNewEditor = true
): Promise<void> => {
    if (openInNewEditor) { return newDocument(language, content); }

    const editor = vscode.window.activeTextEditor;

    if (!editor) { return newDocument(language, content); }

    if (openInNewEditor) {
        editor.edit(edit => editor.selections.forEach(selection => edit.insert(selection.end, '\n' + content)));
    } else {
        /**
         * TODO: Replace the old contents of the current editor window.
         * This should be improved since we use a range over all lines of the document
         * rather than replacing the entire document of the editor.
         */
        const lineCount = editor.document.lineCount;
    
        editor.edit(
            edit => edit.replace(
                new vscode.Range(new vscode.Position(0, 0), new vscode.Position(lineCount, 10000)),
                content
            )
        );
    }

    return Promise.resolve();
};
