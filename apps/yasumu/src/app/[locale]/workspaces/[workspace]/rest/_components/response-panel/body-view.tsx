'use client';

import { useMemo, useState } from 'react';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Button } from '@yasumu/ui/components/button';
import { Check, Copy } from 'lucide-react';
import type { BundledLanguage } from 'shiki/bundle/web';
import type { RestResponse } from '../../_lib/rest-request';
import { getContentType } from '@/components/responses/viewers';
import { formatBytes } from './utils';
import HighlightedCodeBlock from '@/components/visuals/code-block/highlighted-code-block';

interface BodyViewProps {
  response: RestResponse;
}

function getLanguageFromContentType(contentType: string): BundledLanguage {
  const ct = contentType.toLowerCase();

  if (ct.includes('application/json') || ct.includes('+json')) return 'json';
  if (ct.includes('xml') || ct.includes('+xml')) return 'xml';
  if (ct.includes('javascript')) return 'javascript';
  if (ct.includes('typescript')) return 'typescript';
  if (ct.includes('text/html')) return 'html';
  if (ct.includes('text/css')) return 'css';
  if (ct.includes('text/markdown')) return 'markdown';
  if (ct.includes('yaml') || ct.includes('yml')) return 'yaml';
  if (ct.includes('graphql')) return 'graphql';

  return 'text';
}

export function BodyView({ response }: BodyViewProps) {
  const [copied, setCopied] = useState(false);

  const { formatted, language } = useMemo(() => {
    if (response.bodyType !== 'text' || !response.textBody) {
      return { formatted: null, language: 'text' as BundledLanguage };
    }

    const contentType = getContentType(response.headers);
    const lang = getLanguageFromContentType(contentType);

    if (
      contentType.includes('application/json') ||
      contentType.includes('+json')
    ) {
      try {
        return {
          formatted: JSON.stringify(JSON.parse(response.textBody), null, 2),
          language: lang,
        };
      } catch {
        return { formatted: response.textBody, language: lang };
      }
    }

    return { formatted: response.textBody, language: lang };
  }, [response]);

  const handleCopy = async () => {
    if (!formatted) return;
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (response.bodyTruncated) {
    const maxSize = response.bodyType === 'text' ? '5 MB' : '50 MB';
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
        <p className="font-medium">Response body too large to display</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} (max: {maxSize})
        </p>
      </div>
    );
  }

  if (response.bodyType === 'binary') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
        <p className="font-medium">Binary response</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} - Use Preview tab to view
        </p>
      </div>
    );
  }

  if (!response.textBody) {
    return (
      <p className="text-muted-foreground text-sm p-4">Empty response body</p>
    );
  }

  return (
    <div className="relative h-full">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-4 z-10 h-7 w-7 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <ScrollArea className="h-full">
        <HighlightedCodeBlock language={language} className="break-all" enableScroll={false}>
          {formatted}
        </HighlightedCodeBlock>
      </ScrollArea>
    </div>
  );
}
