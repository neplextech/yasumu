'use client';
import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import HttpMethodSelector from './(components)/http-methods-selector';
import KeyValueTable from '@/components/tables/key-value-table';
import { RequestTabs } from './(components)/request-tabs';
import { Separator } from '@yasumu/ui/components/separator';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('rest');
  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      <RequestTabs tabs={[]} />
      <div className="flex gap-4">
        <HttpMethodSelector />
        <Input placeholder={t('url-input.enter-a-url')} />
        <Button>{t('url-input.send-button')}</Button>
      </div>
      <Separator />
      <KeyValueTable value={{}} onChange={() => {}} />
    </main>
  );
}
