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
      <div className="px-1">
        <TabsList>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="pre-request-script">Pre-req</TabsTrigger>
          <TabsTrigger value="post-response-script">Post-res</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto p-1 pt-4">
        <TabsContent value="parameters" className="h-full mt-0">
          <KeyValueTable pairs={parameters} onChange={onParametersChange} />
        </TabsContent>
        <TabsContent value="headers" className="h-full mt-0">
          <KeyValueTable pairs={headers} onChange={onHeadersChange} />
        </TabsContent>
        <TabsContent value="body" className="h-full mt-0">
          <BodyEditor body={body} onChange={onBodyChange} />
        </TabsContent>
        <TabsContent value="pre-request-script" className="h-full mt-0">
          <Textarea
            placeholder="Your pre-request script goes here..."
            className="h-full resize-none font-mono"
          />
        </TabsContent>
        <TabsContent value="post-response-script" className="h-full mt-0">
          <Textarea
            placeholder="Your post-response script goes here..."
            className="h-full resize-none font-mono"
          />
        </TabsContent>
        <TabsContent value="tests" className="h-full mt-0">
          <Textarea
            placeholder="Your test script goes here..."
            className="h-full resize-none font-mono"
          />
        </TabsContent>
        <TabsContent value="settings" className="h-full mt-0">
          Settings Editor
        </TabsContent>
      </div>
    </Tabs>
  );
}
