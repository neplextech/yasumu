import { toast } from 'sonner';

export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  callback: T,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await callback(...args);
    } catch (error) {
      toast.error('An error occurred', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }) as T;
}
