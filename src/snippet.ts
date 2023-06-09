"use strict";

import * as vscode from "vscode";
import axios, { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from "axios";
import { getConfig } from "./config";
import { HttpProxyAgent } from "http-proxy-agent";

export interface Response {
  language: string;
  data: string;
}

export interface MockResponseData {
  language: string;
  query: string;
  verbose: boolean;
  answerNumber: number;
}

class Snippet {
  // Current language we're searching for
  currLanguage?: string;

  // Query string that was executed (not escaped)
  currQuery?: string;

  // Answer number that was shown
  currNum: number;

  // Current state of comments (for toggleComments)
  verboseState: boolean;

  // Local cache for saving unnecessary requests
  requestCache: any;

  constructor() {
    this.currNum = 0;
    this.verboseState = getConfig("verbose");
    this.requestCache = new Object();
  }

  toggleVerbose() {
    this.verboseState = !this.verboseState;
  }

  async load(language: string, query: string, num: number): Promise<Response> {
    this.currLanguage = language;
    this.currQuery = query;
    this.currNum = num;

    const response = await this._doRequest();
    return { language, data: response.data };
  }

  getNextAnswerNumber(): number {
    this.currNum++;
    return this.currNum;
  }

  getPreviousAnswerNumber(): number | null {
    if (this.currNum == 0) {
      return null;
    }
    this.currNum--;
    return this.currNum;
  }

  getCurrentQuery(): string | undefined {
    return this.currQuery;
  }

  getCurrentAnswerNumber(): number {
    return this.currNum;
  }

  getVerbose(): boolean {
    return this.verboseState;
  }

  private _requestConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      // Fake user agent to get plain-text output.
      // See https://github.com/chubin/cheat.sh/blob/1e21d96d065b6cce7d198c1a3edba89081c78a0b/bin/srv.py#L47
      headers: {
        "User-Agent": "curl/7.43.0",
      },
    };

    // Apply proxy setting if provided
    const proxy = vscode.workspace.getConfiguration("http")["proxy"];
    if (proxy !== "") {
      const agent = new HttpProxyAgent(proxy);
      config["agent"] = agent;
    }
    return config;
  }

  private getUrl(language: string, query: string) {
    const baseUrl = getConfig("baseUrl");
    const num = this.currNum;
    const params = this.verboseState ? "qT" : "QT";
    const path = `/vscode:${language}/${query}/${num}?${params}&style=bw`;
    return baseUrl + path;
  }

  private async _doRequest(): Promise<AxiosResponse> {
    const query = encodeURI(this.currQuery.replace(/ /g, "+"));
    const url = this.getUrl(this.currLanguage, query);
    const data = this.requestCache[url];
    if (data) {
      return data;
    }
    try {
      const res =
        process.env.NODE_ENV === "test"
          ? await this.getMock()
          : await axios.get(url, this._requestConfig());
      this.requestCache[url] = res;
      return res;
    } catch (err) {
      vscode.window.showErrorMessage(
        "Error while fetching snippets : " + err.toJSON().message
      );
    }
  }

  private async getMock(): Promise<AxiosResponse> {
    return {
      data: this.getMockResponseData(),
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
  }

  private getMockResponseData(): string {
    const result: MockResponseData = {
      language: this.currLanguage,
      query: this.currQuery,
      verbose: this.verboseState,
      answerNumber: this.currNum,
    };
    return JSON.stringify(result);
  }
}

export default new Snippet();
