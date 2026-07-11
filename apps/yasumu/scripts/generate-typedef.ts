import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript-legacy';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const RUNTIME_DIR = path.join(ROOT_DIR, 'src-tauri', 'src', 'tanxium', 'runtime');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'lib', 'types', 'yasumu-typedef.ts');
const TYPES_DIR = path.join(import.meta.dirname, 'types');
const DENO_TYPES_FILE = path.join(TYPES_DIR, 'deno', 'lib.deno.d.ts');
const NODE_TYPES_DIR = path.join(ROOT_DIR, 'node_modules', '@types', 'node');

// Files to extract public types from (dependency order, bootstrap handled separately)
const RUNTIME_EXPORT_FILES = [
  'modules/collection.ts',
  'message-queue.ts',
  'yasumu-workspace-context.ts',
  'yasumu-request.ts',
  'ui.ts',
];

// Stubs for Deno internal modules that can't be resolved normally
const EXT_STUBS = new Map<string, string>([
  [
    'ext:core/ops',
    [
      'export declare function op_send_renderer_event(s: string): void;',
      'export declare function op_show_confirmation_dialog_sync(title: string, message: string, yesLabel: string, noLabel: string, cancelLabel: string): boolean;',
      'export declare function op_get_resources_dir(): string;',
      'export declare function op_get_app_data_dir(): string;',
      'export declare function op_set_rpc_port(port: number): void;',
      'export declare function op_generate_cuid(): string;',
      'export declare function op_is_yasumu_ready(): boolean;',
      'export declare function op_get_yasumu_version(): string;',
      'export declare function op_set_echo_server_port(port: number): void;',
      'export declare function op_set_mcp_server_port(port: number): void;',
      'export declare function op_register_virtual_module(name: string, code: string): void;',
      'export declare function op_unregister_virtual_module(name: string): void;',
      'export declare function op_is_yasumu_dev_mode(): boolean;',
      'export declare function op_get_rpc_port(): number;',
      'export declare function op_unregister_all_virtual_modules(): void;',
    ].join('\n'),
  ],
  [
    'ext:deno_console/01_console.js',
    // Minimal Console that satisfies globalThis.console assignment in patches.ts
    `export declare class Console implements globalThis.Console {
  constructor(fn: (msg: string, level: number) => void);
  assert(condition?: boolean, ...data: any[]): void;
  clear(): void;
  count(label?: string): void;
  countReset(label?: string): void;
  debug(...data: any[]): void;
  dir(item?: any, options?: any): void;
  dirxml(...data: any[]): void;
  error(...data: any[]): void;
  group(...data: any[]): void;
  groupCollapsed(...data: any[]): void;
  groupEnd(): void;
  info(...data: any[]): void;
  log(...data: any[]): void;
  table(tabularData?: any, properties?: string[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  timeLog(label?: string, ...data: any[]): void;
  timeStamp(label?: string): void;
  trace(...data: any[]): void;
  warn(...data: any[]): void;
  profile(label?: string): void;
  profileEnd(label?: string): void;
  [Symbol.toStringTag]: string;
}`,
  ],
]);

const STUB_VIRTUAL_PREFIX = '//__yasumu_ext_stub__/';

function stubVirtualPath(moduleName: string): string {
  return STUB_VIRTUAL_PREFIX + encodeURIComponent(moduleName) + '.d.ts';
}

function stubByVirtualPath(virtualPath: string): string | undefined {
  if (!virtualPath.startsWith(STUB_VIRTUAL_PREFIX)) return undefined;
  const key = decodeURIComponent(virtualPath.slice(STUB_VIRTUAL_PREFIX.length).replace(/\.d\.ts$/, ''));
  return EXT_STUBS.get(key);
}

// ============================================================================
// TypeScript compiler with stub support
// ============================================================================

function createCompilerHost(options: ts.CompilerOptions): ts.CompilerHost {
  const host = ts.createCompilerHost(options);
  const readFile0 = host.readFile.bind(host);
  const fileExists0 = host.fileExists.bind(host);

  host.fileExists = (fileName) => {
    if (fileName.startsWith(STUB_VIRTUAL_PREFIX)) return true;
    return fileExists0(fileName);
  };

  host.readFile = (fileName) => {
    const stub = stubByVirtualPath(fileName);
    if (stub !== undefined) return stub;
    return readFile0(fileName);
  };

  host.resolveModuleNames = (moduleNames, containingFile, _reused, _ref, opts) => {
    return moduleNames.map((name) => {
      if (EXT_STUBS.has(name)) {
        return {
          resolvedFileName: stubVirtualPath(name),
          isExternalLibraryImport: false,
          extension: ts.Extension.Dts,
        } as ts.ResolvedModuleFull;
      }
      return ts.resolveModuleName(name, containingFile, opts, host).resolvedModule;
    });
  };

  return host;
}

