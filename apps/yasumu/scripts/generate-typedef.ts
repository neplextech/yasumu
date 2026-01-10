import ts from 'typescript';
import fs, { readdirSync, readFileSync } from 'node:fs';
import path, { join } from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const RUNTIME_DIR = path.join(
  ROOT_DIR,
  'src-tauri',
  'src',
  'tanxium',
  'runtime',
);
const OUTPUT_FILE = path.join(
  ROOT_DIR,
  'src',
  'lib',
  'types',
  'yasumu-typedef.ts',
);

const RUNTIME_FILES = [
  'ui.ts',
  'yasumu-request.ts',
  'bootstrap.ts',
  'yasumu-workspace-context.ts',
  'modules/collection.ts',
];
const WHITELISTED_RUNTIME_FILES = ['internal.d.ts'];

function cleanupGeneratedFiles() {
  const generatedFiles = readdirSync(RUNTIME_DIR, { withFileTypes: true })
    .filter(
      (f) =>
        f.isFile() &&
        !WHITELISTED_RUNTIME_FILES.includes(f.name) &&
        f.name.endsWith('.d.ts'),
    )
    .map((f) => join(RUNTIME_DIR, f.name));

  for (const file of generatedFiles) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

function generateDeclarations(fileNames: string[]): Map<string, string> {
  const declarations = new Map<string, string>();

  const options: ts.CompilerOptions = {
    declaration: true,
    emitDeclarationOnly: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: false,
    isolatedModules: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
  };

  const host = ts.createCompilerHost(options);

  host.writeFile = (fileName, contents) => {
    const baseName = path.basename(fileName);
    declarations.set(baseName, contents);
  };

  const program = ts.createProgram(fileNames, options, host);
  program.emit();

  return declarations;
}

function cleanDeclarationContent(content: string, fileName: string): string {
  let result = content;

  result = result.replace(/^import\s+.*?[;\n]/gm, '');
  result = result.replace(/^export\s*\{\s*\};?\s*$/gm, '');
  result = result.replace(/^export\s+default\s+.*?;?\s*$/gm, '');

  result = result.replace(/\bdeclare\s+declare\b/g, 'declare');
  result = result.replace(/\bexport\s+declare\b/g, 'declare');
  result = result.replace(
    /^export\s+(?=type|interface|class|function|const|let|var|enum)/gm,
    'declare ',
  );
  result = result.replace(/^export\s+/gm, '');

  result = result.replace(/^\s*private\s+[_a-zA-Z]\w*\s*[;:][^\n]*\n?/gm, '');
  result = result.replace(/^\s*private\s+constructor\([^)]*\)[^;]*;\n?/gm, '');

  result = result
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith('private ')) return false;
      return true;
    })
    .join('\n');

  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

