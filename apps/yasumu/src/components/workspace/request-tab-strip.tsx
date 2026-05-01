'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHorizontalScroll } from '@yasumu/ui/hooks/use-horizontal-scroll';
import { cn } from '@yasumu/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@yasumu/ui/components/tooltip';
import { Circle, X } from 'lucide-react';

export interface RequestTab {
  id: string;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export interface RequestTabDetails {
  name: string | null;
  url?: string | null;
  icon?: ReactNode;
}

interface RequestTabStripProps {
  tabs: RequestTab[];
  queryKeyPrefix: string;
  queryKeyScope: readonly unknown[];
  loadTabDetails: (id: string) => Promise<RequestTabDetails | null | undefined>;
  actions?: ReactNode;
}

export function RequestTabStrip({
  tabs,
  queryKeyPrefix,
  queryKeyScope,
  loadTabDetails,
  actions,
}: RequestTabStripProps) {
  const ref = useHorizontalScroll();
  const activeTab = tabs.find((tab) => tab.active);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && event.key === 'w') {
        event.preventDefault();
        activeTab?.onClose();
      }

      if (isMod && event.key === 'Tab') {
        event.preventDefault();
        const currentIndex = tabs.findIndex((tab) => tab.active);
        if (currentIndex === -1 || tabs.length <= 1) return;

        const nextIndex = event.shiftKey
          ? currentIndex === 0
            ? tabs.length - 1
            : currentIndex - 1
          : currentIndex === tabs.length - 1
            ? 0
            : currentIndex + 1;

        tabs[nextIndex]?.onSelect();
      }

      if (isMod && event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        tabs[Number(event.key) - 1]?.onSelect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, tabs]);

  if (!tabs.length) return null;

  return (
    <div className="flex items-center gap-2 select-none w-full max-w-[80vw]">
      <div
        ref={ref}
        className="flex flex-row items-center w-full overflow-x-auto zw-scrollbar bg-background/50 rounded-lg border shadow-sm h-10"
      >
        {tabs.map((tab) => (
          <RequestTabStripItem
            key={tab.id}
            tab={tab}
            queryKeyPrefix={queryKeyPrefix}
            queryKeyScope={queryKeyScope}
            loadTabDetails={loadTabDetails}
          />
        ))}
      </div>
      {actions}
    </div>
  );
}

function RequestTabStripItem({
  tab,
  queryKeyPrefix,
  queryKeyScope,
  loadTabDetails,
}: {
  tab: RequestTab;
  queryKeyPrefix: string;
  queryKeyScope: readonly unknown[];
  loadTabDetails: (id: string) => Promise<RequestTabDetails | null | undefined>;
}) {
  const tabRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: [queryKeyPrefix, ...queryKeyScope, tab.id],
    queryFn: () => loadTabDetails(tab.id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (tab.active && tabRef.current) {
      tabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [tab.active]);

  const handleMiddleClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 1) return;
      event.preventDefault();
      event.stopPropagation();
      tab.onClose();
    },
    [tab],
  );

  const handleCloseClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      tab.onClose();
    },
    [tab],
  );

  const name = data?.name || 'Loading...';
  const url = data?.url || '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={tabRef}
          className={cn(
            'relative flex items-center gap-2 px-3 h-full cursor-pointer min-w-fit transition-all duration-150',
            'border-r border-border/50 last:border-r-0',
            'group',
            tab.active
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
          onClick={tab.onSelect}
          onMouseDown={handleMiddleClick}
        >
          {tab.active && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-primary w-full rounded-full" />
          )}

          <div className="flex items-center gap-2 py-2">
            {isLoading ? (
              <Circle className="h-2 w-2 animate-pulse text-muted-foreground" />
            ) : (
              data?.icon && (
                <span className="text-[10px] shrink-0">{data.icon}</span>
              )
            )}

            <span
              className={cn(
                'text-xs font-medium truncate max-w-[120px]',
                tab.active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {name}
            </span>
          </div>

          <button
            className={cn(
              'p-0.5 rounded-sm transition-all duration-100',
              'hover:bg-destructive/20 hover:text-destructive',
              tab.active
                ? 'opacity-60 hover:opacity-100'
                : 'opacity-0 group-hover:opacity-60 hover:opacity-100!',
            )}
            onClick={handleCloseClick}
            aria-label="Close tab"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-xs bg-popover border max-w-[400px]"
        arrow={false}
      >
        <div className="flex flex-col gap-2 py-1">
          <div className="flex items-center gap-2">
            {data?.icon && (
              <span className="text-[10px] shrink-0">{data.icon}</span>
            )}
            <span className="font-semibold text-foreground">{name}</span>
          </div>
          {url && (
            <code className="text-[11px] text-muted-foreground font-mono break-all leading-relaxed truncate max-w-[200px]">
              {url}
            </code>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
