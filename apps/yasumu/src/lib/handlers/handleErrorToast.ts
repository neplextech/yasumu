import { toast } from 'sonner';

type Awaitable<T> = T | Promise<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleErrorToast = <T extends (...args: any[]) => Awaitable<any>>(
  fn: T,
) => {
  return async (...args: Parameters<T>): Promise<void> => {
    try {
      await fn(...args);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
};
