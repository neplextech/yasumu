'use client';

import { EntityRequestTabList } from '@/components/workspace/entity-request-tab-list';
import { useRestContext } from '../_providers/rest-context';
import { RequestTabs } from './request-tabs';

export default function RequestTabList() {
  const historyState = useRestContext();

  return (
    <EntityRequestTabList historyState={historyState} Tabs={RequestTabs} />
  );
}
