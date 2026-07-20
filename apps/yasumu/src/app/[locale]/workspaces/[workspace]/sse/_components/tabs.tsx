'use client';

import { EntityRequestTabList } from '@/components/workspace/entity-request-tab-list';

import { useSseContext } from '../_providers/sse-context';
import { SseRequestTabs } from './request-tabs';

export default function RequestTabList() {
  return <EntityRequestTabList historyState={useSseContext()} Tabs={SseRequestTabs} />;
}
