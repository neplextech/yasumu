'use client';

import EnvironmentSelector from '@/app/[locale]/workspaces/[workspace]/rest/_components/environment-selector';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { RequestTabStrip, type RequestTab } from '@/components/workspace/request-tab-strip';

import { SseIcon } from './sse-icon';

export type { RequestTab };

export function SseRequestTabs({ tabs }: { tabs: RequestTab[] }) {
  const workspace = useActiveWorkspace();
  return (
    <RequestTabStrip
      tabs={tabs}
      queryKeyPrefix="sse-tab"
      queryKeyScope={[workspace.id]}
      actions={<EnvironmentSelector />}
      loadTabDetails={async (id) => {
        const entity = await workspace.sse.get(id);
        return { name: entity.data.name, url: entity.data.url, icon: <SseIcon /> };
      }}
    />
  );
}
