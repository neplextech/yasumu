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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';
import { Input } from '@yasumu/ui/components/input';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Button } from '@yasumu/ui/components/button';
import { Trash } from 'lucide-react';
import AuthEditor from './auth-editor';

// @ts-ignore
interface RestRequestTabsProps {
  parameters: KeyValuePair[];
  headers: KeyValuePair[];
  body: { type: string; data: any } | null;
  url?: string;
  pathParams?: Record<string, { value: string; enabled: boolean }>;
  onParametersChange: (pairs: KeyValuePair[]) => void;
  onHeadersChange: (pairs: KeyValuePair[]) => void;
  onBodyChange: (body: { type: string; data: any } | null) => void;
  onPathParamsChange?: (
    params: Record<string, { value: string; enabled: boolean }>,
  ) => void;
}

export function RestRequestTabs({
  parameters,
  headers,
  body,
  url = '',
  pathParams = {},
  onParametersChange,
  onHeadersChange,
  onBodyChange,
  onPathParamsChange,
}: RestRequestTabsProps) {
  const paramKeys = Array.from(url.matchAll(/:([a-zA-Z0-9_]+)/g)).map(
    (m) => m[1],
  );
  const uniqueKeys = Array.from(new Set(paramKeys));
  const hasPathParams = uniqueKeys.length > 0;

  const handlePathParamChange = (
    key: string,
    field: 'value' | 'enabled',
    value: any,
  ) => {
    const current = pathParams[key] || { value: '', enabled: true };
    const newParams = {
      ...pathParams,
      [key]: { ...current, [field]: value },
    };
    onPathParamsChange?.(newParams);
  };

  const deletePathParam = (key: string) => {
    const newParams = { ...pathParams };
    delete newParams[key];
    onPathParamsChange?.(newParams);
  };

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
            value="auth"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Auth
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
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <TabsContent value="parameters" className="h-full mt-0 space-y-4">
          {hasPathParams && (
            <div className="space-y-2 mb-6">
              <div className="text-sm text-muted-foreground">
                Path Parameters
              </div>
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueKeys.map((key) => {
                    const param = pathParams[key] || {
                      value: '',
                      enabled: true,
                    };
                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <Input
                            value={key}
                            disabled
                            readOnly
                            className="bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={param.value}
                            onChange={(e) =>
                              handlePathParamChange(
                                key,
                                'value',
                                e.target.value,
                              )
                            }
                            placeholder="Value"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={param.enabled}
                              onCheckedChange={(c) =>
                                handlePathParamChange(
                                  key,
                                  'enabled',
                                  c === true,
                                )
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePathParam(key)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="text-sm text-muted-foreground mb-2">
            Search Parameters
          </div>
          <KeyValueTable pairs={parameters} onChange={onParametersChange} />
        </TabsContent>
        <TabsContent value="headers" className="h-full mt-0 space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            Request Headers
          </div>
          <KeyValueTable pairs={headers} onChange={onHeadersChange} />
        </TabsContent>
        <TabsContent value="auth" className="h-full mt-0">
          <div className="p-4 border rounded-md bg-muted/5 text-muted-foreground text-sm">
            Authentication
          </div>
          <AuthEditor headers={headers} onChange={onHeadersChange} />
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
      </div>
    </Tabs>
  );
}
