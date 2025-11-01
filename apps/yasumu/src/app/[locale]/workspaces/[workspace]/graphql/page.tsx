import { Input } from '@yasumu/ui/components/input';
import KeyValueTable from '@/components/tables/key-value-table';
import { Separator } from '@yasumu/ui/components/separator';
import SendButton from './(components)/send-button';
import IntrospectButton from './(components)/introspect-button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';

const mockQuery = `query GetUsers {
  users {
    id
    name
    email
    posts {
      id
      title
      content
    }
  }
}`;

const mockVariables = `{
  "userId": "1",
  "limit": 10
}`;

export default function GraphqlPage() {
  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      <div className="flex gap-4">
        <Input placeholder="Enter GraphQL endpoint URL" />
        <IntrospectButton />
        <SendButton />
      </div>
      <Separator />
      <Tabs defaultValue="query">
        <TabsList>
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="pre-request-script">
            Pre-request Script
          </TabsTrigger>
          <TabsTrigger value="post-response-script">
            Post-response Script
          </TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="query">
          <Textarea
            placeholder="Enter your GraphQL query..."
            defaultValue={mockQuery}
            className="font-mono"
          />
        </TabsContent>
        <TabsContent value="variables">
          <Textarea
            placeholder="Enter your GraphQL variables (JSON)..."
            defaultValue={mockVariables}
            className="font-mono"
          />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueTable />
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
