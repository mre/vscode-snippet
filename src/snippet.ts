import * as vscode from 'vscode';
import axios, { AxiosResponse } from 'axios';
import {
    getDefaultLanguageConfig,
    getCommentCurrentStateConfig
} from './config';
import * as HttpProxyAgent from 'http-proxy-agent';


export interface Response {
    language: string
    data: string
};

export class Snippet {
    languageToSearchFor?: string;
    query?: string;
    shownAnswerNumber: number;
    commentsCurrentState: boolean;
    requestCache: any;

    constructor() {
        this.shownAnswerNumber = 0;
        this.commentsCurrentState = getCommentCurrentStateConfig('verbose');
        this.requestCache = new Object();
    }

    toggleVerbose() {
        this.commentsCurrentState = !this.commentsCurrentState;
    }

    async load(
        language?: string,
        query?: string,
        answerNumber?: number
    ): Promise<Response> {
        this.languageToSearchFor = language || this.languageToSearchFor;
        this.query = query || this.query;
        this.shownAnswerNumber = answerNumber || this.shownAnswerNumber;
        const response = await this._doRequest(this.languageToSearchFor);
        return Promise.resolve({ language: language, data: response.data });
    }

    async loadNext(): Promise<Response> {
        this.shownAnswerNumber++;
        return this.load();
    }

    async loadPrevious(): Promise<void> {
        const isFirstAnswer = this.shownAnswerNumber == 0;

        if (isFirstAnswer) {
            return Promise.reject('Already at first answer');
        }

        this.shownAnswerNumber--;
        this.load(this.languageToSearchFor);

        Promise.resolve();
    }

    getCurrentQuery(): string {
        return this.query
    }

    private _fakeRequestConfig(): {} {
        const config = {
            'headers': {
                'User-Agent': 'curl/7.43.0'
            },
        }

        const proxy = vscode.workspace.getConfiguration('http')['proxy'];
        const hasProxy = proxy !== '';

        if (hasProxy) {
            const agent = new HttpProxyAgent(proxy);
            config['agent'] = agent;
        }

        return config;
    }

    private getUrl(
        language: string,
        query: string
    ) {
        const baseUrl = getDefaultLanguageConfig('baseUrl');
        const num = this.shownAnswerNumber;
        const params = this.commentsCurrentState ? 'qT' : 'QT';
        const path = `/vscode:${language}/${query}/${num}?${params}&style=bw`;
        return baseUrl + path;
    }

    /**
     * FIXME: _doRequest set requestCache propertiy and at the same time returns a response?
     * (bad smell here)
     */
    private async _doRequest(language: string): Promise<AxiosResponse> {
        const query = encodeURI(this.query.replace(/ /g, '+'))
        const url = this.getUrl(language, query)
        let response = this.requestCache[url];

        if (!response) {
            response = await axios.get(url, this._fakeRequestConfig());
            this.requestCache[url] = response;
        }

        return Promise.resolve(response);
    }
}
