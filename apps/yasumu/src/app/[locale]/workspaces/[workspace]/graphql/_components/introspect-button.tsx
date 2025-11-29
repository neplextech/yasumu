import { Button } from '@yasumu/ui/components/button';
import { RotateCw } from 'lucide-react';

export default function IntrospectButton() {
  return (
    <Button variant="outline">
      <RotateCw className="h-4 w-4" />
    </Button>
  );
}
