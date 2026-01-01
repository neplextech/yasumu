'use client';
import { useLayoutEffect, useState } from 'react';
import { highlight } from './highlighter';
import { BundledLanguage } from 'shiki/bundle/web';
import { cn } from '@yasumu/ui/lib/utils';

export default function HighlightedCodeBlock({
  children,
  language,
  className,
  enableScroll = true,
}: {
  children: string;
  language: BundledLanguage;
  className?: string;
  enableScroll?: boolean;
}) {
  const [nodes, setNodes] = useState<React.ReactNode>(null);

  useLayoutEffect(() => {
    void highlight(children, language).then(setNodes).catch(console.error);
  }, [children, language]);

  const scrollClass = enableScroll ? 'overflow-x-auto' : '';

  if (!nodes)
    return (
      <pre className={cn('p-4 text-sm', scrollClass, className)}>
        <code className="text-foreground font-mono text-xs leading-relaxed whitespace-pre">
          {children}
        </code>
      </pre>
    );

  return (
    <div className={cn('p-4 text-sm', scrollClass, className)}>{nodes}</div>
  );
}
