import { runtimeConformanceCases } from "../../../packages/runtime-api/test/conformance-suite.ts";
import { TanxiumScriptRuntime } from "../../../packages/tanxium/src/headless/runtime/index.ts";

const completed: string[] = [];
for (const conformanceCase of runtimeConformanceCases) {
  console.log(`HEADLESS_CONFORMANCE_START:${conformanceCase.name}`);
  await conformanceCase.run({
    kind: "tanxium",
    create: (options) => new TanxiumScriptRuntime(options),
  });
  completed.push(conformanceCase.name);
  console.log(`HEADLESS_CONFORMANCE_DONE:${conformanceCase.name}`);
}

console.log(`HEADLESS_CONFORMANCE:${JSON.stringify(completed)}`);
