import { Button } from '@yasumu/ui/components/button';
import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import HighlightedCodeBlock from './highlighted-code-block';
import type { BundledLanguage } from 'shiki/bundle/web';
import LanguageIcon from './language-icon';
import { cn } from '@yasumu/ui/lib/utils';

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
    <div className="rounded-lg border bg-background overflow-hidden">
      {!hideShell && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <span className="text-xs font-medium text-muted-foreground inline-flex items-center gap-2">
            <LanguageIcon
              className={cn('size-4 rounded-[4px]', iconClassName)}
              language={language}
            />{' '}
            {title || 'Code'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopySnippet}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      <HighlightedCodeBlock language="typescript" className={className}>
        {children}
      </HighlightedCodeBlock>
    </div>
  );
}
