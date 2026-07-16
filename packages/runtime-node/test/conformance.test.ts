import { describe, test } from 'vitest';

import { runtimeConformanceCases } from '../../runtime-api/test/conformance-suite.ts';
import { NodeScriptRuntime } from '../dist/index.js';

describe('NodeScriptRuntime conformance', () => {
  for (const conformanceCase of runtimeConformanceCases) {
    test(conformanceCase.name, () =>
      conformanceCase.run({
        kind: 'node',
        create: (options) => new NodeScriptRuntime(options),
      }),
    );
  }
});
