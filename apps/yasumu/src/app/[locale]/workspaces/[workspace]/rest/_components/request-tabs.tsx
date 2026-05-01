'use client';

import EnvironmentSelector from './environment-selector';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import {
  RequestTabStrip,
  type RequestTab,
} from '@/components/workspace/request-tab-strip';
import { resolveHttpMethodIcon } from './http-methods';

export type { RequestTab };

export function RequestTabs({ tabs }: { tabs: RequestTab[] }) {
  const workspace = useActiveWorkspace();

  return (
    <RequestTabStrip
      tabs={tabs}
      queryKeyPrefix="rest-tab"
      queryKeyScope={[workspace.id]}
      actions={<EnvironmentSelector />}
      loadTabDetails={async (id) => {
        const entity = await workspace.rest.get(id);
        const data = entity.data;
        const Icon = resolveHttpMethodIcon(data.method, { short: false });

        return {
          name: data.name,
          url: data.url,
          icon: <Icon />,
        };
      }}
    />
  );
}
