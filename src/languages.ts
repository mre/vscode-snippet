import * as vscode from "vscode";

class Languages {
  constructor(private readonly fileExtensions = new Map<string, string[]>()) {
    for (const extension of vscode.extensions.all) {
      const languages = extension?.packageJSON?.contributes?.languages;
      if (languages && Array.isArray(languages)) {
        for (const lang of languages) {
          if (
            lang &&
            lang.id &&
            lang.extensions &&
            Array.isArray(lang.extensions)
          ) {
            fileExtensions.set(lang.id, lang.extensions);
          }
        }
      }
    }
  }

  getExtensions(languageId: string): string[] {
    return this.fileExtensions.get(languageId) || [];
  }
}

export default new Languages();
