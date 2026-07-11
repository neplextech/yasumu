'use client';

import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Trash2 } from 'lucide-react';
import React, { useState } from 'react';

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
    <div className="bg-background flex h-full flex-col border-t">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Events</span>
        <Button variant="ghost" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {events.map((event) => (
            <div key={event.id} className="bg-muted/30 hover:bg-muted/50 rounded-lg border p-3 transition-colors">
              <div className="mb-2 flex items-center gap-2">
                <Badge className={`${getTypeColor(event.type)} text-white`}>{event.type.toUpperCase()}</Badge>
                {event.event && <Badge variant="outline">{event.event}</Badge>}
                <span className="text-muted-foreground ml-auto text-xs">{formatTimestamp(event.timestamp)}</span>
              </div>
              {event.event && (
                <div className="mb-2">
                  <span className="text-muted-foreground text-xs font-medium">Event:</span>
                  <span className="ml-2 font-mono text-sm">{event.event}</span>
                </div>
              )}
              <pre className="bg-background overflow-auto rounded border p-2 font-mono text-sm whitespace-pre-wrap">
                <code>{formatData(event.data)}</code>
              </pre>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
