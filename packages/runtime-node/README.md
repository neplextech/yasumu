# `@yasumu/runtime-node`

The Node.js `worker_threads` adapter for the shared `@yasumu/runtime-api`
contract. A runtime session owns one persistent worker and communicates with the
headless host through the typed host-call protocol.

```ts
import { NodeScriptRuntime } from '@yasumu/runtime-node';

const runtime = new NodeScriptRuntime();
const session = await runtime.createSession({
  workspace,
  workspaceModule,
  hostCall,
});
```

Node.js 24 or newer is required for synchronous module loader hooks. Script
TypeScript is transpiled with the compiler API from the `typescript-legacy`
alias. The workspace's TypeScript 7 native preview intentionally does not expose
that compiler API, so the alias is a runtime dependency rather than a duplicate
build dependency.