function compileToDeclarations(fileNames: string[]): Map<string, string> {
  const options: ts.CompilerOptions = {
    declaration: true,
    emitDeclarationOnly: true,
    allowImportingTsExtensions: true,
    strict: false,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
    typeRoots: [path.join(ROOT_DIR, 'node_modules', '@types')],
    types: ['node'],
  };

  const host = createCompilerHost(options);
  const out = new Map<string, string>();

  host.writeFile = (fileName, content) => {
    if (fileName.endsWith('.d.ts')) {
      out.set(path.basename(fileName), content);
    }
  };

  const program = ts.createProgram(fileNames, options, host);
  const { diagnostics } = program.emit();

  // Only surface errors from the files we explicitly asked to compile
  const inputSet = new Set(fileNames.map((f) => path.normalize(f)));
  for (const d of [...ts.getPreEmitDiagnostics(program), ...diagnostics]) {
    if (d.category === ts.DiagnosticCategory.Error && d.file) {
      const normalized = path.normalize(d.file.fileName);
      if (!inputSet.has(normalized)) continue;
      const loc = `${path.basename(d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1}`;
      console.warn(`  [tsc] ${loc}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
    }
  }

  return out;
}

// ============================================================================
// Declaration post-processing: strip imports/exports → ambient globals
// ============================================================================

function makeAmbient(content: string): string {
  let r = content;

  // Remove all import statements (single and multi-line)
  r = r.replace(/^import\s+(?:type\s+)?\{[^}]*\}\s+from\s+['"][^'"]*['"];?\s*\n?/gm, '');
  r = r.replace(/^import\s+[\w*]+(?:\s+as\s+\w+)?\s*(?:,\s*\{[^}]*\})?\s+from\s+['"][^'"]*['"];?\s*\n?/gm, '');
  r = r.replace(/^import\s+['"][^'"]*['"];?\s*\n?/gm, '');

  // export {} → remove
  r = r.replace(/^export\s*\{\s*\};?\s*\n?/gm, '');

  // export declare X → declare X
  r = r.replace(/^export\s+declare\s+/gm, 'declare ');

  // export abstract class → declare abstract class, etc.
  r = r.replace(/^export\s+(abstract\s+class|class|interface|type|function|enum|const|let|var)\b/gm, 'declare $1');

  // export { X, Y } re-exports → remove
  r = r.replace(/^export\s+\{[^}]*\};?\s*\n?/gm, '');

  // stray export
  r = r.replace(/^export\s+/gm, '');

  // duplicate declare
  r = r.replace(/\bdeclare\s+declare\b/g, 'declare');

  // collapse blank lines
  r = r.replace(/\n{3,}/g, '\n\n');

  return r.trim();
}

// ============================================================================
// Bootstrap.ts AST extraction — Yasumu class + unsafe type
// ============================================================================

function extractYasumuClass(bootstrapPath: string): string {
  const src = fs.readFileSync(bootstrapPath, 'utf-8');
  const sourceFile = ts.createSourceFile(bootstrapPath, src, ts.ScriptTarget.ESNext, true);

  let classNode: ts.ClassDeclaration | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === 'Yasumu') {
      classNode = node;
    }
  });

  if (!classNode) return '';

  const factory = ts.factory;
  const printer = ts.createPrinter({
    removeComments: false,
    omitTrailingSemicolon: false,
  });

  const keepMember = (m: ts.ClassElement): boolean => {
    // @ts-ignore
    // prettier-ignore
    const hasPrivate: boolean = m.modifiers?.some((mod) =>
        mod.kind === ts.SyntaxKind.PrivateKeyword ||
        mod.kind === ts.SyntaxKind.ProtectedKeyword,
    );
    if (hasPrivate) return false;
    const name = (m as ts.NamedDeclaration).name;
    if (name && ts.isPrivateIdentifier(name)) return false;
    return true;
  };

  const stripPublic = (mods: ts.NodeArray<ts.ModifierLike> | undefined) =>
    mods?.filter((m) => m.kind !== ts.SyntaxKind.PublicKeyword) as ts.ModifierLike[] | undefined;

  const ambientMembers = classNode.members.filter(keepMember).map((m) => {
    if (ts.isMethodDeclaration(m)) {
      return factory.createMethodDeclaration(
        stripPublic(m.modifiers),
        m.asteriskToken,
        m.name,
        m.questionToken,
        m.typeParameters,
        m.parameters,
        m.type,
        undefined,
      );
    }
    if (ts.isConstructorDeclaration(m)) {
      return factory.createConstructorDeclaration(stripPublic(m.modifiers), m.parameters, undefined);
    }
    if (ts.isGetAccessorDeclaration(m)) {
      return factory.createGetAccessorDeclaration(stripPublic(m.modifiers), m.name, m.parameters, m.type, undefined);
    }
    if (ts.isSetAccessorDeclaration(m)) {
      return factory.createSetAccessorDeclaration(stripPublic(m.modifiers), m.name, m.parameters, undefined);
    }
    if (ts.isPropertyDeclaration(m)) {
      // Ambient declarations cannot have initializers; infer the type if not explicit.
      let typeNode = m.type;
      if (!typeNode && m.initializer) {
        if (ts.isIdentifier(m.initializer)) {
          // e.g. `= YasumuUI` → `typeof YasumuUI`
          typeNode = factory.createTypeQueryNode(factory.createIdentifier(m.initializer.text));
        } else if (ts.isNewExpression(m.initializer) && ts.isIdentifier(m.initializer.expression)) {
          // e.g. `= new Cache()` → `Cache`
          typeNode = factory.createTypeReferenceNode(factory.createIdentifier(m.initializer.expression.text));
        }
      }
      return factory.createPropertyDeclaration(
        stripPublic(m.modifiers),
        m.name,
        m.questionToken ?? m.exclamationToken,
        typeNode,
        undefined, // strip initializer — not valid in ambient context
      );
    }
    return m;
  });

  const declMods = [
    factory.createModifier(ts.SyntaxKind.DeclareKeyword),
    ...(classNode.modifiers?.filter(
      (m) => m.kind !== ts.SyntaxKind.ExportKeyword && m.kind !== ts.SyntaxKind.DefaultKeyword,
    ) ?? []),
  ];

  const ambientClass = factory.createClassDeclaration(
    declMods,
    classNode.name,
    classNode.typeParameters,
    classNode.heritageClauses,
    ambientMembers,
  );

  const dummy = ts.createSourceFile('_temp.d.ts', '', ts.ScriptTarget.ESNext);
  return printer.printNode(ts.EmitHint.Unspecified, ambientClass, dummy);
}

// ============================================================================
// Yasumu type assembly
// ============================================================================

function generateYasumuTypes(): string {
  const exportFiles = RUNTIME_EXPORT_FILES.map((f) => path.join(RUNTIME_DIR, f)).filter((f) => fs.existsSync(f));

  // Include bootstrap.ts in compilation so globals like `unsafe` are visible
  const bootstrapPath = path.join(RUNTIME_DIR, 'bootstrap.ts');
  const allFiles = [...exportFiles];
  if (fs.existsSync(bootstrapPath)) allFiles.push(bootstrapPath);

  console.log('  Compiling runtime TypeScript files...');
  const declarations = compileToDeclarations(allFiles);

  const parts: string[] = [];

  // Ambient declarations from exported files
  for (const relFile of RUNTIME_EXPORT_FILES) {
    const baseName = path.basename(relFile, '.ts') + '.d.ts';
    const content = declarations.get(baseName);
    if (!content) {
      console.warn(`  [warn] No declaration emitted for ${baseName}`);
      continue;
    }
    const ambient = makeAmbient(content);
    if (ambient.trim()) parts.push(ambient);
  }

  // Yasumu class extracted directly from source
  if (fs.existsSync(bootstrapPath)) {
    const yasumuClass = extractYasumuClass(bootstrapPath);
    if (yasumuClass.trim()) parts.push(yasumuClass);
  }

  // Global type aliases needed by the runtime
  parts.push('declare type unsafe = any;');

  // Yasumu module declarations
  parts.push(`declare module "yasumu:collection" {\n  export { Collection };\n}`);

  // Testing API types (hand-written, stable)
  parts.push(TESTING_API_TYPES.trim());

  return parts.join('\n\n');
}

// ============================================================================
// Node.js types collector — emits one entry per .d.ts file so Monaco can
// process each file individually (avoids stalling on a single 2 MB blob).
// Only node: specifier module declarations are kept — bare module names are
// renamed to their node: equivalents and thin re-export wrappers are removed,
// since Deno only supports node: imports.
// ============================================================================

function isBareSpecifier(s: string): boolean {
  return !s.startsWith('node:') && !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('ext:') && !s.startsWith('#');
}

function transformToNodeSpecifiers(content: string): string {
  // Step 1: Remove thin "node:X" re-export wrappers (both CJS and ESM styles).
  // CJS: declare module "node:X" { import Y = require("..."); export = Y; }
  content = content.replace(
    /\bdeclare module "node:[^"]*"\s*\{\s*import \w+ = require\("[^"]*"\);\s*export = \w+;\s*\}/gs,
    '',
  );
  // ESM: declare module "node:X" { export * from "..."; }
  content = content.replace(
    /\bdeclare module "node:[^"]*"\s*\{\s*export \* from "[^"]*";\s*\}/gs,
    '',
  );

  // Step 2: Rename bare module specifiers in import/export statements so that
  // remaining thin wrappers (e.g. path/posix re-exporting path) keep working.
  content = content.replace(/\bimport (\w+) = require\("([^"]+)"\)/g, (_, name, spec) =>
    isBareSpecifier(spec) ? `import ${name} = require("node:${spec}")` : `import ${name} = require("${spec}")`,
  );
  content = content.replace(/\bexport \* from "([^"]+)"/g, (_, spec) =>
    isBareSpecifier(spec) ? `export * from "node:${spec}"` : `export * from "${spec}"`,
  );

  // Step 3: Rename bare declare module "X" → declare module "node:X".
  content = content.replace(/\bdeclare module "([^"]+)"/g, (_, name) =>
    isBareSpecifier(name) ? `declare module "node:${name}"` : `declare module "${name}"`,
  );

  // Strip cross-package /// <reference types> (unresolvable in Monaco sandbox)
  content = content.replace(/\/\/\/\s*<reference\s+types="[^"]*"\s*\/>\s*\n?/g, '');

  return content.replace(/\n{3,}/g, '\n\n').trim();
}

function collectNodeTypeFiles(nodeTypesDir: string): Array<{ content: string; filePath: string }> {
  const results: Array<{ content: string; filePath: string }> = [];
  const visited = new Set<string>();

  function addFile(absolutePath: string): void {
    const normalized = path.normalize(absolutePath);
    if (visited.has(normalized)) return;
    visited.add(normalized);
    if (!fs.existsSync(normalized)) return;

    const content = transformToNodeSpecifiers(fs.readFileSync(normalized, 'utf-8'));
    if (!content) return; // skip empty files after transformation

    const relativePath = path.relative(nodeTypesDir, normalized).replace(/\\/g, '/');
    results.push({
      content,
      filePath: `file:///node_modules/@types/node/${relativePath}`,
    });
  }

  function walkDir(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.d.ts')) {
        addFile(path.join(dir, entry.name));
      }
    }
  }

  addFile(path.join(nodeTypesDir, 'index.d.ts'));
  walkDir(nodeTypesDir);

  return results;
}

