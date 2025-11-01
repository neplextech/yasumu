'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { Trash2 } from 'lucide-react';

interface Event {
  id: string;
  timestamp: string;
  type: 'received' | 'system';
  event?: string;
  data: string | unknown;
}

const mockEvents: Event[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    type: 'system',
    data: 'Connected to SSE stream',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5000).toISOString(),
    type: 'received',
    event: 'message',
    data: 'Hello from server!',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 3000).toISOString(),
    type: 'received',
    event: 'notification',
    data: { type: 'info', message: 'New update available' },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 2000).toISOString(),
    type: 'received',
    event: 'status',
    data: { status: 'online', timestamp: new Date().toISOString() },
  },
];

export default function OutputConsole() {
  const [events] = useState<Event[]>(mockEvents);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatData = (data: string | unknown) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  const getTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'received':
        return 'bg-green-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full border-t bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm font-medium">Events</span>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getTypeColor(event.type)} text-white`}>
                  {event.type.toUpperCase()}
                </Badge>
                {event.event && <Badge variant="outline">{event.event}</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              {event.event && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Event:
                  </span>
                  <span className="text-sm font-mono ml-2">{event.event}</span>
                </div>
              )}
              <pre className="text-sm font-mono bg-background p-2 rounded border overflow-auto whitespace-pre-wrap">
                <code>{formatData(event.data)}</code>
              </pre>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
