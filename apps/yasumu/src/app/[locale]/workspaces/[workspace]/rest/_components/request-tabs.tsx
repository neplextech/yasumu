'use client';

import { useQuery } from '@tanstack/react-query';
import { useHorizontalScroll } from '@yasumu/ui/hooks/use-horizontal-scroll';
import { cn } from '@yasumu/ui/lib/utils';
import { X, Circle } from 'lucide-react';
import { useEffect, useCallback, useRef } from 'react';
import EnvironmentSelector from './environment-selector';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { resolveHttpMethodIcon } from './http-methods';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@yasumu/ui/components/tooltip';

export interface RequestTab {
  id: string;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function RequestTabs({ tabs }: { tabs: RequestTab[] }) {
  const ref = useHorizontalScroll();

  const activeTab = tabs.find((t) => t.active);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'w') {
        e.preventDefault();
        if (activeTab) {
          activeTab.onClose();
        }
      }

      if (isMod && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.active);
        if (currentIndex === -1 || tabs.length <= 1) return;

        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
        }
        tabs[nextIndex]?.onSelect();
      }

      if (isMod && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          tabs[index]?.onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTab]);

  if (!tabs.length) return null;

  return (
    <div className="flex items-center gap-2 select-none w-full max-w-[80vw]">
      <div
        ref={ref}
        className="flex flex-row items-center w-full overflow-x-auto zw-scrollbar bg-background/50 rounded-lg border shadow-sm h-10"
      >
        {tabs.map((tab, idx) => (
          <RequestTabItem tab={tab} key={tab.id} index={idx} />
        ))}
      </div>
      <EnvironmentSelector />
    </div>
  );
}

function RequestTabItem({ tab, index }: { tab: RequestTab; index: number }) {
  const workspace = useActiveWorkspace();
  const tabRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['rest-tab', tab.id],
    queryFn: async () => {
      const entity = await workspace.rest.get(tab.id);
      return entity.data;
    },
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
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        tab.onClose();
      }
    },
    [tab],
  );

  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      tab.onClose();
    },
    [tab],
  );

  const name = data?.name || 'Loading...';
  const url = data?.url || '';
  const method = data?.method || '';
  const Icon = data ? resolveHttpMethodIcon(method, { short: true }) : null;

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
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary w-full rounded-full" />
          )}

          <div className="flex items-center gap-2 py-2">
            {isLoading ? (
              <Circle className="h-2 w-2 animate-pulse text-muted-foreground" />
            ) : (
              Icon && (
                <span className="text-[10px] shrink-0">
                  <Icon />
                </span>
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
                : 'opacity-0 group-hover:opacity-60 hover:!opacity-100',
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
            {Icon && (
              <span className="text-[10px] shrink-0">
                <Icon />
              </span>
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
