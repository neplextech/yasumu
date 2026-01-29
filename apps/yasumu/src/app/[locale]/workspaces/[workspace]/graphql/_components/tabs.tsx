'use client';

import { useGraphqlContext } from '../_providers/graphql-context';
import { GraphqlRequestTabs as GraphqlTabList } from './request-tabs';

export default function RequestTabList() {
  const { history, removeFromHistory, entityId, setEntityId } =
    useGraphqlContext();
  const tabs = history.map((id) => ({
    id,
    active: id === entityId,
    onSelect: () => setEntityId(id),
    onClose: () => removeFromHistory(id),
  }));

  return <GraphqlTabList tabs={tabs} />;
}
