'use client';
import { Extension, useCodeMirror, UseCodeMirror } from '@uiw/react-codemirror';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function useTextEditor(
  editor: React.RefObject<HTMLDivElement>,
  {
    extensions = [],
    language,
    code,
    setCode,
    ...rest
  }: {
    extensions?: Extension[];
    language?: string;
    code?: string;
    setCode?: (code: string) => void;
  } & Partial<Omit<UseCodeMirror, 'container' | 'value' | 'onChange' | 'theme' | 'extensions' | 'lang'>>,
) {
  const { theme, systemTheme } = useTheme();
  const editorTheme = theme === 'system' && systemTheme ? systemTheme : theme || 'light';
  const { setContainer, view } = useCodeMirror({
    ...rest,
    container: editor.current,
    value: code ?? '',
    onChange(value) {
      setCode?.(value.trim());
    },
    theme: editorTheme as 'light',
    editable: true,
    extensions,
    lang: language,
    basicSetup: {
      foldGutter: true,
      highlightSpecialChars: true,
      tabSize: 2,
      lineNumbers: true,
      allowMultipleSelections: true,
      autocompletion: true,
      closeBrackets: true,
      syntaxHighlighting: true,
      ...(typeof rest.basicSetup === 'object' ? rest.basicSetup : {}),
    },
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.current]);

  return { view };
}
