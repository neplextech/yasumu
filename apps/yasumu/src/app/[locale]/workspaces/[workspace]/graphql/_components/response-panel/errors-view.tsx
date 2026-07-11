'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { AlertCircle } from 'lucide-react';

import type { GraphqlError } from '../../_lib/graphql-request';

interface ErrorsViewProps {
  errors: GraphqlError[] | null;
}

export function ErrorsView({ errors }: ErrorsViewProps) {
  if (!errors || errors.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">No errors in response</p>;
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {errors.map((error, index) => (
          <div key={index} className="border-destructive/30 bg-destructive/5 space-y-2 rounded-lg border p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-destructive text-sm font-medium">{error.message}</p>
                {error.locations && error.locations.length > 0 && (
                  <div className="text-muted-foreground text-xs">
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
                  <div className="text-muted-foreground text-xs">
                    <span className="font-medium">Path: </span>
                    <span className="font-mono">{error.path.join('.')}</span>
                  </div>
                )}
                {error.extensions && Object.keys(error.extensions).length > 0 && (
                  <div className="text-muted-foreground mt-2 text-xs">
                    <span className="font-medium">Extensions: </span>
                    <pre className="bg-muted/50 mt-1 overflow-auto rounded p-2 font-mono text-[11px]">
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
