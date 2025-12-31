'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import Editor, {
  loader,
  type Monaco,
  type OnMount,
} from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import LoadingScreen from '../visuals/loading-screen';

type IStandaloneCodeEditor = Parameters<OnMount>['0'];

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
}

const registeredLibs = new Set<string>();
let monacoInstance: Monaco | null = null;
let initPromise: Promise<Monaco> | null = null;

function getMonacoInstance(): Promise<Monaco> {
  if (monacoInstance) return Promise.resolve(monacoInstance);
  if (initPromise) return initPromise;

  initPromise = loader.init().then((monaco) => {
    monacoInstance = monaco;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      lib: ['esnext', 'dom'],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    return monaco;
  });

  return initPromise;
}

function registerTypeDefinitions(
  monaco: Monaco,
  typeDefinitions: TypeDefinition[] | TypeDefinition,
) {
  const defs = Array.isArray(typeDefinitions)
    ? typeDefinitions
    : [typeDefinitions];

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const filePath = def.filePath || `ts:filename/definitions-${i}.d.ts`;

    if (registeredLibs.has(filePath)) continue;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      def.content,
      filePath,
    );
    registeredLibs.add(filePath);
  }
}

export function TextEditor({
  value,
  onChange,
  language = 'typescript',
  typeDefinitions = [],
  placeholder,
  readOnly = false,
  className,
}: TextEditorProps) {
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const localMonacoRef = useRef<Monaco | null>(null);
  const { resolvedTheme } = useTheme();
  const [isMonacoReady, setIsMonacoReady] = useState(!!monacoInstance);

  useEffect(() => {
    getMonacoInstance().then((monaco) => {
      localMonacoRef.current = monaco;
      registerTypeDefinitions(monaco, typeDefinitions);
      setIsMonacoReady(true);
    });
  }, [typeDefinitions]);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      localMonacoRef.current = monaco;

      registerTypeDefinitions(monaco, typeDefinitions);

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
    },
    [typeDefinitions, readOnly],
  );

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange?.(val ?? '');
    },
    [onChange],
  );

  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';
  const showPlaceholder = !value && !!placeholder;

  if (!isMonacoReady) {
    return (
      <div
        className={`relative flex-1 min-h-0 w-full overflow-hidden rounded-md border border-border bg-muted/30 ${className ?? ''}`}
      >
        <LoadingScreen fullScreen />
      </div>
    );
  }

  return (
    <div
      className={`relative flex-1 min-h-0 w-full overflow-hidden rounded-md border border-border bg-muted/30 ${className ?? ''}`}
    >
      {showPlaceholder && (
        <div className="pointer-events-none absolute inset-0 z-10 p-3 pl-14 font-mono text-sm text-muted-foreground/50 whitespace-pre-wrap">
          {placeholder}
        </div>
      )}
      <Editor
        height="100%"
        width="100%"
        language={language}
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

export function preloadMonacoEditor(
  typeDefinitions?: TypeDefinition[] | TypeDefinition,
) {
  getMonacoInstance().then((monaco) => {
    if (typeDefinitions) {
      registerTypeDefinitions(monaco, typeDefinitions);
    }
  });
}
