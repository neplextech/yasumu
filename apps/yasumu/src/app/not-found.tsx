import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('not-found');
  return (
    <main className="w-full h-screen relative grid place-items-center">
      <YasumuBackgroundArt message={t('background-art.message')} />
    </main>
  );
}
