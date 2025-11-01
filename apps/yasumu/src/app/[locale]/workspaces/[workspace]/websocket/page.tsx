'use client';

import { useState } from 'react';
import { Input } from '@yasumu/ui/components/input';
import KeyValueTable from '@/components/tables/key-value-table';
import { Separator } from '@yasumu/ui/components/separator';
import ConnectButton from './(components)/connect-button';
import SendButton from './(components)/send-button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';
import { Badge } from '@yasumu/ui/components/badge';

const mockMessage = 'Hello, WebSocket server!';

export default function WebsocketPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(mockMessage);

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <Input placeholder="Enter WebSocket server URL (ws:// or wss://)" />
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
      <Tabs defaultValue="message">
        <TabsList>
          <TabsTrigger value="message">Message</TabsTrigger>
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
        <TabsContent value="message" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Enter your message (plain text or JSON)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono min-h-[200px]"
            />
          </div>
          <SendButton />
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
