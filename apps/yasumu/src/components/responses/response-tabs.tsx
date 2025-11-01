'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { CodeView } from './code-view';
import { HeadersTable } from './headers-table';

interface ResponseTabsProps {
  prettyContent: string;
  rawContent: string;
  headers: Record<string, string>;
  showHeaders?: boolean;
}

export function ResponseTabs({
  prettyContent,
  rawContent,
  headers,
  showHeaders = true,
}: ResponseTabsProps) {
  return (
    <Tabs
      defaultValue="pretty"
      className="flex flex-col flex-1 overflow-hidden"
    >
      <div className="px-4 border-b">
        <TabsList className="my-2">
          <TabsTrigger value="pretty">Pretty</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
          {showHeaders && <TabsTrigger value="headers">Headers</TabsTrigger>}
        </TabsList>
      </div>
      <TabsContent value="pretty" className="flex-1 overflow-hidden m-0 p-4">
        <CodeView content={prettyContent} />
      </TabsContent>
      <TabsContent value="raw" className="flex-1 overflow-hidden m-0 p-4">
        <CodeView content={rawContent} className="whitespace-pre-wrap" />
      </TabsContent>
      {showHeaders && (
        <TabsContent value="headers" className="flex-1 overflow-hidden m-0 p-4">
          <HeadersTable headers={headers} />
        </TabsContent>
      )}
    </Tabs>
  );
}
