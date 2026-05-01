'use client';

import { EntityRequestTabList } from '@/components/workspace/entity-request-tab-list';
import { useGraphqlContext } from '../_providers/graphql-context';
import { GraphqlRequestTabs as GraphqlTabList } from './request-tabs';

export default function RequestTabList() {
  const historyState = useGraphqlContext();

  return (
    <EntityRequestTabList historyState={historyState} Tabs={GraphqlTabList} />
  );
}
