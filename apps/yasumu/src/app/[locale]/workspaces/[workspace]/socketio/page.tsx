'use client';

import { useState } from 'react';
import { Input } from '@yasumu/ui/components/input';
import KeyValueTable from '@/components/tables/key-value-table';
import { Separator } from '@yasumu/ui/components/separator';
import ConnectButton from './(components)/connect-button';
import EmitButton from './(components)/emit-button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';
import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { Plus, X } from 'lucide-react';

interface EventListener {
  id: string;
  event: string;
  enabled: boolean;
}

const mockEvent = 'message';
const mockEventData = `{
  "text": "Hello, server!",
  "userId": "123"
}`;

export default function SocketioPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [eventName, setEventName] = useState(mockEvent);
  const [eventData, setEventData] = useState(mockEventData);
  const [listeners, setListeners] = useState<EventListener[]>([
    { id: '1', event: 'message', enabled: true },
    { id: '2', event: 'notification', enabled: true },
  ]);

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const addListener = () => {
    setListeners([
      ...listeners,
      { id: Date.now().toString(), event: '', enabled: true },
    ]);
  };

  const removeListener = (id: string) => {
    setListeners(listeners.filter((listener) => listener.id !== id));
  };

  const updateListener = (
    id: string,
    field: keyof EventListener,
    value: string | boolean,
  ) => {
    setListeners(
      listeners.map((listener) =>
        listener.id === id ? { ...listener, [field]: value } : listener,
      ),
    );
  };

  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <Input placeholder="Enter Socket.IO server URL" />
        <ConnectButton
          isConnected={isConnected}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
        <Badge variant={isConnected ? 'default' : 'outline'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      <Separator />
      <Tabs defaultValue="emit">
        <TabsList>
          <TabsTrigger value="emit">Emit</TabsTrigger>
          <TabsTrigger value="listen">Listen</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="pre-connection-script">
            Pre-connection Script
          </TabsTrigger>
          <TabsTrigger value="post-connection-script">
            Post-connection Script
          </TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="emit" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Name</label>
            <Input
              placeholder="Enter event name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Data</label>
            <Textarea
              placeholder="Enter event data (JSON)..."
              value={eventData}
              onChange={(e) => setEventData(e.target.value)}
              className="font-mono"
            />
          </div>
          <EmitButton />
        </TabsContent>
        <TabsContent value="listen" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Event Listeners</label>
              <Button variant="outline" size="sm" onClick={addListener}>
                <Plus className="h-4 w-4 mr-2" />
                Add Listener
              </Button>
            </div>
            <div className="space-y-2">
              {listeners.map((listener) => (
                <div
                  key={listener.id}
                  className="flex gap-2 items-center p-3 border rounded-lg"
                >
                  <Input
                    placeholder="Event name"
                    value={listener.event}
                    onChange={(e) =>
                      updateListener(listener.id, 'event', e.target.value)
                    }
                    disabled={!listener.enabled}
                    className="font-mono flex-1"
                  />
                  <Badge variant={listener.enabled ? 'default' : 'outline'}>
                    {listener.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListener(listener.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {listeners.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No event listeners. Click "Add Listener" to start listening.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueTable />
        </TabsContent>
        <TabsContent value="pre-connection-script">
          <Textarea placeholder="Your pre-connection script goes here..." />
        </TabsContent>
        <TabsContent value="post-connection-script">
          <Textarea placeholder="Your post-connection script goes here..." />
        </TabsContent>
        <TabsContent value="tests">
          <Textarea placeholder="Your test script goes here..." />
        </TabsContent>
        <TabsContent value="settings">Settings Editor</TabsContent>
      </Tabs>
    </main>
  );
}
