import type { Monaco } from '@monaco-editor/react';
import type { editor, Position as MonacoPosition } from 'monaco-editor';

export type YasumuSnippets = Record<string, string>;

const REQUEST_SCRIPT_SNIPPETS: YasumuSnippets = {
  '!req': 'export async function onRequest(ctx) {\n\t$0\n}',
  '!res': 'export async function onResponse(ctx) {\n\t$0\n}',
  '!test': 'export async function onTest(ctx) {\n\t$0\n}',
};

const EMAIL_SCRIPT_SNIPPETS: YasumuSnippets = {
  '!email': 'export async function onEmail(ctx) {\n\t$0\n}',
};

export const REST_SCRIPT_SNIPPETS = REQUEST_SCRIPT_SNIPPETS;
export const GRAPHQL_SCRIPT_SNIPPETS = REQUEST_SCRIPT_SNIPPETS;
export const SSE_SCRIPT_SNIPPETS = REQUEST_SCRIPT_SNIPPETS;
export const EMAIL_SNIPPETS = EMAIL_SCRIPT_SNIPPETS;

export function registerYasumuSnippets(monaco: Monaco, snippets: YasumuSnippets) {
  return monaco.languages.registerCompletionItemProvider('typescript', {
    triggerCharacters: ['!'],

    provideCompletionItems(model: editor.ITextModel, position: MonacoPosition) {
      const text = model.getLineContent(position.lineNumber).slice(0, position.column - 1);

      const match = text.match(/![a-z]*$/);
      if (!match) return { suggestions: [] };

      const abbreviation = match[0];
      const expansion = snippets[abbreviation];
      if (!expansion) return { suggestions: [] };

      return {
        suggestions: [
          {
            label: abbreviation,
            detail: `Yasumu snippet`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: expansion,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column - abbreviation.length,
              endColumn: position.column,
            },
          },
        ],
      };
    },
  });
}
