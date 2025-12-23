'use client';
import { useRestContext } from '../_providers/rest-context';
import { RequestTabs } from './request-tabs';
import { useQuery } from '@tanstack/react-query';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { restQueries } from '../_constant/rest-queries-options';
import { resolveHttpMethodIcon } from './http-methods';

export default function RequestTabList() {
  const { history, removeFromHistory, entityId, setEntityId } =
    useRestContext();
  const workspace = useActiveWorkspace();

  // Map history items to tabs
  const tabs = history.map((id) => {
    // Fetch entity details for each tab to show name/method
    // Ideally we would have this data in history, or use a cached query
    // For now, let's create a small component for each tab to fetch its own data?
    // Or better, assume we have basic info or just show ID/Loading if not available.
    // But since we need icons, we probably want to fetch.
    // Let's defer fetching to the RequestTab component itself if possible,
    // or just accept that we might need to query for all history items.
    // A better approach for a real app is to have a "history" store that includes metadata.
    // For this MVP/refactor, let's try to query options.

    return {
      id,
      isActive: id === entityId,
    };
  });

  return (
    <RequestTabs
      tabs={tabs.map((t) => ({
        id: t.id,
        name: 'Loading...',
        active: t.isActive,
        onSelect: () => setEntityId(t.id),
        onClose: () => removeFromHistory(t.id),
        icon: () => null, // Placeholder
      }))}
    />
  );
}
