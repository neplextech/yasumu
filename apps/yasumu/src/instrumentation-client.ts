async function setup() {
  try {
    if (process.env.NODE_ENV === 'development') return;

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
  const { app } = await import('@tauri-apps/api');

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    defaults: '2025-11-30',
  });

  const [bundleType, identifier, version, tauriVersion, name] =
    await Promise.all([
      app.getBundleType(),
      app.getIdentifier(),
      app.getVersion(),
      app.getTauriVersion(),
      app.getName(),
    ]).catch(() => []);

  posthog.identify(undefined, {
    app_bundle_type: bundleType || 'unknown',
    app_identifier: identifier || 'unknown',
    app_version: version || 'unknown',
    app_tauri_version: tauriVersion || 'unknown',
    app_name: name || 'unknown',
  });
}

setup();
