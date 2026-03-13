import { Button } from '@yasumu/ui/components/button';
import { cn } from '@yasumu/ui/lib/utils';
import { RotateCw } from 'lucide-react';

interface IntrospectButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function IntrospectButton({
  onClick,
  isLoading,
  disabled,
}: IntrospectButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={isLoading || disabled}
    >
      <RotateCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
    </Button>
  );
}
