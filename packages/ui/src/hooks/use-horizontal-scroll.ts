'use client';
import { useEffect, useRef } from 'react';

export function useHorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      const onWheel = (event: WheelEvent) => {
        if (event.deltaY === 0) return;
        event.preventDefault();
        element.scrollTo({
          left: element.scrollLeft + event.deltaY,
        });
      };

      element.addEventListener('wheel', onWheel, { passive: false });
      return () => element.removeEventListener('wheel', onWheel);
    }
  }, [ref]);

  return ref;
}
