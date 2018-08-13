# vscode-snippet

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/release/mre/vscode-snippet.svg?style=flat-square)](https://github.com/mre/vscode-snippet/releases)
[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/installs/vscode-snippet.Snippet.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=vscode-snippet.Snippet)

A Visual Studio Code extension for [cht.sh](https://cht.sh/).

## Features

* Zero configuration: works out of the box.
* Automatically detects programming language from current editor window.

## Config options

* `openInNewEditor`: open snippets or in new editor window (default) in line with current document.
* `verbose`: add comments around code snippets.
* `baseUrl`: base url of the cheat server ([see cheat.sh documentation](https://github.com/chubin/cheat.sh/issues/98#issuecomment-412472258))





## Installation

Install this extension from the [VSCode
Marketplace](https://marketplace.visualstudio.com/items?itemName=vscode-snippet.Snippet)

## Usage

## Search for a snippet

1. Hit <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>p</kbd>
2. Run `Snippet: Find`.
3. Type your query and hit enter.

![Preview](/contrib/find.gif)

### Search for snippet based on selected text 

1. Select some text in an editor window.
2. Right click and choose "Find snippet from selected text"

![Preview](/contrib/findSelectedMenu.gif)

Alternatively, you can also run the `Snippet: Find Selected Text` from the
command menu:

![Preview](/contrib/findSelected.gif)

You can configure a keyboard shortcut. By default this is <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>s</kbd>:

![Preview](/contrib/findSelectedShortcut.gif)

## Contributing

This plugin is far from feature-complete.  
If you want to improve it, feel free to pick one of the [open issues](https://github.com/mre/vscode-snippet/issues) and give it a shot.  
In case you need any help, just add a comment to the issue to get a conversation started. :smiley:
