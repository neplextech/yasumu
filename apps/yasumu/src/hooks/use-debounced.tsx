'use client';

import { useCallback, useEffect, useRef } from 'react';

export default function useDebounced<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  const callbackRef = useRef(callback);
  const delayRef = useRef(delay);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  callbackRef.current = callback;
  delayRef.current = delay;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback((...args: TArgs) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      callbackRef.current(...args);
    }, delayRef.current);
  }, []);
}
