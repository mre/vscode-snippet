"use strict";

import * as vscode from "vscode";
import axios, { AxiosResponse } from "axios";
import { getConfig } from "./config";
import * as HttpProxyAgent from "http-proxy-agent";

export interface Response {
  language: string;
  data: string;
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

    let response = await this._doRequest();
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

  private _requestConfig(): {} {
    let config = {
      // Fake user agent to get plain-text output.
      // See https://github.com/chubin/cheat.sh/blob/1e21d96d065b6cce7d198c1a3edba89081c78a0b/bin/srv.py#L47
      headers: {
        "User-Agent": "curl/7.43.0"
      }
    };

    // Apply proxy setting if provided
    let proxy = vscode.workspace.getConfiguration("http")["proxy"];
    if (proxy !== "") {
      let agent = new HttpProxyAgent(proxy);
      config["agent"] = agent;
    }
    return config;
  }

  private getUrl(language: string, query: string) {
    let baseUrl = getConfig("baseUrl");
    let num = this.currNum;
    let params = this.verboseState ? "qT" : "QT";
    let path = `/vscode:${language}/${query}/${num}?${params}&style=bw`;
    return baseUrl + path;
  }

  private async _doRequest(): Promise<AxiosResponse> {
    let query = encodeURI(this.currQuery.replace(/ /g, "+"));
    let url = this.getUrl(this.currLanguage, query);
    let data = this.requestCache[url];
    if (data) {
      return data;
    }
    let res = await axios.get(url, this._requestConfig());
    this.requestCache[url] = res;
    return res;
  }
}

export default new Snippet();
