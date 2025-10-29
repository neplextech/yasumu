'use client';

import { useHorizontalScroll } from '@yasumu/ui/hooks/use-horizontal-scroll';
import { cn } from '@yasumu/ui/lib/utils';
import { X } from 'lucide-react';
import EnvironmentSelector from './environment-selector';

export interface RequestTab {
  name: string;
  icon?: () => React.ReactNode;
}

export function RequestTabs({ tabs }: { tabs: RequestTab[] }) {
  const ref = useHorizontalScroll();

  if (!tabs.length) return null;

  return (
    <div className="flex items-center gap-2 select-none max-w-[80vw]">
      <div
        ref={ref}
        className="flex flex-row items-center w-full overflow-x-auto zw-scrollbar border-x"
      >
        {tabs.map((tab, id, arr) => {
          return (
            <RequestTab
              tab={tab}
              key={id}
              isFirst={id === 0}
              isLast={id === arr.length - 1}
            />
          );
        })}
      </div>
      <EnvironmentSelector />
    </div>
  );
}

function RequestTab({
  tab,
  isFirst,
  isLast,
}: {
  tab: RequestTab;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isActive = false;

  return (
    <button
      className={cn(
        'text-xs flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/80 min-w-fit',
        isActive && 'bg-muted/80 hover:bg-muted/50',
        'border border-muted/80',
        'group',
        {
          'border-l-0': isFirst,
          'border-r-0': isLast,
        },
      )}
    >
      {tab.icon && <tab.icon />} {tab.name}
      <X
        className={cn('h-3 w-3', !isActive && 'invisible group-hover:visible')}
        // onClick={async (e) => {
        //   e.stopPropagation();
        //   removeHistoryByPath(tab.path);

        //   await Yasumu.workspace?.rest.removeFromHistory(tab.path).catch(console.error);

        //   if (isActive) {
        //     const nextItem = history.filter((item) => item.path !== tab.path)[0] ?? null;
        //     const item = nextItem ? await Yasumu.workspace?.rest.open(nextItem?.path) : null;
        //     setCurrent(item ?? null);
        //     await Yasumu.workspace?.rest.setLastOpenedRequest(item ?? null).catch(console.error);
        //   }
        // }}
      />
    </button>
  );
}
