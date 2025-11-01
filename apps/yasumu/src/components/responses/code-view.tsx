import { ScrollArea } from '@yasumu/ui/components/scroll-area';

interface CodeViewProps {
  content: string;
  language?: string;
  className?: string;
}

export function CodeView({ content, language, className }: CodeViewProps) {
  return (
    <ScrollArea className="h-full">
      <pre
        className={`text-sm font-mono bg-muted/50 p-4 rounded-md overflow-auto ${
          className || ''
        }`}
      >
        <code data-language={language}>{content}</code>
      </pre>
    </ScrollArea>
  );
}