// ============================================================================
// Testing API types (hand-written)
// ============================================================================

const TESTING_API_TYPES = `
interface Expected<T = unknown> {
  not: Expected<T>;
  resolves: Expected<Promise<T>>;
  rejects: Expected<Promise<T>>;

  toBe(expected: T): void;
  toEqual(expected: T): void;
  toStrictEqual(expected: T): void;
  toMatch(expected: string | RegExp): void;
  toMatchObject(expected: Record<string, unknown>): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeNaN(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toContain(expected: unknown): void;
  toContainEqual(expected: unknown): void;
  toHaveLength(expected: number): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, numDigits?: number): void;
  toBeInstanceOf(expected: new (...args: unknown[]) => unknown): void;
  toThrow(expected?: string | RegExp | Error): void;
  toHaveProperty(keyPath: string | string[], value?: unknown): void;
  toHaveBeenCalled(): void;
  toHaveBeenCalledTimes(expected: number): void;
  toHaveBeenCalledWith(...args: unknown[]): void;
  toHaveBeenLastCalledWith(...args: unknown[]): void;
  toHaveBeenNthCalledWith(n: number, ...args: unknown[]): void;
  toHaveReturned(): void;
  toHaveReturnedTimes(expected: number): void;
  toHaveReturnedWith(expected: unknown): void;
  toHaveLastReturnedWith(expected: unknown): void;
  toHaveNthReturnedWith(n: number, expected: unknown): void;
}

interface AsymmetricMatchers {
  anything(): unknown;
  any(constructor: new (...args: unknown[]) => unknown): unknown;
  arrayContaining(expected: unknown[]): unknown;
  objectContaining(expected: Record<string, unknown>): unknown;
  stringContaining(expected: string): unknown;
  stringMatching(expected: string | RegExp): unknown;
  closeTo(expected: number, numDigits?: number): unknown;
  not: {
    arrayContaining(expected: unknown[]): unknown;
    objectContaining(expected: Record<string, unknown>): unknown;
    stringContaining(expected: string): unknown;
    stringMatching(expected: string | RegExp): unknown;
  };
  addSnapshotSerializer(serializer: unknown): void;
  assertions(num: number): void;
  addEqualityTester(tester: (a: unknown, b: unknown) => boolean | undefined): void;
  extend(matchers: Record<string, (received: unknown, ...args: unknown[]) => { pass: boolean; message: () => string }>): void;
  hasAssertions(): void;
}

type Expect = (<T>(actual: T) => Expected<T>) & AsymmetricMatchers;

declare const expect: Expect;

interface TestContext {
  skip(): never;
  fail(message?: string): never;
  succeed(): never;
}

declare function test(name: string, fn: (ctx: TestContext) => void | Promise<void>): void;
declare function describe(name: string, fn: () => void): void;
`;

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log('Generating Yasumu type definitions...');

  // 1. Yasumu runtime types
  console.log('\n[1/3] Generating Yasumu runtime types...');
  const yasumuTypes = generateYasumuTypes();
  console.log(`  ✓ ${(yasumuTypes.length / 1024).toFixed(1)} KB`);

  // 2. Deno types
  console.log('\n[2/3] Loading Deno types...');
  if (!fs.existsSync(DENO_TYPES_FILE)) {
    console.error(`  ✗ Deno types not found at ${DENO_TYPES_FILE}`);
    console.error('  Run: cp scripts/deno.ts.txt scripts/types/deno/lib.deno.d.ts');
    process.exit(1);
  }
  const denoTypes = fs.readFileSync(DENO_TYPES_FILE, 'utf-8');
  console.log(`  ✓ ${(denoTypes.length / 1024).toFixed(1)} KB`);

  // 3. Node.js types (one entry per .d.ts file)
  console.log('\n[3/3] Collecting Node.js types from @types/node...');
  if (!fs.existsSync(NODE_TYPES_DIR)) {
    console.warn(`  ⚠ @types/node not found at ${NODE_TYPES_DIR}, skipping`);
  }
  const nodeTypeFiles = fs.existsSync(NODE_TYPES_DIR) ? collectNodeTypeFiles(NODE_TYPES_DIR) : [];
  const nodeTotalKB = nodeTypeFiles.reduce((acc, f) => acc + f.content.length, 0) / 1024;
  console.log(`  ✓ ${nodeTypeFiles.length} files, ${nodeTotalKB.toFixed(1)} KB total`);

  // Output
  const nodeEntries = nodeTypeFiles
    .map(({ content, filePath }) => `  {\n    content: ${JSON.stringify(content)},\n    filePath: ${JSON.stringify(filePath)},\n  }`)
    .join(',\n');

  const output = `/* eslint-disable */
// @ts-nocheck

// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT MANUALLY.
// Run \`pnpm generate-typedef\` to regenerate.

export const YASUMU_TYPE_DEFINITIONS = [
  {
    content: ${JSON.stringify(yasumuTypes)},
    filePath: 'file:///yasumu/globals.d.ts',
  },
  {
    content: ${JSON.stringify(denoTypes)},
    filePath: 'file:///lib.deno.d.ts',
  },${nodeEntries ? `\n${nodeEntries},` : ''}
] as const satisfies Array<{ content: string; filePath: string }>;
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

  const totalKB = ((yasumuTypes.length + denoTypes.length + nodeTotalKB * 1024) / 1024).toFixed(1);
  console.log(`\n✓ Written to ${OUTPUT_FILE}`);
  console.log(`  Total type definitions: ${totalKB} KB`);
}

main();
