'use client';

import EnvironmentSelector from '@/app/[locale]/workspaces/[workspace]/rest/_components/environment-selector';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import {
  RequestTabStrip,
  type RequestTab,
} from '@/components/workspace/request-tab-strip';
import { GraphqlIcon } from './graphql-icon';

export type { RequestTab };

export function GraphqlRequestTabs({ tabs }: { tabs: RequestTab[] }) {
  const workspace = useActiveWorkspace();
  const graphql = workspace.graphql;

  return (
    <RequestTabStrip
      tabs={tabs}
      queryKeyPrefix="graphql-tab"
      queryKeyScope={[workspace.id]}
      actions={<EnvironmentSelector />}
      loadTabDetails={async (id) => {
        const entity = await graphql?.get(id);
        const data = entity?.data;

        return {
          name: data?.name ?? null,
          url: data?.url ?? null,
          icon: <GraphqlIcon />,
        };
      }}
    />
  );
}
