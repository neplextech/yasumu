'use client';

import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { BundledLanguage } from 'shiki/bundle/web';

import { getContentType } from '@/components/responses/viewers';
import HighlightedCodeBlock from '@/components/visuals/code-block/highlighted-code-block';

import type { RestResponse } from '../../_lib/rest-request';
import { formatBytes } from './utils';

interface BodyViewProps {
  response: RestResponse;
  onSwitchToPreview?: () => void;
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

  return 'md';
}

export function BodyView({ response, onSwitchToPreview }: BodyViewProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (response.bodyType === 'binary') {
      onSwitchToPreview?.();
    }
  }, [response, onSwitchToPreview]);

  const { formatted, language } = useMemo(() => {
    if (response.bodyType !== 'text' || !response.textBody) {
      return { formatted: null, language: 'text' as BundledLanguage };
    }

    const contentType = getContentType(response.headers);
    const lang = getLanguageFromContentType(contentType);

    if (contentType.includes('application/json') || contentType.includes('+json')) {
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
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="font-medium">Response body too large to display</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} (max: {maxSize})
        </p>
      </div>
    );
  }

  if (response.bodyType === 'binary') {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="font-medium">Binary response</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} - Use{' '}
          <button
            onClick={onSwitchToPreview}
            className="text-primary cursor-pointer underline underline-offset-2 hover:opacity-80"
          >
            Preview tab
          </button>{' '}
          to view
        </p>
      </div>
    );
  }

  if (!response.textBody) {
    return <p className="text-muted-foreground p-4 text-sm">Empty response body</p>;
  }

  return (
    <div className="relative h-full select-text">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground bg-background/80 absolute top-2 right-4 z-10 h-7 w-7 backdrop-blur-sm"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <ScrollArea className="h-full" data-allow-context-menu="true">
        <HighlightedCodeBlock
          language={language}
          className="break-all select-text"
          codeClassName="break-all select-text"
        >
          {formatted ?? ''}
        </HighlightedCodeBlock>
      </ScrollArea>
    </div>
  );
}
