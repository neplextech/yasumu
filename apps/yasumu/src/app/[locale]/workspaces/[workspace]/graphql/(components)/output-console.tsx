'use client';

import React from 'react';
import { ResponseStatusBar, ResponseTabs } from '@/components/responses';

const mockGraphqlResponse = {
  status: 200,
  statusText: 'OK',
  time: 189,
  headers: {
    'content-type': 'application/json',
    'content-length': '856',
    'x-graphql-time': '45',
    date: 'Mon, 01 Jan 2024 12:00:00 GMT',
  },
  body: {
    data: {
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          posts: [
            {
              id: '1',
              title: 'First Post',
              content: 'This is my first post',
            },
          ],
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          posts: [],
        },
      ],
    },
    errors: null,
  },
};

const rawResponse = `HTTP/1.1 200 OK
content-type: application/json
content-length: 856
x-graphql-time: 45
date: Mon, 01 Jan 2024 12:00:00 GMT

{"data":{"users":[{"id":"1","name":"John Doe","email":"john.doe@example.com","posts":[{"id":"1","title":"First Post","content":"This is my first post"}]},{"id":"2","name":"Jane Smith","email":"jane.smith@example.com","posts":[]}]},"errors":null}`;

export default function OutputConsole() {
  const prettifiedJson = JSON.stringify(mockGraphqlResponse.body, null, 2);

  return (
    <div className="flex flex-col h-full border-t bg-background">
      <ResponseStatusBar
        status={mockGraphqlResponse.status}
        statusText={mockGraphqlResponse.statusText}
        time={mockGraphqlResponse.time}
      />
      <ResponseTabs
        prettyContent={prettifiedJson}
        rawContent={rawResponse}
        headers={mockGraphqlResponse.headers}
      />
    </div>
  );
}
