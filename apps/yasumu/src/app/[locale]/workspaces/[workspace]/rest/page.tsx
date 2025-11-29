import { Input } from '@yasumu/ui/components/input';
import HttpMethodSelector from './_components/http-methods-selector';
import KeyValueTable from '@/components/tables/key-value-table';
import { Separator } from '@yasumu/ui/components/separator';
import { useTranslations } from 'next-intl';
import RequestTabList from './_components/tabs';
import SendButton from './_components/send-button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';

export default function Home() {
  const t = useTranslations('rest');

  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      <RequestTabList />
      <div className="flex gap-4">
        <HttpMethodSelector />
        <Input placeholder={t('url-input.enter-a-url')} />
        <SendButton />
      </div>
      <Separator />
      <Tabs defaultValue="parameters">
        <TabsList>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="pre-request-script">
            Pre-request Script
          </TabsTrigger>
          <TabsTrigger value="post-response-script">
            Post-response Script
          </TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="parameters">
          <KeyValueTable />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueTable />
        </TabsContent>
        <TabsContent value="body">
          <Textarea placeholder="Your request body goes here..." />
        </TabsContent>
        <TabsContent value="pre-request-script">
          <Textarea placeholder="Your pre-request script goes here..." />
        </TabsContent>
        <TabsContent value="post-response-script">
          <Textarea placeholder="Your post-response script goes here..." />
        </TabsContent>
        <TabsContent value="tests">
          <Textarea placeholder="Your test script goes here..." />
        </TabsContent>
        <TabsContent value="settings">Settings Editor</TabsContent>
      </Tabs>
    </main>
  );
}
