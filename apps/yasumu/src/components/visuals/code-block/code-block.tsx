import { Button } from '@yasumu/ui/components/button';
import { cn } from '@yasumu/ui/lib/utils';
import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import type { BundledLanguage } from 'shiki/bundle/web';

import HighlightedCodeBlock from './highlighted-code-block';
import LanguageIcon from './language-icon';

export default function CodeBlock({
  children,
  language,
  className,
  iconClassName,
  title,
  hideShell = false,
}: {
  children: string;
  language: BundledLanguage;
  className?: string;
  iconClassName?: string;
  title?: string;
  hideShell?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopySnippet = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-background overflow-hidden rounded-lg border">
      {!hideShell && (
        <div className="bg-background flex items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium">
            <LanguageIcon className={cn('size-4 rounded-[4px]', iconClassName)} language={language} /> {title || 'Code'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            onClick={handleCopySnippet}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
      <HighlightedCodeBlock language="typescript" className={className}>
        {children}
      </HighlightedCodeBlock>
    </div>
  );
}
