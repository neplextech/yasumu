'use client';

import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { Separator } from '@yasumu/ui/components/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import KeyValueTable from '@/components/tables/key-value-table';

import ConnectButton from './_components/connect-button';

interface EventListener {
  id: string;
  event: string;
  enabled: boolean;
}

export default function SsePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [listeners, setListeners] = useState<EventListener[]>([
    { id: '1', event: 'message', enabled: true },
    { id: '2', event: 'notification', enabled: true },
    { id: '3', event: 'status', enabled: true },
  ]);

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const addListener = () => {
    setListeners([...listeners, { id: Date.now().toString(), event: '', enabled: true }]);
  };

  const removeListener = (id: string) => {
    setListeners(listeners.filter((listener) => listener.id !== id));
  };

  const updateListener = (id: string, field: keyof EventListener, value: string | boolean) => {
    setListeners(listeners.map((listener) => (listener.id === id ? { ...listener, [field]: value } : listener)));
  };

  return (
    <main className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center gap-4">
        <Input placeholder="Enter SSE endpoint URL" />
        <ConnectButton isConnected={isConnected} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        <Badge variant={isConnected ? 'default' : 'outline'}>{isConnected ? 'Connected' : 'Disconnected'}</Badge>
      </div>
      <Separator />
      <Tabs defaultValue="listen">
        <TabsList>
          <TabsTrigger value="listen">Listen</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="pre-connection-script">Pre-connection Script</TabsTrigger>
          <TabsTrigger value="post-connection-script">Post-connection Script</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="listen" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Event Listeners</label>
              <Button variant="outline" size="sm" onClick={addListener}>
                <Plus className="mr-2 h-4 w-4" />
                Add Listener
              </Button>
            </div>
            <div className="space-y-2">
              {listeners.map((listener) => (
                <div key={listener.id} className="flex items-center gap-2 rounded-lg border p-3">
                  <Input
                    placeholder="Event type (leave empty for all events)"
                    value={listener.event}
                    onChange={(e) => updateListener(listener.id, 'event', e.target.value)}
                    disabled={!listener.enabled}
                    className="flex-1 font-mono"
                  />
                  <Badge variant={listener.enabled ? 'default' : 'outline'}>
                    {listener.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => removeListener(listener.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {listeners.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
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
