import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import HttpMethodSelector from '../http-methods-selector';

interface RequestUrlBarProps {
  method: string;
  url: string;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onUrlBlur: () => void;
  onSend: () => void;
  isSending?: boolean;
}

export function RequestUrlBar({
  method,
  url,
  onMethodChange,
  onUrlChange,
  onUrlBlur,
  onSend,
  isSending,
}: RequestUrlBarProps) {
  return (
    <div className="flex gap-4">
      <HttpMethodSelector
        onChange={withErrorHandler(onMethodChange)}
        value={method}
      />
      <Input
        placeholder="Enter a URL"
        value={url}
        onChange={withErrorHandler((e) => onUrlChange(e.target.value))}
        onBlur={onUrlBlur}
      />
      <Button onClick={withErrorHandler(onSend)} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send'}
      </Button>
    </div>
  );
}
