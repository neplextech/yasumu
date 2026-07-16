'use client';

import { Button } from '@yasumu/ui/components/button';
import { useEffect } from 'react';

import ErrorScreen from '@/components/visuals/error-screen';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled application error', error);
  }, [error]);

  return (
    <ErrorScreen
      fullScreen
      title="Something went wrong"
      message="Yasumu could not finish loading this view. Try again to continue."
      action={
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
