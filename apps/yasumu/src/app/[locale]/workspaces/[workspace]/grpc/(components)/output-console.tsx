'use client';

import React from 'react';
import { ResponseStatusBar, ResponseTabs } from '@/components/responses';

const mockGrpcResponse = {
  status: 200,
  statusText: 'OK',
  time: 156,
  headers: {
    'content-type': 'application/grpc',
    'grpc-status': '0',
    'grpc-message': '',
    date: 'Mon, 01 Jan 2024 12:00:00 GMT',
  },
  body: {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    createdAt: '2024-01-01T12:00:00Z',
  },
};

const rawResponse = `HTTP/2 200 OK
content-type: application/grpc
grpc-status: 0
grpc-message: 
date: Mon, 01 Jan 2024 12:00:00 GMT

{"id":"1","name":"John Doe","email":"john.doe@example.com","createdAt":"2024-01-01T12:00:00Z"}`;

export default function OutputConsole() {
  const prettifiedJson = JSON.stringify(mockGrpcResponse.body, null, 2);

  return (
    <div className="flex flex-col h-full border-t bg-background">
      <ResponseStatusBar
        status={mockGrpcResponse.status}
        statusText={mockGrpcResponse.statusText}
        time={mockGrpcResponse.time}
      />
      <ResponseTabs
        prettyContent={prettifiedJson}
        rawContent={rawResponse}
        headers={mockGrpcResponse.headers}
      />
    </div>
  );
}
