import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'oxfmt';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(packageRoot, '../..');
const contractPath = resolve(packageRoot, 'contract/runtime-api.json');
const contract = JSON.parse(await readFile(contractPath, 'utf8'));
const serializationSource = await readFile(resolve(packageRoot, 'src/serialization.ts'), 'utf8');

const quote = (value) => JSON.stringify(value);
const tuple = (values) => values.map(quote).join(', ');
const generatedHeader = '// This file is generated from packages/runtime-api/contract/runtime-api.json. Do not edit.\n';
const formatTypescript = async (fileName, source) => {
  const result = await format(fileName, source, {
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
    semi: true,
  });
  if (result.errors.length) throw new Error(`Unable to format ${fileName}: ${result.errors[0].message}`);
  return result.code;
};

const typescript = await formatTypescript(
  'generated.ts',
  `${generatedHeader}
export const RUNTIME_API_VERSION = ${contract.version} as const;
export const SCRIPT_HOOK_NAMES = [${tuple(contract.hooks)}] as const;
export type ScriptHookName = (typeof SCRIPT_HOOK_NAMES)[number];
export const VIRTUAL_MODULES = ${JSON.stringify(contract.virtualModules, null, 2)} as const;
export type VirtualModuleName = keyof typeof VIRTUAL_MODULES;
export const RUNTIME_CAPABILITY_NAMES = [${tuple(contract.capabilities)}] as const;
export const RUNTIME_WORKER_MESSAGE_TYPES = [${tuple(contract.workerMessages)}] as const;
export const RUNTIME_HOST_METHODS = [${tuple(contract.hostMethods)}] as const;
`,
);

const rustVariant = (value) =>
  value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
const rustSlice = (declaration, values) => {
  const compact = `${declaration}&[${tuple(values)}];`;
  if (compact.length <= 100) return compact;
  return `${declaration}&[\n${values.map((value) => `    ${quote(value)},`).join('\n')}\n];`;
};
const rust = `${generatedHeader.replace('//', '//!')}
pub const YASUMU_RUNTIME_API_VERSION: u32 = ${contract.version};
${rustSlice('pub const YASUMU_SCRIPT_HOOKS: &[&str] = ', contract.hooks)}
${rustSlice('pub const YASUMU_VIRTUAL_MODULES: &[&str] = ', Object.keys(contract.virtualModules))}
${rustSlice('pub const YASUMU_RUNTIME_CAPABILITIES: &[&str] = ', contract.capabilities)}
${rustSlice('pub const YASUMU_RUNTIME_HOST_METHODS: &[&str] = ', contract.hostMethods)}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum YasumuScriptHook {
${contract.hooks.map((hook) => `    ${rustVariant(hook)},`).join('\n')}
}

impl YasumuScriptHook {
    pub const fn as_str(self) -> &'static str {
        match self {
${contract.hooks.map((hook) => `            Self::${rustVariant(hook)} => ${quote(hook)},`).join('\n')}
        }
    }
}
`;

const bootstrap = await formatTypescript(
  'generated-runtime-contract.ts',
  `${generatedHeader}
export const YASUMU_RUNTIME_API_VERSION = ${contract.version} as const;
export const YASUMU_SCRIPT_HOOKS = [${tuple(contract.hooks)}] as const;
export const YASUMU_VIRTUAL_MODULES = [${tuple(Object.keys(contract.virtualModules))}] as const;
export const YASUMU_RUNTIME_HOST_METHODS = [${tuple(contract.hostMethods)}] as const;
`,
);

const tanxiumRuntimeProtocol = await formatTypescript(
  'generated-runtime-protocol.ts',
  `${generatedHeader}
export const RUNTIME_API_VERSION = ${contract.version} as const;
${serializationSource.replace(/^import type \{[\s\S]*?\} from '\.\/types\.js';\n\n/, '')}
`,
);

const outputs = [
  [resolve(packageRoot, 'src/generated.ts'), typescript],
  [resolve(repositoryRoot, 'crates/tanxium/src/generated_runtime_contract.rs'), rust],
  [resolve(repositoryRoot, 'crates/tanxium/src/runtime/generated-runtime-contract.ts'), bootstrap],
  [resolve(repositoryRoot, 'crates/tanxium/src/runtime/generated-runtime-protocol.ts'), tanxiumRuntimeProtocol],
];

const check = process.argv.includes('--check');
let stale = false;
for (const [path, content] of outputs) {
  if (check) {
    const current = await readFile(path, 'utf8').catch(() => '');
    if (current !== content) {
      console.error(`Generated runtime contract is stale: ${path}`);
      stale = true;
    }
  } else {
    await writeFile(path, content);
  }
}

if (stale) process.exitCode = 1;
