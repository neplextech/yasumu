'use client';

import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Trash2 } from 'lucide-react';
import React, { useState } from 'react';

interface Message {
  id: string;
  timestamp: string;
  type: 'sent' | 'received' | 'system';
  data: string | unknown;
}

const mockMessages: Message[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    type: 'system',
    data: 'Connected to WebSocket server',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5000).toISOString(),
    type: 'sent',
    data: 'Hello, server!',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 3000).toISOString(),
    type: 'received',
    data: 'Hello, client!',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 2000).toISOString(),
    type: 'received',
    data: {
      type: 'notification',
      message: 'Connection established successfully',
    },
  },
];

export default function OutputConsole() {
  const [messages] = useState<Message[]>(mockMessages);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatData = (data: string | unknown) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  const getTypeColor = (type: Message['type']) => {
    switch (type) {
      case 'sent':
        return 'bg-blue-500';
      case 'received':
        return 'bg-green-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-background flex h-full flex-col border-t">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Messages</span>
        <Button variant="ghost" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-muted/30 hover:bg-muted/50 rounded-lg border p-3 transition-colors">
              <div className="mb-2 flex items-center gap-2">
                <Badge className={`${getTypeColor(message.type)} text-white`}>{message.type.toUpperCase()}</Badge>
                <span className="text-muted-foreground ml-auto text-xs">{formatTimestamp(message.timestamp)}</span>
              </div>
              <pre className="bg-background overflow-auto rounded border p-2 font-mono text-sm whitespace-pre-wrap">
                <code>{formatData(message.data)}</code>
              </pre>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
