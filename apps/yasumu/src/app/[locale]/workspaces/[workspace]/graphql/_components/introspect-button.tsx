import { Button } from '@yasumu/ui/components/button';
import { cn } from '@yasumu/ui/lib/utils';
import { RotateCw } from 'lucide-react';

interface IntrospectButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function IntrospectButton({ onClick, isLoading, disabled }: IntrospectButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isLoading ? 'Introspecting GraphQL schema' : 'Introspect GraphQL schema'}
      title="Introspect GraphQL schema"
      onClick={onClick}
      disabled={isLoading || disabled}
    >
      <RotateCw aria-hidden="true" className={cn('size-4', isLoading && 'animate-spin')} />
    </Button>
  );
}
