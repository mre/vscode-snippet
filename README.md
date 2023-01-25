<img width="50" src="https://raw.githubusercontent.com/mre/vscode-snippet/master/contrib/icon.png">

# vscode-snippet

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/release/mre/vscode-snippet.svg?style=flat-square)](https://github.com/mre/vscode-snippet/releases)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Snippet-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=)](https://marketplace.visualstudio.com/items?itemName=vscode-snippet.Snippet)

A Visual Studio Code extension for [cht.sh](https://cht.sh/).  
[Watch this lightning talk to learn more](https://www.youtube.com/watch?v=edGVRJf6uvg).

## Features

- Zero configuration: works out of the box.
- Automatically detects programming language from current editor window.

## Config options

- `openInNewEditor`: open snippets or in new editor window (default) in line with current document.
- `verbose`: add comments around code snippets.
- `baseUrl`: base url of the cheat server ([see cheat.sh documentation](https://github.com/chubin/cheat.sh/issues/98#issuecomment-412472258))
- `http.proxy`: VS Code proxy setting. If set, requests made by vscode-snippet will be sent through provided proxy ([see Visual Studio Code network settings](https://code.visualstudio.com/docs/setup/network))
- `defaultLanguage`: Programming language name in lower case to use as default language when there is no open editor window.
- `title`: Template string of a snippet title. You can use the following variables:
  - ${language} - the programming language
  - ${query} - the snippet query (search text)
  - ${index} - the index of the snippet (e.g. 2 for the third answer)

## Installation

Install this extension from the [VSCode
Marketplace](https://marketplace.visualstudio.com/items?itemName=vscode-snippet.Snippet)

## Usage

## Search for a snippet

1. Hit <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>p</kbd>
2. Run `Snippet: Find`.
3. Type your query and hit enter.

![Preview](https://raw.githubusercontent.com/mre/vscode-snippet/master/contrib/find.gif)

### Moving between answers

Sometimes the first answer is not what you're looking for.  
In that case, use `Snippet: Show next answer` and `Snippet: Show previous answer` to show alternative snippets.

### Search for snippet based on selected text

1. Select some text in an editor window.
2. Right click and choose "Find snippet from selected text"

![Preview](https://raw.githubusercontent.com/mre/vscode-snippet/master/contrib/findSelectedMenu.gif)

Alternatively, you can also run the `Snippet: Find Selected Text` from the
command menu:

![Preview](https://raw.githubusercontent.com/mre/vscode-snippet/master/contrib/findSelected.gif)

You can configure a keyboard shortcut. By default this is <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>s</kbd>:

![Preview](https://raw.githubusercontent.com/mre/vscode-snippet/master/contrib/findSelectedShortcut.gif)

### Saving a code fragment to the Code Toolbox

1. Select some text in an editor window.
2. Right click and choose "Save to code toolbox"
3. Enter a name of the code fragment
4. Press <kbd>Enter</kbd>

### Inserting a code fragment to the current cursor position

1. Open the Explorer by clicking <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>E</kdb>
2. Open the Code Toolbox section
3. Click on the code fragment that you want to insert

### Creating a folder for the code fragments

1. Open the Code Toolbox section
2. Click on the <kbd>+</kbd> icon (alternatively, you can right click on any code fragment or a folder and select "New Folder")
3. Enter a name of the folder
4. Press <kbd>Enter</kbd>

### Renaming a code fragment or a folder

1. Open the Code Toolbox section
2. Right click on the code fragment or a folder that you want to rename
3. Select "Rename"
4. Enter a new name
5. Press <kbd>Enter</kbd>

### Deleting a code fragment or a folder

1. Open the Code Toolbox section
2. Right click on the code fragment or a folder that you want to delete
3. Select "Delete"
4. Confirm your choice

### Moving a code fragment or a folder

You can move code fragments or folders in the Code Toolbox by dragging and dropping them

## Development

To get a list of all available commands, try `make help`.  
To test your changes, go to the Debug panel in VSCode and click on the `play` button. This will start the extension in a new window where you can test it.

## Contributing

This plugin is far from feature-complete.  
If you want to improve it, feel free to pick one of the [open issues](https://github.com/mre/vscode-snippet/issues) and give it a shot.  
In case you need any help, just add a comment to the issue to get a conversation started. :smiley:
