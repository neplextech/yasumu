'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import type { GraphqlError } from '../../_lib/graphql-request';
import { AlertCircle } from 'lucide-react';

interface ErrorsViewProps {
  errors: GraphqlError[] | null;
}

export function ErrorsView({ errors }: ErrorsViewProps) {
  if (!errors || errors.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No errors in response</p>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {errors.map((error, index) => (
          <div
            key={index}
            className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  {error.message}
                </p>
                {error.locations && error.locations.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Locations: </span>
                    {error.locations.map((loc, locIndex) => (
                      <span key={locIndex} className="font-mono">
                        Line {loc.line}, Column {loc.column}
                        {locIndex < error.locations!.length - 1 ? ' | ' : ''}
                      </span>
                    ))}
                  </div>
                )}
                {error.path && error.path.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Path: </span>
                    <span className="font-mono">{error.path.join('.')}</span>
                  </div>
                )}
                {error.extensions &&
                  Object.keys(error.extensions).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium">Extensions: </span>
                      <pre className="mt-1 p-2 bg-muted/50 rounded text-[11px] font-mono overflow-auto">
                        {JSON.stringify(error.extensions, null, 2)}
                      </pre>
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
