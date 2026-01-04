'use client';

import { useCallback } from 'react';
import { VariablePopoverContent } from './variable-popover-content';

export function useVariablePopover() {
  const renderVariablePopover = useCallback((variableName: string) => {
    return <VariablePopoverContent variableName={variableName} />;
  }, []);

  return { renderVariablePopover };
}
