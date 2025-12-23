'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Button } from '@yasumu/ui/components/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeViewProps {
  content: string;
  language?: string;
  className?: string;
}

export function CodeView({ content, language, className }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative h-full group flex-1 min-h-0">
      <ScrollArea className="h-full w-full">
        <pre
          className={`text-sm font-mono bg-muted/50 p-4 rounded-md min-h-full whitespace-pre-wrap break-all ${
            className || ''
          }`}
        >
          <code data-language={language}>{content}</code>
        </pre>
      </ScrollArea>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
        onClick={handleCopy}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
