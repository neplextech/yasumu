async function setup() {
  try {
    const { YASUMU_ANALYTICS_FLAG_KEY } = await import(
      '@/lib/constants/instrumentation'
    );
    const { Store } = await import('@tauri-apps/plugin-store');
    const store = await Store.load('yasumu-config.json').catch(() => null);

    const shouldTrack =
      (await store
        ?.get<boolean>(YASUMU_ANALYTICS_FLAG_KEY)
        .catch(() => true)) ?? true;

    if (!shouldTrack) return;
  } catch (e) {
    console.error(`Error reading the application configuration: ${e}`);
  }

  const { default: posthog } = await import('posthog-js');

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    defaults: '2025-11-30',
  });
}

setup();
