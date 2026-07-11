'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';

import { CodeView } from './code-view';
import { CookiesTable } from './cookies-table';
import { HeadersTable } from './headers-table';

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
    <Tabs defaultValue="pretty" className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b px-1">
        <TabsList className="h-10 w-full justify-start gap-2 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="pretty"
            className="data-[state=active]:border-primary h-full rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Body
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="data-[state=active]:border-primary h-full rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Headers{' '}
            <span className="text-muted-foreground bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs">
              {headersCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="cookies"
            className="data-[state=active]:border-primary h-full rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Cookies{' '}
            <span className="text-muted-foreground bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs">
              {cookiesCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="raw"
            className="data-[state=active]:border-primary h-full rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Raw
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pretty" className="m-0 min-h-0 flex-1 p-0">
        <CodeView content={prettyContent} language="json" />
      </TabsContent>

      <TabsContent value="raw" className="m-0 min-h-0 flex-1 p-0">
        <CodeView content={rawContent} />
      </TabsContent>

      {showHeaders && (
        <TabsContent value="headers" className="m-0 min-h-0 flex-1 p-4">
          <HeadersTable headers={headers} />
        </TabsContent>
      )}

      <TabsContent value="cookies" className="m-0 min-h-0 flex-1 p-4">
        <CookiesTable cookies={cookies} />
      </TabsContent>
    </Tabs>
  );
}
