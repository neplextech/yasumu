import { RuntimeNotInitializedError } from '@/common/errors/RuntimeNotInitializedError.js';
import {
  BaseScriptRuntime,
  type YasumuRuntimeData,
} from './BaseScriptRuntime.js';

// Types

type WorkerMessage = {
  type: 'executeModule';
  data: {
    module: string;
    code: string;
  };
};

type WorkerResponse = {
  console: { type: string; args: string[]; timestamp: number }[];
  request: Record<string, any>;
  response: Record<string, any>;
};

type WorkerError = {
  error: { message: string; timestamp: number };
};

// This runtime is designed for debugging purposes only. The production runtime should not use web worker version.

const WEB_WORKER_BOOTSTRAP = `async function executeModule(data) {
  const { module, code } = data;
  
  const script = new Function(code);
  await script();
}
;(async () => {
const Yasumu = {
  console: [],
  request: {},
  response: {},
  serialize() {
    return JSON.stringify({
      console: this.console,
      request: this.request,
      response: this.response,
    });
  },
};

globalThis.Yasumu = Yasumu;

globalThis.addEventListener('message', async (event) => {
  try {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'executeModule': {
        const { data } = data;
        await executeModule(data).catch(e => {
          Yasumu.console.push({
            type: 'error',
            args: [String(e)],
            timestamp: Date.now(),
          });
        });

        postMessage(Yasumu.serialize());
        break;
      }
    }
  } catch (error) {
    console.error(error); 
  }
});
})();`;

export class WebWorkerRuntime extends BaseScriptRuntime {
  private worker: Worker | null = null;

  private async send(data: WorkerMessage): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new RuntimeNotInitializedError());
        return;
      }

      this.worker.onmessage = (event: MessageEvent<string>) => {
        try {
          const responseData: WorkerResponse | WorkerError = JSON.parse(
            event.data,
          );
          if ('error' in responseData) {
            reject(new Error(responseData.error.message));
          } else {
            resolve(responseData);
          }
        } catch (error) {
          reject(new Error('Failed to parse worker response.'));
        }
      };

      this.worker.onerror = (event) => {
        reject(event.error || new Error(`Worker Error: ${event.message}`));
      };

      this.worker.postMessage(JSON.stringify(data));
    });
  }

  public initialize(data: YasumuRuntimeData): Promise<void> {
    // const workerBlob = new Blob([WEB_WORKER_BOOTSTRAP], { type: 'application/javascript' });
    // const workerURL = URL.createObjectURL(workerBlob);

    // if (this.worker) {
    //   this.worker.terminate();
    //   this.worker = null;
    // }
    // this.worker = new Worker(workerURL, { type: 'module', name: 'YasumuJavaScriptRuntime' });
    return Promise.resolve();
  }

  public async executeModule(
    module: string,
    code: string,
  ): Promise<WorkerResponse> {
    if (!this.worker) {
      throw new RuntimeNotInitializedError();
    }

    const result = await this.send({
      type: 'executeModule',
      data: {
        module,
        code,
      },
    });

    return result;
  }
}
