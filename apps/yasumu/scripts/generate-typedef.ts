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

const RUNTIME_FILES = ['ui.ts', 'yasumu-request.ts', 'bootstrap.ts'];
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

  const processOrder = ['ui.d.ts', 'yasumu-request.d.ts', 'bootstrap.d.ts'];

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
    `
declare class Yasumu {
  static readonly ui: typeof YasumuUI;
  static readonly version: string;
  static readonly isDevMode: boolean;
  static cuid(): string;
  static postMessage(message: unknown): void;
  static isReady(): boolean;
  static onReady(listener: () => unknown): () => void;
  static onEvent(listener: (event: string) => unknown): () => void;
  static registerVirtualModule(name: string, code: string): void;
  static unregisterVirtualModule(name: string): void;
  static getResourcesDir(): string;
  static getAppDataDir(): string;
}
`.trim(),
  );

  return parts.join('\n');
}

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
