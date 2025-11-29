'use client';
import React from 'react';
import { Button } from '@yasumu/ui/components/button';

export default function SendButton() {
  return (
    <Button
      onClick={() => {
        // @ts-ignore
        emitEvent(
          JSON.stringify({
            type: 'send-request',
            payload: {
              url: 'https://api.example.com',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message: 'Hello, world!' }),
            },
          }),
        );
      }}
    >
      Send
    </Button>
  );
}
