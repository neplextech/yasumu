import { Button } from '@yasumu/ui/components/button';
import { Spinner } from '@yasumu/ui/components/spinner';
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('HomePage');

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t('message')}</h1>
        <Button size="sm">Button</Button>
        <Spinner />
      </div>
    </div>
  );
}
