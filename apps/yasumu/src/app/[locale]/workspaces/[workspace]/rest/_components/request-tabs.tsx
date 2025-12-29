'use client';

import { useQuery } from '@tanstack/react-query';
import { useHorizontalScroll } from '@yasumu/ui/hooks/use-horizontal-scroll';
import { cn } from '@yasumu/ui/lib/utils';
import { X } from 'lucide-react';
import EnvironmentSelector from './environment-selector';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { resolveHttpMethodIcon } from './http-methods';

export interface RequestTab {
  id: string;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function RequestTabs({ tabs }: { tabs: RequestTab[] }) {
  const ref = useHorizontalScroll();

  if (!tabs.length) return null;

  return (
    <div className="flex items-center gap-2 select-none w-full max-w-[80vw]">
      <div
        ref={ref}
        className="flex flex-row items-center w-full overflow-x-auto zw-scrollbar border-x h-9"
      >
        {tabs.map((tab, id, arr) => (
          <RequestTabItem
            tab={tab}
            key={tab.id}
            isFirst={id === 0}
            isLast={id === arr.length - 1}
          />
        ))}
      </div>
      <EnvironmentSelector />
    </div>
  );
}

function RequestTabItem({
  tab,
  isFirst,
  isLast,
}: {
  tab: RequestTab;
  isFirst: boolean;
  isLast: boolean;
}) {
  const workspace = useActiveWorkspace();

  const { data } = useQuery({
    queryKey: ['rest-tab', tab.id],
    queryFn: async () => {
      const entity = await workspace.rest.get(tab.id);
      return entity.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const name = data?.name || 'Loading...';
  const Icon = data ? resolveHttpMethodIcon(data.method) : null;

  return (
    <div
      className={cn(
        'text-xs flex items-center gap-2 px-3 h-full cursor-pointer hover:bg-muted/50 min-w-fit border-b-2 border-transparent transition-colors',
        tab.active && 'bg-muted/50 border-b-primary hover:bg-muted/50',
        'border-r',
        'group relative pr-8',
      )}
      onClick={tab.onSelect}
    >
      {Icon && <Icon />}
      <span className="truncate max-w-[150px]">{name}</span>
      <button
        className={cn(
          'absolute right-2 p-0.5 rounded-sm hover:bg-muted-foreground/20',
          !tab.active && 'invisible group-hover:visible',
        )}
        onClick={(e) => {
          e.stopPropagation();
          tab.onClose();
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
