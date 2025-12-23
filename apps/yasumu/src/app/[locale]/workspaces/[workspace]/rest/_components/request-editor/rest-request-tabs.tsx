import KeyValueTable, {
  KeyValuePair,
} from '@/components/tables/key-value-table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';
import { BodyEditor } from './body-editor';

import { FormDataPair } from '@/components/tables/form-data-table';

// @ts-ignore
interface RestRequestTabsProps {
  parameters: KeyValuePair[];
  headers: KeyValuePair[];
  body: { type: string; data: any } | null;
  onParametersChange: (pairs: KeyValuePair[]) => void;
  onHeadersChange: (pairs: KeyValuePair[]) => void;
  onBodyChange: (body: { type: string; data: any } | null) => void;
}

export function RestRequestTabs({
  parameters,
  headers,
  body,
  onParametersChange,
  onHeadersChange,
  onBodyChange,
}: RestRequestTabsProps) {
  return (
    <Tabs defaultValue="parameters" className="flex-1 flex flex-col min-h-0">
      <div className="px-1 border-b">
        <TabsList className="bg-transparent h-10 w-full justify-start gap-2 p-0 rounded-none">
          <TabsTrigger
            value="parameters"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Parameters
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Headers
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Body
          </TabsTrigger>
          <TabsTrigger
            value="scripts"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Scripts
          </TabsTrigger>
          <TabsTrigger
            value="tests"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Tests
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Settings
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <TabsContent value="parameters" className="h-full mt-0 space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            Query Parameters
          </div>
          <KeyValueTable pairs={parameters} onChange={onParametersChange} />
        </TabsContent>
        <TabsContent value="headers" className="h-full mt-0 space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            Request Headers
          </div>
          <KeyValueTable pairs={headers} onChange={onHeadersChange} />
        </TabsContent>
        <TabsContent value="body" className="h-full mt-0">
          <BodyEditor body={body} onChange={onBodyChange} />
        </TabsContent>
        <TabsContent value="scripts" className="h-full mt-0">
          <div className="h-full flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">Request Scripts</div>
            <Textarea
              placeholder="// Write your pre-request and post-response scripts here..."
              className="flex-1 resize-none font-mono bg-muted/5 border-muted-foreground/20 p-4"
              spellCheck={false}
            />
          </div>
        </TabsContent>
        <TabsContent value="tests" className="h-full mt-0">
          <div className="h-full flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">Tests</div>
            <Textarea
              placeholder="// Write your tests here..."
              className="flex-1 resize-none font-mono bg-muted/5 border-muted-foreground/20 p-4"
              spellCheck={false}
            />
          </div>
        </TabsContent>
        <TabsContent value="settings" className="h-full mt-0">
          <div className="p-4 border rounded-md bg-muted/5 text-muted-foreground text-sm">
            Request Settings (Coming Soon)
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
