import { useTranslations } from 'next-intl';

import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';

export default function NotFound() {
  const t = useTranslations('not-found');
  return (
    <main className="relative grid h-screen w-full place-items-center">
      <YasumuBackgroundArt message={t('background-art.message')} />
    </main>
  );
}
