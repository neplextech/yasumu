'use client';

import { useRestContext } from '../_providers/rest-context';
import { RequestTabs } from './request-tabs';

export default function RequestTabList() {
  const { history, removeFromHistory, entityId, setEntityId } =
    useRestContext();
  const tabs = history.map((id) => ({
    id,
    active: id === entityId,
    onSelect: () => setEntityId(id),
    onClose: () => removeFromHistory(id),
  }));

  return <RequestTabs tabs={tabs} />;
}
