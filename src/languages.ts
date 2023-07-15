import * as vscode from "vscode";

class Languages {
  constructor(private readonly fileExtensions = new Map<string, string[]>()) {
    for (const extension of vscode.extensions.all) {
      const languages = extension.packageJSON.contributes.languages;
      if (languages) {
        for (const lang of languages) {
          fileExtensions.set(lang.id, lang.extensions);
        }
      }
    }
  }

  getExtensions(languageId: string): string[] {
    return this.fileExtensions.get(languageId) || [];
  }
}

export default new Languages();
