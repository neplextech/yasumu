'use client';

import type { ComponentType } from 'react';
import type { EntityHistoryContextData } from '@/components/workspace/entity-history-context';
import type { RequestTab } from '@/components/workspace/request-tab-strip';

interface EntityRequestTabListProps {
  historyState: EntityHistoryContextData;
  Tabs: ComponentType<{ tabs: RequestTab[] }>;
}

export function EntityRequestTabList({
  historyState,
  Tabs,
}: EntityRequestTabListProps) {
  const { history, removeFromHistory, entityId, setEntityId } = historyState;

  const tabs = history.map((id) => ({
    id,
    active: id === entityId,
    onSelect: () => setEntityId(id),
    onClose: () => removeFromHistory(id),
  }));

  return <Tabs tabs={tabs} />;
}
