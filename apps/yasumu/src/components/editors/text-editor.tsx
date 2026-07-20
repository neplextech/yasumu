'use client';

import Editor, { loader, type Monaco, type OnMount } from '@monaco-editor/react';
import { Button } from '@yasumu/ui/components/button';
import { cn } from '@yasumu/ui/lib/utils';
import type { editor, Position as MonacoPosition } from 'monaco-editor';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';

import ErrorScreen from '../visuals/error-screen';
import LoadingScreen from '../visuals/loading-screen';
import { type YasumuSnippets, registerYasumuSnippets } from './yasumu-snippets';

export interface TypeDefinition {
  content: string;
  filePath?: string;
}

interface TextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  typeDefinitions?: TypeDefinition[] | TypeDefinition;
  placeholder?: React.ReactNode;
  readOnly?: boolean;
  className?: string;
  snippets?: YasumuSnippets;
}

const EMPTY_TYPE_DEFINITIONS: TypeDefinition[] = [];
const registeredLibs = new Map<string, { content: string; disposables: Array<{ dispose: () => void }> }>();
let monacoInstance: Monaco | null = null;
let initPromise: Promise<Monaco> | null = null;

export function getMonacoInstance(): Promise<Monaco> {
  if (monacoInstance) return Promise.resolve(monacoInstance);
  if (initPromise) return initPromise;

  initPromise = loader
    .init()
    .then((monaco: Monaco) => {
      monacoInstance = monaco;

      const tsDefaults = monaco.languages.typescript.typescriptDefaults;
      const jsDefaults = monaco.languages.typescript.javascriptDefaults;

      const sharedCompilerOptions = {
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        // NodeJs resolution walks up to file:///node_modules/@types/node/ where
        // we register the bundled @types/node declarations.
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowNonTsExtensions: true,
        allowSyntheticDefaultImports: true,
        allowUmdGlobalAccess: true,
        // Relax strict mode — user scripts shouldn't be penalised for missing
        // types they cannot control (e.g. external Deno runtime APIs).
        strict: false,
        noEmit: true,
        esModuleInterop: true,
        skipLibCheck: true,
        lib: ['esnext', 'dom'],
      };

      tsDefaults.setCompilerOptions(sharedCompilerOptions);
      jsDefaults.setCompilerOptions(sharedCompilerOptions);

      tsDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      return monaco;
    })
    .catch((error: unknown) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}

function registerTypeDefinitions(monaco: Monaco, typeDefinitions: TypeDefinition[] | TypeDefinition) {
  const defs = Array.isArray(typeDefinitions) ? typeDefinitions : [typeDefinitions];

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const filePath = def.filePath || `file:///definitions-${i}.d.ts`;

    const registered = registeredLibs.get(filePath);
    if (registered?.content === def.content) continue;

    registered?.disposables.forEach((disposable) => disposable.dispose());

    registeredLibs.set(filePath, {
      content: def.content,
      disposables: [
        monaco.languages.typescript.typescriptDefaults.addExtraLib(def.content, filePath),
        monaco.languages.typescript.javascriptDefaults.addExtraLib(def.content, filePath),
      ],
    });
  }
}

export function TextEditor({
  value,
  onChange,
  language = 'typescript',
  typeDefinitions = EMPTY_TYPE_DEFINITIONS,
  placeholder,
  readOnly = false,
  className,
  snippets,
}: TextEditorProps) {
  const { resolvedTheme } = useTheme();
  const selectedEnvironment = useEnvironmentStore((store) => store.selectedEnvironment);
  const editorId = useId().replaceAll(':', '');
  const [isMonacoReady, setIsMonacoReady] = useState(!!monacoInstance);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);

  const editorPath = useMemo(() => {
    if (language === 'graphql') return `file:///graphql/query-${editorId}.graphql`;
    if (language === 'typescript') return `file:///scripts/${editorId}.ts`;
    if (language === 'javascript') return `file:///scripts/${editorId}.js`;
    return undefined;
  }, [editorId, language]);

  useEffect(() => {
    let active = true;
    setInitializationError(null);

    void getMonacoInstance()
      .then((monaco) => {
        if (!active) return;
        registerTypeDefinitions(monaco, typeDefinitions);
        setIsMonacoReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setInitializationError(error instanceof Error ? error : new Error('Failed to initialize the editor'));
      });

    return () => {
      active = false;
    };
  }, [initializationAttempt, typeDefinitions]);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      registerTypeDefinitions(monaco, typeDefinitions);

      let snippetDisposable: { dispose: () => void } | undefined;
      if (snippets && Object.keys(snippets).length > 0) {
        snippetDisposable = registerYasumuSnippets(monaco, snippets);
      }

      editor.updateOptions({
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 13,
        lineHeight: 20,
        padding: { top: 12, bottom: 12 },
        automaticLayout: true,
        wordWrap: 'on',
        tabSize: 2,
        folding: true,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        fixedOverflowWidgets: true,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        readOnly,
      });

      const interpolationDisposable = monaco.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['{'],
        provideCompletionItems(model: editor.ITextModel, position: MonacoPosition) {
          const prefix = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          const match = prefix.match(/\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)?$/);
          if (!match || !selectedEnvironment) return { suggestions: [] };
          const startColumn = position.column - (match[1]?.length ?? 0);
          const range = new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column);
          const values = [
            ...selectedEnvironment.variables.getKeys().map((key) => ({ key, detail: 'Environment variable' })),
            ...selectedEnvironment.secrets
              .getKeys()
              .map((key) => ({ key: `secrets.${key}`, detail: 'Environment secret' })),
          ];
          return {
            suggestions: values.map(({ key, detail }) => ({
              label: `{{${key}}}`,
              kind: monaco.languages.CompletionItemKind.Variable,
              detail,
              insertText: `${key}}}`,
              range,
            })),
          };
        },
      });

      editor.onDidDispose(() => {
        snippetDisposable?.dispose();
        interpolationDisposable.dispose();
      });
    },
    [typeDefinitions, readOnly, snippets, language, selectedEnvironment],
  );

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange?.(val ?? '');
    },
    [onChange],
  );

  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';

  const showPlaceholder = !value && !!placeholder;

  if (initializationError) {
    return (
      <ErrorScreen
        className={className}
        title="Editor unavailable"
        message={initializationError.message}
        action={
          <Button variant="outline" onClick={() => setInitializationAttempt((attempt) => attempt + 1)}>
            Retry editor
          </Button>
        }
      />
    );
  }

  if (!isMonacoReady) {
    return (
      <div
        className={cn(
          'border-border bg-muted/30 relative min-h-0 w-full flex-1 overflow-hidden rounded-md border',
          className,
        )}
      >
        <LoadingScreen fullScreen />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-border bg-muted/30 relative min-h-0 w-full flex-1 overflow-hidden rounded-md border',
        className,
      )}
    >
      {showPlaceholder && (
        <div className="text-muted-foreground/50 pointer-events-none absolute inset-0 z-10 p-3 pl-14 font-mono text-sm whitespace-pre-wrap">
          {placeholder}
        </div>
      )}
      <Editor
        height="100%"
        width="100%"
        language={language}
        path={editorPath}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={editorTheme}
        options={{
          readOnly,
        }}
        loading={<LoadingScreen fullScreen />}
      />
    </div>
  );
}

export async function preloadMonacoEditor(typeDefinitions?: TypeDefinition[] | TypeDefinition): Promise<void> {
  const monaco = await getMonacoInstance();
  if (typeDefinitions) registerTypeDefinitions(monaco, typeDefinitions);
}
