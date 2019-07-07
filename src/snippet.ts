'use strict'

import * as vscode from 'vscode'
import axios, { AxiosResponse } from 'axios';
import { getConfig } from './config'
import { HttpProxyAgent } from 'http-proxy-agent'

export interface Response {
    language: string
    data: string
}

export class Snippet {
    // Current language we're searching for
    currLanguage?: string;

    // Query string that was executed (not escaped)
    currQuery?: string

    // Answer number that was shown
    currNum: number

    // Current state of comments (for toggleComments)
    verboseState: boolean

    // Local cache for saving unnecessary requests
    requestCache: any

    constructor() {
        this.currNum = 0
        this.verboseState = getConfig("verbose");
        this.requestCache = new Object()
    }

    toggleVerbose() {
        this.verboseState = !this.verboseState
    }

    async load(language?: string, query?: string, num?: number): Promise<Response> {
        if (language) {
            this.currLanguage = language
        }
        if (query) {
            this.currQuery = query
        }
        if (num) {
            this.currNum = num
        }

        let response = await this._doRequest(this.currLanguage)
        return { language, data: response.data }
    }

    async loadNext(): Promise<Response> {
        this.currNum++
        return this.load()
    }

    async loadPrevious(): Promise<Response> {
        if (this.currNum == 0) {
            return Promise.reject("Already at first answer")
        }
        this.currNum--
        return this.load(this.currLanguage)
    }

    getCurrentQuery(): string | undefined {
        return this.currQuery
    }

    private _requestConfig(): {} {
        let config = {
            // Fake user agent to get plain-text output.
            // See https://github.com/chubin/cheat.sh/blob/1e21d96d065b6cce7d198c1a3edba89081c78a0b/bin/srv.py#L47
            'headers': {
                'User-Agent': 'curl/7.43.0'
            },
        }

        // Apply proxy setting if provided
        let proxy = vscode.workspace.getConfiguration('http')['proxy']
        if (proxy !== '') {
            let agent = new HttpProxyAgent(proxy)
            config['agent'] = agent
        }
        return config
    }

    private getUrl(language: string, query: string) {
        let baseUrl = getConfig("baseUrl")
        let num = this.currNum
        let params = this.verboseState ? "qT" : "QT"
        let path = `/vscode:${language}/${query}/${num}?${params}&style=bw`;
        return baseUrl + path;
    }

    private async _doRequest(language: string): Promise<AxiosResponse> {
        let query = encodeURI(this.currQuery.replace(/ /g, '+'))
        let url = this.getUrl(language, query)
        let data = await this.requestCache[url]
        if (data) {
            return data;
        }
        let res = await axios.get(url, this._requestConfig())
        this.requestCache[url] = res
        return res
    }
}
