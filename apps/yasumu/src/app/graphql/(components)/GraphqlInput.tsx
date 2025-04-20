'use client';
import KeyValueTable from '@/components/KeyValueTable';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YasumuLayout } from '@/lib/constants/layout';
import { useLayout } from '@/stores/AppLayout';
import { GraphqlEditor } from './GraphqlEditor';
import {
  setGraphqlVariables,
  useGraphqlVariables,
} from '@/stores/GraphqlSchemaStore';

export default function GraphqlInput() {
  const layout = useLayout();
  const variables = useGraphqlVariables();

  return (
    <ResizablePanelGroup
      direction={layout === YasumuLayout.Default ? 'vertical' : 'horizontal'}
      autoSaveId={'graphql-editor'}
      className="gap-2 h-full"
    >
      <ResizablePanel
        minSize={30}
        defaultSize={layout === YasumuLayout.Classic ? 57 : 50}
      >
        <GraphqlEditor />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        minSize={layout === YasumuLayout.Default ? 22 : 30}
        defaultSize={50}
      >
        <Tabs defaultValue="variables" className="select-none">
          <TabsList>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          <TabsContent value="variables">
            <KeyValueTable
              value={variables}
              onChange={(value) => {
                setGraphqlVariables(value);
              }}
            />
          </TabsContent>
          <TabsContent value="headers">
            <KeyValueTable value={{}} onChange={() => {}} />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
