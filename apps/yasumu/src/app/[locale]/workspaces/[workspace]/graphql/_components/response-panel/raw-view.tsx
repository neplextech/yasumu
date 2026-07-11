'use client';

import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';

import HighlightedCodeBlock from '@/components/visuals/code-block/highlighted-code-block';

interface RawViewProps {
  rawBody: string;
}

export function RawView({ rawBody }: RawViewProps) {
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(rawBody), null, 2);
    } catch {
      return rawBody;
    }
  }, [rawBody]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!rawBody) {
    return <p className="text-muted-foreground p-4 text-sm">Empty response body</p>;
  }

  return (
    <div className="relative h-full">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground bg-background/80 absolute top-2 right-4 z-10 h-7 w-7 backdrop-blur-sm"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <ScrollArea className="h-full">
        <HighlightedCodeBlock language="json" className="break-all" codeClassName="break-all">
          {formatted}
        </HighlightedCodeBlock>
      </ScrollArea>
    </div>
  );
}
