'use client';

import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { toast } from '@yasumu/ui/components/sonner';
import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BundledLanguage } from 'shiki/bundle/web';

import { getContentType } from '@/components/responses/viewers';
import HighlightedCodeBlock from '@/components/visuals/code-block/highlighted-code-block';

import { MAX_BINARY_BODY_SIZE, MAX_TEXT_BODY_SIZE, type RestResponse } from '../../_lib/rest-request';
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
  const copiedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (response.bodyType === 'binary') {
      onSwitchToPreview?.();
    }
  }, [response, onSwitchToPreview]);

  useEffect(
    () => () => {
      if (copiedResetRef.current) clearTimeout(copiedResetRef.current);
    },
    [],
  );

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
    try {
      await navigator.clipboard.writeText(formatted);
      if (copiedResetRef.current) clearTimeout(copiedResetRef.current);
      setCopied(true);
      copiedResetRef.current = setTimeout(() => {
        copiedResetRef.current = null;
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy the response body', {
        description: error instanceof Error ? error.message : 'Clipboard access is unavailable',
      });
    }
  };

  if (response.bodyTruncated) {
    const maxSize = response.bodyType === 'text' ? MAX_TEXT_BODY_SIZE : MAX_BINARY_BODY_SIZE;
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="font-medium">Response body too large to display</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} (max: {formatBytes(maxSize)})
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
            type="button"
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
        type="button"
        variant="ghost"
        size="icon"
        aria-label={copied ? 'Response body copied' : 'Copy response body'}
        title={copied ? 'Copied' : 'Copy response body'}
        className="text-muted-foreground hover:text-foreground bg-background/80 absolute top-2 right-4 z-10 h-7 w-7 backdrop-blur-sm"
        onClick={handleCopy}
      >
        {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
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
