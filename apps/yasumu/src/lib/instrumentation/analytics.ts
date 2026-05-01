'use client';

import posthog from 'posthog-js';

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

let analyticsEnabled = false;

export function setAnalyticsEnabled(enabled: boolean) {
  analyticsEnabled = enabled;
}

export function isAnalyticsEnabled() {
  return analyticsEnabled && !!(posthog as { __loaded?: boolean }).__loaded;
}

export function trackEvent(
  event: string,
  properties: AnalyticsProperties = {},
) {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, {
    ...properties,
    app_surface: 'desktop',
  });
}

export function trackTiming(
  event: string,
  startedAt: number,
  properties: AnalyticsProperties = {},
) {
  trackEvent(event, {
    ...properties,
    duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
  });
}
