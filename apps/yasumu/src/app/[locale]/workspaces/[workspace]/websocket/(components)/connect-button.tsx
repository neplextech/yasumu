import { Button } from '@yasumu/ui/components/button';

interface ConnectButtonProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectButton({
  isConnected,
  onConnect,
  onDisconnect,
}: ConnectButtonProps) {
  return (
    <Button
      variant={isConnected ? 'destructive' : 'default'}
      onClick={isConnected ? onDisconnect : onConnect}
    >
      {isConnected ? 'Disconnect' : 'Connect'}
    </Button>
  );
}
