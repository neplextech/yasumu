import type { KeyValue } from '@/common/types.js';

export interface InteractiveWebResponseOptions {
  status: number;
  headers: Headers;
  time: number;
  body: string | null;
  url: string;
  redirected: boolean;
}

export class InteractiveWebResponse {
  public readonly redirected: boolean;
  public readonly url: string;
  public readonly status: number;
  public readonly time: number;
  public readonly size: number;
  public readonly text: string;

  #headers: KeyValue<string, string>[] | null = null;

  public constructor(private readonly response: InteractiveWebResponseOptions) {
    this.redirected = response.redirected;
    this.url = response.url;
    this.status = response.status;
    this.time = response.time;
    this.text = response.body ?? '';

    const size = Number.parseInt(
      this.response.headers.get('content-length') || '',
    );

    if (Number.isNaN(size)) {
      const byteLength = new TextEncoder().encode(this.text).length;
      this.size = byteLength;
    } else {
      this.size = size;
    }
  }

  public get headers() {
    if (this.#headers) return this.#headers;

    const headers: KeyValue<string, string>[] = [];

    this.response.headers.forEach((value, key) => {
      headers.push({ key, value });
    });

    this.#headers = headers;

    return headers;
  }

  public get json() {
    return JSON.parse(this.text);
  }

  public toJSON() {
    return {
      status: this.status,
      headers: this.headers,
      time: this.time,
      body: this.text,
      url: this.url,
      size: this.size,
    };
  }
}
