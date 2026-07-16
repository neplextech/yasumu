import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, extname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { VIRTUAL_MODULES, type ScriptSource } from '@yasumu/runtime-api';
import ts from 'typescript-legacy';

import type { NodeWorkerData } from './worker-data.js';

const registeredSources = new Map<string, { code: string; filename: string }>();
const virtualRuntimeUrl = new URL('./virtual-runtime.js', import.meta.url).href;
let workspaceModuleUrl: string | undefined;

export function installModuleLoader(data: NodeWorkerData): void {
  if (data.workspaceModule) workspaceModuleUrl = registerSource(data.workspaceModule, data.workspace.root);

  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (isVirtualModule(specifier)) {
        return {
          url: virtualUrl(specifier),
          format: 'module',
          shortCircuit: true,
        };
      }
      if (registeredSources.has(specifier)) {
        return { url: specifier, format: 'module', shortCircuit: true };
      }

      try {
        return nextResolve(specifier, context);
      } catch (error) {
        const fallback = resolveTypeScriptImport(specifier, context.parentURL);
        if (fallback) return { url: fallback, format: 'module', shortCircuit: true };
        throw error;
      }
    },
    load(url, context, nextLoad) {
      const virtualModule = virtualModuleFromUrl(url);
      if (virtualModule) {
        return {
          format: 'module',
          source: virtualModuleSource(virtualModule),
          shortCircuit: true,
        };
      }

      const registered = registeredSources.get(url);
      if (registered) {
        return {
          format: 'module',
          source: transpileTypeScript(registered.code, registered.filename),
          shortCircuit: true,
        };
      }

      if (url.startsWith('file:') && isTypeScriptPath(new URL(url).pathname)) {
        const filename = fileURLToPath(url);
        return {
          format: 'module',
          source: transpileTypeScript(readFileSync(filename, 'utf8'), filename),
          shortCircuit: true,
        };
      }

      return nextLoad(url, context);
    },
  });
}

export function registerScriptSource(source: ScriptSource, workspaceRoot?: string): string {
  return registerSource(source, workspaceRoot);
}

function registerSource(source: ScriptSource, workspaceRoot?: string): string {
  const hash = createHash('sha256').update(source.code).digest('hex').slice(0, 20);
  const url = sourceFileUrl(source, workspaceRoot);
  url.searchParams.set('yasumu-source', hash);
  const href = url.href;
  registeredSources.set(href, {
    code: source.code,
    filename: fileURLToPath(url),
  });
  return href;
}

function sourceFileUrl(source: ScriptSource, workspaceRoot?: string): URL {
  const root = workspaceRoot ? resolve(workspaceRoot) : process.cwd();
  if (source.sourceUrl) {
    try {
      const parsed = new URL(source.sourceUrl);
      if (parsed.protocol === 'file:') return parsed;
    } catch {
      const path = isAbsolute(source.sourceUrl) ? source.sourceUrl : resolve(root, source.sourceUrl);
      return pathToFileURL(path);
    }
  }

  const safeId = source.id.replace(/[^A-Za-z0-9._-]+/g, '-');
  return pathToFileURL(resolve(root, `${safeId || 'script'}.yasumu.ts`));
}

function transpileTypeScript(code: string, filename: string): string {
  const result = ts.transpileModule(code, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      moduleDetection: ts.ModuleDetectionKind.Force,
      isolatedModules: true,
      verbatimModuleSyntax: true,
      inlineSourceMap: true,
      inlineSources: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });

  const errors = result.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error) ?? [];
  if (errors.length > 0) {
    const error = new Error(ts.formatDiagnostics(errors, diagnosticHost));
    error.name = 'TypeScriptCompileError';
    Object.defineProperty(error, 'code', {
      value: 'SCRIPT_COMPILE_ERROR',
      enumerable: true,
    });
    throw error;
  }
  return result.outputText;
}

const diagnosticHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (filename) => filename,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => '\n',
};

function resolveTypeScriptImport(specifier: string, parentUrl?: string): string | undefined {
  if (!parentUrl?.startsWith('file:') || (!specifier.startsWith('./') && !specifier.startsWith('../'))) {
    return undefined;
  }

  const parentPath = fileURLToPath(parentUrl);
  const requestedPath = resolve(dirname(parentPath), specifier);
  const candidates = sourceCandidates(requestedPath);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return undefined;
}

function sourceCandidates(requestedPath: string): string[] {
  const extension = extname(requestedPath);
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') {
    const stem = requestedPath.slice(0, -extension.length);
    return [`${stem}.ts`, `${stem}.tsx`, `${stem}.mts`, `${stem}.cts`];
  }
  if (extension) return [];
  return [
    `${requestedPath}.ts`,
    `${requestedPath}.tsx`,
    `${requestedPath}.mts`,
    resolve(requestedPath, 'index.ts'),
    resolve(requestedPath, 'index.tsx'),
  ];
}

function isTypeScriptPath(pathname: string): boolean {
  return ['.ts', '.tsx', '.mts', '.cts'].some((extension) => pathname.endsWith(extension));
}

function isVirtualModule(specifier: string): specifier is keyof typeof VIRTUAL_MODULES {
  return Object.prototype.hasOwnProperty.call(VIRTUAL_MODULES, specifier);
}

function virtualUrl(specifier: keyof typeof VIRTUAL_MODULES): string {
  return `yasumu-virtual:${specifier.slice('yasumu:'.length)}`;
}

function virtualModuleFromUrl(url: string): keyof typeof VIRTUAL_MODULES | undefined {
  if (!url.startsWith('yasumu-virtual:')) return undefined;
  const specifier = `yasumu:${url.slice('yasumu-virtual:'.length)}`;
  return isVirtualModule(specifier) ? specifier : undefined;
}

function virtualModuleSource(specifier: keyof typeof VIRTUAL_MODULES): string {
  const runtime = JSON.stringify(virtualRuntimeUrl);
  switch (specifier) {
    case 'yasumu:test':
      return `export { describe, expect, test } from ${runtime};`;
    case 'yasumu:workspace':
      return workspaceModuleUrl
        ? `export { workspace } from ${runtime}; export * from ${JSON.stringify(workspaceModuleUrl)};`
        : `export { workspace } from ${runtime};`;
    case 'yasumu:runtime':
      return `export { runtime } from ${runtime};`;
    case 'yasumu:env':
      return `export { env } from ${runtime};`;
    case 'yasumu:files':
      return `export { files } from ${runtime};`;
  }
}
