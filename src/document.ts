
import * as vscode from 'vscode'

async function newDocument(language, content) {
    let document = await vscode.workspace.openTextDocument({ language, content })
    let column = vscode.ViewColumn.Two
    if (!vscode.ViewColumn) {
        column = vscode.ViewColumn.One
    }
    vscode.window.showTextDocument(document, column)
}

export async function showSnippet(content: string, language: string, openInNewEditor = true) {
    if (openInNewEditor) {
        newDocument(language, content)
        return
    }

    let editor = vscode.window.activeTextEditor
    if (!editor) {
        newDocument(language, content)
    }

    if (openInNewEditor) {
        editor.edit(
            edit => editor.selections.forEach(
                selection => {
                    edit.insert(selection.end, "\n" + content);
                }
            )
        );
    } else {
        // Replace the old contents of the current editor window.
        // This should be improved since we use a range over all lines of the document
        // rather than replacing the entire document of the editor.
        let lineCount = editor.document.lineCount
        editor.edit(
            edit => edit.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(lineCount, 10000)), content)
        );
    }
}