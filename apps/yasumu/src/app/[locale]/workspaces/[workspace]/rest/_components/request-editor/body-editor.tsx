import type { RestEntityRequestBody } from '@yasumu/core';
import { Label } from '@yasumu/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yasumu/ui/components/select';
import { Textarea } from '@yasumu/ui/components/textarea';
import { File as FileIcon, FileText } from 'lucide-react';
import { useId, useState } from 'react';

import { TextEditor } from '@/components/editors/text-editor';
import FormDataTable, { type FormDataPair } from '@/components/tables/form-data-table';
import KeyValueTable, { type KeyValuePair } from '@/components/tables/key-value-table';
import useDebounced from '@/hooks/use-debounced';

type BodyType = RestEntityRequestBody['type'];
type BodyTypeSelection = BodyType | 'none';

interface BodyEditorProps {
  body: RestEntityRequestBody | null;
  onChange: (body: RestEntityRequestBody | null) => void;
}

const BODY_TYPES = new Set<BodyType>(['json', 'text', 'form-data', 'x-www-form-urlencoded', 'binary']);

function isBodyType(value: string): value is BodyType {
  return BODY_TYPES.has(value as BodyType);
}

function isFormDataPairs(value: unknown): value is FormDataPair[] {
  return (
    Array.isArray(value) &&
    value.every(
      (pair: unknown) =>
        typeof pair === 'object' &&
        pair !== null &&
        'key' in pair &&
        typeof pair.key === 'string' &&
        'enabled' in pair &&
        typeof pair.enabled === 'boolean' &&
        'type' in pair &&
        (pair.type === 'text' || pair.type === 'file') &&
        'value' in pair &&
        (typeof pair.value === 'string' || pair.value instanceof File),
    )
  );
}

function isKeyValuePairs(value: unknown): value is KeyValuePair[] {
  return (
    Array.isArray(value) &&
    value.every(
      (pair: unknown) =>
        typeof pair === 'object' &&
        pair !== null &&
        'key' in pair &&
        typeof pair.key === 'string' &&
        'value' in pair &&
        typeof pair.value === 'string' &&
        'enabled' in pair &&
        typeof pair.enabled === 'boolean',
    )
  );
}

export function BodyEditor(props: BodyEditorProps) {
  return <BodyEditorFields key={props.body?.type ?? 'none'} {...props} />;
}

function BodyEditorFields({ body, onChange }: BodyEditorProps) {
  const currentType: BodyTypeSelection = body?.type ?? 'none';
  const [localData, setLocalData] = useState<unknown>(body?.value);
  const contentTypeId = useId();
  const binaryInputId = useId();

  const debouncedOnChange = useDebounced((value: unknown) => {
    if (body) onChange({ ...body, value });
  }, 500);

  const handleTypeChange = (type: string) => {
    if (type === 'none') {
      onChange(null);
      return;
    }
    if (!isBodyType(type)) return;

    let value: unknown = '';
    if ((type === 'json' || type === 'text') && typeof localData === 'string') value = localData;
    else if (type === 'form-data' && isFormDataPairs(localData)) value = localData;
    else if (type === 'x-www-form-urlencoded' && isKeyValuePairs(localData)) value = localData;
    else if (type === 'form-data' || type === 'x-www-form-urlencoded') value = [];
    else if (type === 'binary') value = null;

    setLocalData(value);
    onChange({ type, value, metadata: body?.metadata ?? {} });
  };

  const updateData = (value: unknown) => {
    setLocalData(value);
    debouncedOnChange(value);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-1">
      <div className="flex items-center gap-4">
        <Label htmlFor={contentTypeId} className="text-muted-foreground whitespace-nowrap">
          Content Type
        </Label>
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger id={contentTypeId} className="h-8 w-[200px]">
            <SelectValue placeholder="Select Body Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="form-data">Multipart Form</SelectItem>
            <SelectItem value="x-www-form-urlencoded">Form URL Encoded</SelectItem>
            <SelectItem value="binary">Binary File</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted/5 relative min-h-0 flex-1 overflow-y-auto rounded-md border">
        {currentType === 'json' ? (
          <TextEditor
            value={typeof localData === 'string' ? localData : ''}
            onChange={updateData}
            language="json"
            placeholder="Enter JSON body..."
            className="h-full rounded-none border-0"
          />
        ) : null}

        {currentType === 'text' ? (
          <Textarea
            aria-label="Text request body"
            placeholder="Enter text body..."
            value={typeof localData === 'string' ? localData : ''}
            onChange={(event) => updateData(event.target.value)}
            className="h-full resize-none border-0 p-4 focus-visible:ring-0"
          />
        ) : null}

        {currentType === 'form-data' ? (
          <div className="p-4">
            <FormDataTable pairs={isFormDataPairs(localData) ? localData : []} onChange={updateData} />
          </div>
        ) : null}

        {currentType === 'x-www-form-urlencoded' ? (
          <div className="p-4">
            <KeyValueTable pairs={isKeyValuePairs(localData) ? localData : []} onChange={updateData} />
          </div>
        ) : null}

        {currentType === 'binary' ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="bg-muted/10 hover:bg-muted/20 flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors">
              <FileText className="size-10 opacity-50" aria-hidden="true" />
              <div className="text-center">
                <input
                  id={binaryInputId}
                  type="file"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setLocalData(file);
                      if (body) onChange({ ...body, value: file });
                    }
                  }}
                />
                <label htmlFor={binaryInputId} className="text-primary cursor-pointer hover:underline">
                  Select a file
                </label>
              </div>
              {localData instanceof File ? (
                <div className="bg-background rounded border px-3 py-1 font-mono text-sm">
                  {localData.name} <span className="text-muted-foreground">({localData.size} bytes)</span>
                </div>
              ) : (
                <p className="text-sm">No file selected</p>
              )}
            </div>
          </div>
        ) : null}

        {currentType === 'none' ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
            <div className="bg-muted/10 rounded-full p-4">
              <FileIcon className="size-6 opacity-50" aria-hidden="true" />
            </div>
            <p className="text-sm">This request has no body</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
