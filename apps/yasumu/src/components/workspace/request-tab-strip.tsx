'use client';

import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipTrigger } from '@yasumu/ui/components/tooltip';
import { useHorizontalScroll } from '@yasumu/ui/hooks/use-horizontal-scroll';
import { cn } from '@yasumu/ui/lib/utils';
import { Circle, X } from 'lucide-react';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

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

  const handleTabListKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') {
        return;
      }

      const currentTab =
        event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>('[role="tab"]') : null;
      if (!currentTab) return;

      const tabElements = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const currentIndex = tabElements.indexOf(currentTab);
      if (currentIndex < 0) return;

      event.preventDefault();
      const nextIndex =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : event.key === 'ArrowLeft'
              ? (currentIndex - 1 + tabs.length) % tabs.length
              : (currentIndex + 1) % tabs.length;

      tabs[nextIndex]?.onSelect();
      tabElements[nextIndex]?.focus();
    },
    [tabs],
  );

  if (!tabs.length) return null;

  return (
    <div className="flex w-full max-w-[80vw] items-center gap-2 select-none">
      <div
        ref={ref}
        role="tablist"
        aria-label="Open requests"
        onKeyDown={handleTabListKeyDown}
        className="zw-scrollbar bg-background/50 flex h-10 w-full flex-row items-center overflow-x-auto rounded-lg border shadow-sm"
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
            'relative flex items-center gap-2 px-3 h-full min-w-fit transition-all duration-150',
            'border-r border-border/50 last:border-r-0',
            'group',
            tab.active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
          onMouseDown={handleMiddleClick}
        >
          {tab.active && (
            <div className="bg-primary absolute bottom-0 left-1/2 h-0.5 w-full -translate-x-1/2 rounded-full" />
          )}

          <button
            type="button"
            role="tab"
            aria-selected={tab.active}
            tabIndex={tab.active ? 0 : -1}
            className="focus-visible:ring-ring flex cursor-pointer items-center gap-2 py-2 outline-none focus-visible:ring-2"
            onClick={tab.onSelect}
          >
            {isLoading ? (
              <Circle aria-hidden="true" className="text-muted-foreground size-2 animate-pulse" />
            ) : (
              data?.icon && <span className="shrink-0 text-[10px]">{data.icon}</span>
            )}

            <span
              className={cn(
                'text-xs font-medium truncate max-w-[120px]',
                tab.active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {name}
            </span>
          </button>

          <button
            type="button"
            className={cn(
              'p-0.5 rounded-sm transition-all duration-100',
              'hover:bg-destructive/20 hover:text-destructive',
              tab.active ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:opacity-100!',
            )}
            onClick={handleCloseClick}
            aria-label={`Close ${name}`}
          >
            <X aria-hidden="true" className="size-3" />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-popover max-w-[400px] border text-xs" arrow={false}>
        <div className="flex flex-col gap-2 py-1">
          <div className="flex items-center gap-2">
            {data?.icon && <span className="shrink-0 text-[10px]">{data.icon}</span>}
            <span className="text-foreground font-semibold">{name}</span>
          </div>
          {url && (
            <code className="text-muted-foreground max-w-[200px] truncate font-mono text-[11px] leading-relaxed break-all">
              {url}
            </code>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
