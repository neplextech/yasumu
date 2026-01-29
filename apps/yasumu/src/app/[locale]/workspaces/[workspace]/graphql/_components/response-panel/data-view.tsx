'use client';

import { useMemo, useState } from 'react';
import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Check, Copy } from 'lucide-react';
import HighlightedCodeBlock from '@/components/visuals/code-block/highlighted-code-block';

interface DataViewProps {
  data: unknown;
}

export function DataView({ data }: DataViewProps) {
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => {
    if (data === null || data === undefined) {
      return 'null';
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (data === null || data === undefined) {
    return (
      <p className="text-muted-foreground text-sm p-4">No data in response</p>
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
        <HighlightedCodeBlock
          language="json"
          className="break-all"
          codeClassName="break-all"
        >
          {formatted}
        </HighlightedCodeBlock>
      </ScrollArea>
    </div>
  );
}
