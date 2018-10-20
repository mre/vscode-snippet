'use strict'
import * as cp from 'child_process'
import * as http from 'http'
import * as vscode from 'vscode'

class Node {
    value: string
    nodes: object
    search: boolean
    constructor(setValue: string, wasSearched: boolean = false) {
        this.value = setValue
        this.nodes = {}
        this.search = wasSearched
    }
}

function createNewQueryBranch(array: object, data: object, query: string, index) {
    if(data['nodes'][query]) {
        if(array[index+1]) {
            let nextNode = getNode(data, query)
            index += 1
            query += array[index]
            return createNewQueryBranch(array, nextNode, query, index)
        } else {
            data['search'] = true
            return
        }
    } else {
        if(array[index+1]) {
            addNode(data, query, false)
            let nextNode = getNode(data, query)
            index += 1
            query += array[index]
            return createNewQueryBranch(array, nextNode, query, index)
        } else {
            addNode(data, query, true)
            return 
        }
    }
}

function getNode(tree: object, name: string) {
    return tree['nodes'][name] ? tree['nodes'][name] : null
}

function addNode(tree: object, nodeName: string, wasSearched: boolean) {
    if(!tree['nodes'][nodeName]) {
        let node = new Node(nodeName, wasSearched)
        tree['nodes'][nodeName] = node
    }
}

function getQuerySearchedNodes(tree: object, query: string) {
    let queryArray = query.split('')
    let tempQuery = ''
    let tempNode = tree
    let getToFinalLeave = false
    queryArray.forEach( element => {
        tempQuery += element
        if(tempNode['nodes'][tempQuery]) {
            tempNode = tempNode['nodes'][tempQuery]
            getToFinalLeave = false
        } else {
            getToFinalLeave = true
        }
    })
    if(getToFinalLeave) {
        return []
    } else {
        let searchedQueries = []
        getAllSearchedNodes(tempNode, searchedQueries)
        return searchedQueries
    }
}

function getAllSearchedNodes(tree: object, searchedQueries = []) {
    for(var key in tree['nodes']) {
        if(tree['nodes'][key]['search']) {
            searchedQueries.push(tree['nodes'][key]['value'])
            getAllSearchedNodes(tree['nodes'][key], searchedQueries)
        } else {
            getAllSearchedNodes(tree['nodes'][key], searchedQueries)
        }
    }
}

const cache = {
    state: <vscode.Memento> null
}

export function activate(ctx: vscode.ExtensionContext) {
    cache.state = ctx.globalState
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.find', find))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findInplace', findInplace))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findInNewEditor', findInNewEditor))
    ctx.subscriptions.push(vscode.commands.registerCommand(
        'snippet.findSelectedText', findSelectedText))
}

function find() {
    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]
    query(openInNewEditor)
}

function query(openInNewEditor: boolean) {
    vscode.window.showInputBox()
        .then(query => {
            asyncRequest(query, function (data) {
                insertText(data, openInNewEditor)
            })
        });
}

function findInplace() {
    query(false)
}

function findInNewEditor() {
    query(true)
}

function findSelectedText() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showErrorMessage('There is no open editor window');
        return
    }

    let selection = editor.selection;
    let query = editor.document.getText(selection);

    let configuration = vscode.workspace.getConfiguration('snippet')
    let openInNewEditor: boolean = configuration["openInNewEditor"]

    asyncRequest(query, function (data) {
        insertText(data, openInNewEditor)
    })
}


var requestCache = new Object()
function asyncRequest(queryRaw: string, callback: (data: string) => void) {
    let loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
    loadingStatus.text =  'Loading Snippet ...'
    loadingStatus.show()

    let query = encodeURI(queryRaw.replace(/ /g, '+'))
    let language = vscode.window.activeTextEditor.document.languageId

    let configuration = vscode.workspace.getConfiguration('snippet')
    let verbose: boolean = configuration["verbose"]
    let params = "QT"
    if (verbose) {
        params = "qT"
    }

    let baseUrl: String = configuration["baseUrl"]

    let path = `/vscode:${language}/${query}?${params}&style=bw`;

    let data = requestCache[path]
    if (data) {
        loadingStatus.hide()
        callback(data)
        return
    }

    console.log(`asyncRequest: ${query}`)

    http.get({
        'host': baseUrl,
        'path': path,
        // Fake user agent to get plain-text output.
        // See https://github.com/chubin/cheat.sh/blob/1e21d96d065b6cce7d198c1a3edba89081c78a0b/bin/srv.py#L47
        'headers': {
            'User-Agent': 'curl/7.43.0'
        }
    }, function (message) {
        let data = ""

        message.on("data", function (chunk) {
            data += chunk
        })

        message.on("end",  async function () {
            requestCache[path] = data
            let cacheData = await cache.state.get(`snippet_${language}`)
            let queryArray = query.split('')
            createNewQueryBranch(queryArray, cacheData, queryArray[0], 0)
            cache.state.update(`snippet_${language}`, cacheData)
            loadingStatus.hide()
            callback(data)
        })
    }).on("error", function (err) {
        vscode.window.showInformationMessage(err.message)
    })
}

function insertText(content: string, openInNewEditor = true) {

    if (openInNewEditor) {
        let language = vscode.window.activeTextEditor.document.languageId
        vscode.workspace.openTextDocument({ language, content }).then(
            document => vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
        )
    }
    else {
        let editor = vscode.window.activeTextEditor
        if (!editor) {
            vscode.window.showErrorMessage('There is no open editor window');
            return;
        }
        editor.edit(
            edit => editor.selections.forEach(
                selection => {
                    edit.insert(selection.end, "\n" + content);
                }
            )
        );
    }
}