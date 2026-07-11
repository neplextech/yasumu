'use client';

import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
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
    <div className="group relative h-full min-h-0 flex-1 select-text">
      <ScrollArea className="h-full w-full">
        <pre
          data-allow-context-menu="true"
          className={`bg-muted/50 min-h-full rounded-md p-4 font-mono text-sm break-all whitespace-pre-wrap select-text ${
            className || ''
          }`}
        >
          <code data-language={language}>{content}</code>
        </pre>
      </ScrollArea>
      <Button
        variant="outline"
        size="icon"
        className="bg-background/80 absolute top-2 right-2 h-8 w-8 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        onClick={handleCopy}
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