function extractClassesAndInterfaces(dtsContent: string): {
  classes: string[];
  interfaces: string[];
  types: string[];
  functions: string[];
} {
  const sourceFile = ts.createSourceFile(
    'temp.d.ts',
    dtsContent,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );

  const classes: string[] = [];
  const interfaces: string[] = [];
  const types: string[] = [];
  const functions: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.name) {
      let text = node.getText(sourceFile);
      text = text.replace(/^export\s+/, 'declare ');
      if (!text.startsWith('declare')) {
        text = 'declare ' + text;
      }
      text = text.replace(/\bdeclare\s+declare\b/g, 'declare');
      classes.push(text);
    } else if (ts.isInterfaceDeclaration(node) && node.name) {
      let text = node.getText(sourceFile);
      text = text.replace(/^export\s+/, '');
      text = text.replace(/^declare\s+/, '');
      interfaces.push(text);
    } else if (ts.isTypeAliasDeclaration(node) && node.name) {
      let text = node.getText(sourceFile);
      text = text.replace(/^export\s+/, '');
      if (!text.startsWith('type') && !text.startsWith('declare type')) {
        text = 'type ' + text;
      }
      types.push(text);
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      let text = node.getText(sourceFile);
      text = text.replace(/^export\s+/, 'declare ');
      if (!text.startsWith('declare')) {
        text = 'declare ' + text;
      }
      functions.push(text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return { classes, interfaces, types, functions };
}

function generateYasumuTypes(): string {
  const runtimeFiles = RUNTIME_FILES.map((f) => path.join(RUNTIME_DIR, f));
  const existingFiles = runtimeFiles.filter((f) => fs.existsSync(f));

  if (existingFiles.length === 0) {
    console.warn('No runtime files found');
    return '';
  }

  const seenTypes = new Set<string>();
  const seenInterfaces = new Set<string>();
  const seenClasses = new Set<string>();

  const allTypes: string[] = [];
  const allInterfaces: string[] = [];
  const allClasses: string[] = [];
  const allFunctions: string[] = [];

  const declarations = generateDeclarations(existingFiles);

  const processOrder = RUNTIME_FILES.map((f) => f.replace('.ts', '.d.ts'));

  for (const fileName of processOrder) {
    const content = declarations.get(fileName);
    if (!content) continue;

    if (fileName === 'bootstrap.d.ts') continue;

    const cleaned = cleanDeclarationContent(content, fileName);
    const extracted = extractClassesAndInterfaces(cleaned);

    for (const t of extracted.types) {
      const match = t.match(/^(?:declare\s+)?type\s+(\w+)/);
      if (match && !seenTypes.has(match[1])) {
        seenTypes.add(match[1]);
        allTypes.push(t);
      }
    }

    for (const i of extracted.interfaces) {
      const match = i.match(/^interface\s+(\w+)/);
      if (match && !seenInterfaces.has(match[1])) {
        seenInterfaces.add(match[1]);
        allInterfaces.push(i);
      }
    }

    for (const c of extracted.classes) {
      const match = c.match(/^declare\s+class\s+(\w+)/);
      if (match && !seenClasses.has(match[1])) {
        seenClasses.add(match[1]);
        allClasses.push(c);
      }
    }

    allFunctions.push(...extracted.functions);
  }

  const parts: string[] = [];

  parts.push('// Yasumu Runtime Type Definitions');
  parts.push('// Auto-generated from src-tauri/src/tanxium/runtime');
  parts.push('');

  if (allTypes.length > 0) {
    parts.push('// Type Aliases');
    parts.push(allTypes.join('\n\n'));
    parts.push('');
  }

  if (allInterfaces.length > 0) {
    parts.push('// Interfaces');
    parts.push(allInterfaces.join('\n\n'));
    parts.push('');
  }

  if (allClasses.length > 0) {
    parts.push('// Classes');
    parts.push(allClasses.join('\n\n'));
    parts.push('');
  }

  parts.push('// Yasumu Runtime API');
  parts.push(
    /* typescript */ `
declare class Yasumu {
  static readonly ui: typeof YasumuUI;
  static readonly version: string;
  static readonly isDevMode: boolean;
  static readonly cache: Cache;
  static cuid(): string;
}

declare type OnRequest = (req: YasumuRequest) => void | Promise<void>;
declare type OnResponse = (req: YasumuRequest, res: YasumuResponse) => void | Promise<void>;
declare type OnTest = (req: YasumuRequest, res: YasumuResponse) => void | Promise<void>;

declare module "yasumu:collection" {
  export { Collection };
}
`.trim(),
  );

  parts.push('');
  parts.push('// Testing API');
  parts.push(TESTING_API_TYPES);

  return parts.join('\n');
}

const TESTING_API_TYPES = /* typescript */ `
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
  /**
   * Skip the current test. The test will be marked as skipped.
   */
  skip(): never;
  /**
   * Explicitly fail the current test with an optional message.
   */
  fail(message?: string): never;
  /**
   * Explicitly pass the current test. Useful for early exit.
   */
  succeed(): never;
}

declare function test(name: string, fn: (ctx: TestContext) => void | Promise<void>): void;

declare function describe(name: string, fn: () => void): void;
`.trim();

function main() {
  console.log('Generating Yasumu type definitions...');
  console.log(`Runtime directory: ${RUNTIME_DIR}`);

  const yasumuTypes = generateYasumuTypes();

  if (!yasumuTypes) {
    console.error('Failed to generate type definitions');
    process.exit(1);
  }

  const denoTypes = readFileSync(
    path.join(import.meta.dirname, 'deno.ts.txt'),
    'utf8',
  );

  const output = `/* eslint-disable */
// @ts-nocheck

// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT MANUALLY.
// Run \`pnpm generate-typedef\` to regenerate.
import denoTypes from './env-types/deno.ts.txt' with { type: 'text' };

export const YASUMU_TYPE_DEFINITIONS = [
  {
    content: ${JSON.stringify(yasumuTypes)},
    filePath: 'ts:yasumu/globals.d.ts',
  },
  {
    content: ${JSON.stringify(denoTypes)},
    filePath: 'ts:deno/globals.d.ts',
  }
];
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

  cleanupGeneratedFiles();

  console.log(`✓ Generated type definitions at ${OUTPUT_FILE}`);
  console.log(`  Total size: ${(yasumuTypes.length / 1024).toFixed(2)} KB`);
}

main();
