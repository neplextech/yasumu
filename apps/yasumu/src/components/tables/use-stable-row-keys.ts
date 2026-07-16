import { useCallback, useId, useRef, useState } from 'react';

/** Keeps row state attached to logical rows across edits and canonical data resets. */
export function useStableRowKeys(initialRowCount: number) {
  const prefix = useId();
  const initialCount = Math.max(0, Math.trunc(initialRowCount));
  const sequenceRef = useRef(initialCount);
  const [rowKeys, setRowKeys] = useState(() =>
    Array.from({ length: initialCount }, (_, index) => `${prefix}-${index}`),
  );

  const allocateKeys = useCallback(
    (requestedCount: number) => {
      const count = Math.max(0, Math.trunc(requestedCount));
      const start = sequenceRef.current;
      sequenceRef.current += count;
      return Array.from({ length: count }, (_, offset) => `${prefix}-${start + offset}`);
    },
    [prefix],
  );

  const insertKeys = useCallback(
    (index: number, count: number) => {
      const keys = allocateKeys(count);
      if (!keys.length) return;

      setRowKeys((current) => {
        const insertionIndex = Math.max(0, Math.min(Math.trunc(index), current.length));
        return [...current.slice(0, insertionIndex), ...keys, ...current.slice(insertionIndex)];
      });
    },
    [allocateKeys],
  );

  const insertKey = useCallback((index: number) => insertKeys(index, 1), [insertKeys]);

  const removeKey = useCallback((index: number) => {
    setRowKeys((current) => current.filter((_, keyIndex) => keyIndex !== index));
  }, []);

  const resetKeys = useCallback(
    (rowCount: number) => {
      setRowKeys(allocateKeys(rowCount));
    },
    [allocateKeys],
  );

  return { rowKeys, insertKey, insertKeys, removeKey, resetKeys };
}
