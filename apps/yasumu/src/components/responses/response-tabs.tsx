'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { CodeView } from './code-view';
import { HeadersTable } from './headers-table';
import { CookiesTable } from './cookies-table';

interface ResponseTabsProps {
  prettyContent: string;
  rawContent: string;
  headers: Record<string, string>;
  cookies?: string[];
  showHeaders?: boolean;
}

export function ResponseTabs({
  prettyContent,
  rawContent,
  headers,
  cookies = [],
  showHeaders = true,
}: ResponseTabsProps) {
  const headersCount = Object.keys(headers).length;
  const cookiesCount = cookies.length;

  return (
    <Tabs
      defaultValue="pretty"
      className="flex flex-col flex-1 overflow-hidden"
    >
      <div className="px-1 border-b">
        <TabsList className="bg-transparent h-10 w-full justify-start gap-2 p-0 rounded-none">
          <TabsTrigger
            value="pretty"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Body
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Headers{' '}
            <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {headersCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="cookies"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Cookies{' '}
            <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {cookiesCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="raw"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Raw
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pretty" className="flex-1 min-h-0 m-0 p-0">
        <CodeView content={prettyContent} language="json" />
      </TabsContent>

      <TabsContent value="raw" className="flex-1 min-h-0 m-0 p-0">
        <CodeView content={rawContent} />
      </TabsContent>

      {showHeaders && (
        <TabsContent value="headers" className="flex-1 min-h-0 m-0 p-4">
          <HeadersTable headers={headers} />
        </TabsContent>
      )}

      <TabsContent value="cookies" className="flex-1 min-h-0 m-0 p-4">
        <CookiesTable cookies={cookies} />
      </TabsContent>
    </Tabs>
  );
}
