'use client';

import mime from 'mime-types';
import getProgrammingLanguage from 'detect-programming-language';
import prettier from 'prettier/standalone';
import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import { useEffect, useMemo, useState } from 'react';

const resolveParser = (contentType: string) => {
  const type = mime.extension(contentType);

  const parser = (() => {
    switch (type) {
      case 'json':
        return 'json';
      case 'xml':
      case 'html':
        return 'html';
      case 'yaml':
        return 'yaml';
      default:
        return 'babel';
    }
  })();

  const language = (() => {
    if (!type) return 'plaintext';

    switch (type) {
      case 'json':
        return 'json';
      case 'xml':
      case 'html':
        return 'html';
      case 'yaml':
        return 'yaml';
      case 'css':
      case 'scss':
      case 'less':
        return 'css';
      default:
        return getProgrammingLanguage(type)?.toLowerCase() || 'plaintext';
    }
  })();

  return { type: language, parser };
};

const formatCode = async (source: string, parser: string): Promise<string> => {
  const formatted = await prettier
    .format(source, {
      parser,
      plugins: [babel, estree],
      tabWidth: 2,
      arrowParens: 'always',
      bracketSameLine: false,
      bracketSpacing: true,
      semi: true,
      experimentalTernaries: false,
      singleQuote: false,
      jsxSingleQuote: false,
      quoteProps: 'as-needed',
      trailingComma: 'all',
      singleAttributePerLine: false,
      htmlWhitespaceSensitivity: 'css',
      vueIndentScriptAndStyle: false,
      proseWrap: 'preserve',
      insertPragma: false,
      printWidth: 80,
      requirePragma: false,
      useTabs: false,
      embeddedLanguageFormatting: 'auto',
      endOfLine: 'lf',
    })
    .catch(() => {
      return source;
    });

  return formatted.trim();
};

export function usePrettier(source: string, contentType = '') {
  const [formatted, setFormatted] = useState('');
  const parser = useMemo(() => resolveParser(contentType), [contentType]);

  useEffect(() => {
    formatCode(source, parser.parser).then((formatted) => {
      setFormatted(formatted);
    });
  }, [source, parser.parser]);

  return { code: formatted, parser };
}
