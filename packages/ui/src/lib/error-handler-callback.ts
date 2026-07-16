import { toast } from 'sonner';

export function withErrorHandler<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | undefined> {
  return async (...args: TArgs) => {
    try {
      return await callback(...args);
    } catch (error) {
      toast.error('An error occurred', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return undefined;
    }
  };
}
