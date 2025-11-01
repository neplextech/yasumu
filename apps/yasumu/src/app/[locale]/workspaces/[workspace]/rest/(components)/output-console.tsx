'use client';

import React from 'react';
import { ResponseStatusBar, ResponseTabs } from '@/components/responses';

const mockResponse = {
  status: 200,
  statusText: 'OK',
  time: 245,
  headers: {
    'content-type': 'application/json',
    'content-length': '1245',
    'x-ratelimit-limit': '1000',
    'x-ratelimit-remaining': '999',
    'cache-control': 'no-cache',
    date: 'Mon, 01 Jan 2024 12:00:00 GMT',
  },
  body: {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    tags: ['user', 'premium', 'active'],
    metadata: {
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
      version: '1.0.0',
    },
  },
};

const rawResponse = `HTTP/1.1 200 OK
content-type: application/json
content-length: 1245
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
cache-control: no-cache
date: Mon, 01 Jan 2024 12:00:00 GMT

{"id":1,"name":"John Doe","email":"john.doe@example.com","address":{"street":"123 Main St","city":"New York","state":"NY","zipCode":"10001"},"tags":["user","premium","active"],"metadata":{"createdAt":"2024-01-01T12:00:00Z","updatedAt":"2024-01-01T12:00:00Z","version":"1.0.0"}}`;

export default function OutputConsole() {
  const prettifiedJson = JSON.stringify(mockResponse.body, null, 2);

  return (
    <div className="flex flex-col h-full border-t bg-background">
      <ResponseStatusBar
        status={mockResponse.status}
        statusText={mockResponse.statusText}
        time={mockResponse.time}
      />
      <ResponseTabs
        prettyContent={prettifiedJson}
        rawContent={rawResponse}
        headers={mockResponse.headers}
      />
    </div>
  );
}
