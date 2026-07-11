'use client';

import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
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

export function getMonacoInstance(): Promise<Monaco> {
  if (monacoInstance) return Promise.resolve(monacoInstance);
  if (initPromise) return initPromise;

  initPromise = loader.init().then((monaco: Monaco) => {
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
    const filePath = def.filePath || `file:///definitions-${i}.d.ts`;

    if (registeredLibs.has(filePath)) continue;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(def.content, filePath);
    monaco.languages.typescript.javascriptDefaults.addExtraLib(def.content, filePath);
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

  const editorPath = useMemo(() => {
    const id = Math.random().toString(36).slice(2);
    if (language === 'graphql') return `file:///graphql/query-${id}.graphql`;
    if (language === 'typescript') return `file:///scripts/${id}.ts`;
    if (language === 'javascript') return `file:///scripts/${id}.js`;
    return undefined;
  }, [language]);

  useEffect(() => {
    getMonacoInstance().then((monaco) => {
      localMonacoRef.current = monaco;
      if (typeDefinitions) {
        registerTypeDefinitions(monaco, typeDefinitions);
      }
      setIsMonacoReady(true);
    });
  }, [typeDefinitions]);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      localMonacoRef.current = monaco;

      if (typeDefinitions) {
        registerTypeDefinitions(monaco, typeDefinitions);
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

export function preloadMonacoEditor(
  typeDefinitions?: TypeDefinition[] | TypeDefinition,
) {
  getMonacoInstance().then((monaco) => {
    if (typeDefinitions) {
      registerTypeDefinitions(monaco, typeDefinitions);
    }
  });
}
