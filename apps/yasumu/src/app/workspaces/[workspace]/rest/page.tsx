'use client';
import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import HttpMethodSelector from './(components)/http-methods-selector';
import KeyValueTable from '@/components/tables/key-value-table';
import { RequestTabs } from './(components)/request-tabs';
import { Separator } from '@yasumu/ui/components/separator';

export default function Home() {
  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      <RequestTabs tabs={[]} />
      <div className="flex gap-4">
        <HttpMethodSelector />
        <Input placeholder="Enter a URL..." />
        <Button>Send</Button>
      </div>
      <Separator />
      <KeyValueTable value={{}} onChange={() => {}} />
    </main>
  );
}
