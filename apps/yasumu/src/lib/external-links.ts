import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

import { resolveExternalUrl, type ExternalUrlResolutionOptions } from './external-url-policy';

function findAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!target || typeof target !== 'object') return null;

  const closest = (target as { closest?: unknown }).closest;
  if (typeof closest !== 'function') return null;

  return closest.call(target, 'a[href]') as HTMLAnchorElement | null;
}

export async function openExternalUrl(url: string): Promise<void> {
  if (isTauri()) {
    await openUrl(url);
    return;
  }

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!openedWindow) throw new Error('The browser blocked opening the external URL.');
}

export function handleExternalLinkClick(event: MouseEvent, options: ExternalUrlResolutionOptions): void {
  if (event.defaultPrevented || event.button !== 0) return;

  const anchor = findAnchor(event.target);
  if (!anchor || anchor.hasAttribute('download')) return;

  const url = resolveExternalUrl(anchor.getAttribute('href') ?? '', options);
  if (!url) return;

  event.preventDefault();
  void openExternalUrl(url).catch((error: unknown) => {
    console.error('Failed to open external URL', error);
  });
}
