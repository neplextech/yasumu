import { Label } from '@yasumu/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yasumu/ui/components/select';
import { Textarea } from '@yasumu/ui/components/textarea';
import { FileText, File as FileIcon } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';

import { TextEditor } from '@/components/editors/text-editor';
import FormDataTable, { FormDataPair } from '@/components/tables/form-data-table';
import KeyValueTable, { KeyValuePair } from '@/components/tables/key-value-table';
import useDebounced from '@/hooks/use-debounced';

// @ts-ignore
interface BodyEditorProps {
  body: { type: string; data: any } | null;
  onChange: (body: { type: string; data: any } | null) => void;
}

export function BodyEditor({ body, onChange }: BodyEditorProps) {
  const currentType = body?.type || 'none';
  const currentData = body?.data;

  // Local state to manage input value immediately
  // We use key based on type to reset state when type changes
  const [localData, setLocalData] = useState<any>(currentData);

  // Update local data when props change externally (e.g. from server/tab switch)
  // This is tricky because we don't want to overwrite user typing with debounced old data.
  // We'll trust that the parent only updates when it really changed or on mount.
  // Actually, we can use a ref or just compare strict equality?
  // Since we debounce the onChange, the prop `body` will lag behind `localData`.
  // If we reset `localData` to `body.data` every render, we lose the "local" aspect.
  // So we should only update `localData` if `body.data` changes and is different from `localData`?
  // But since we are pushing changes up, `body.data` WILL eventually match `localData` (or close to it).
  // The issue with cursor jumping is caused by re-rendering the input with a new value from props.
  // If we bind input value to `localData`, the cursor shouldn't jump as long as `localData` isn't reset from props mid-typing.
  // So, we should sync props -> localData ONLY when `type` changes or on mount?
  // Or when we detect an "external" change.
  // For now, let's try just initializing state and updating it when type changes.
  // And maybe when `body` reference changes significantly?
  // Let's rely on key prop on the component instance in parent to reset state when switching requests.

  // NOTE: In page.tsx, we should add `key={entityId}` to BodyEditor to force remount on entity switch.

  useEffect(() => {
    setLocalData(currentData);
  }, [currentType]); // Only reset when type changes (or mount)

  // Debounced updater
  const debouncedOnChange = useDebounced((newData: any) => {
    if (body) {
      onChange({ ...body, data: newData });
    } else {
      // If body was null but we are editing, we need to construct it?
      // But body type logic handles null -> type switch.
      // Here we are editing data within a type.
    }
  }, 500);

  const handleTypeChange = (type: string) => {
    if (type === 'none') {
      onChange(null);
    } else {
      let newData: any = '';

      // Preserve compatible data or initialize defaults
      if ((type === 'json' || type === 'text') && typeof localData === 'string') {
        newData = localData;
      } else if (type === 'form-data' || type === 'x-www-form-urlencoded') {
        if (Array.isArray(localData)) {
          newData = localData;
        } else {
          newData = [];
        }
      } else if (type === 'binary') {
        newData = null;
      }

      setLocalData(newData);
      onChange({ type, data: newData });
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalData(newVal);
    debouncedOnChange(newVal);
  };

  const handleJsonChange = (value: string) => {
    setLocalData(value);
    debouncedOnChange(value);
  };

  const handleFormDataChange = (pairs: FormDataPair[]) => {
    setLocalData(pairs);
    debouncedOnChange(pairs);
  };

  const handleUrlEncodedChange = (pairs: KeyValuePair[]) => {
    setLocalData(pairs);
    debouncedOnChange(pairs);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalData(file);
      // Files don't debounce well or need to be debounced?
      // Usually file selection is a one-time event, safe to update immediately.
      if (body) {
        onChange({ ...body, data: file });
      }
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-1">
      <div className="flex items-center gap-4">
        <Label className="text-muted-foreground whitespace-nowrap">Content Type</Label>
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-8 w-[200px]">
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
        {currentType === 'json' && (
          <TextEditor
            value={typeof localData === 'string' ? localData : ''}
            onChange={handleJsonChange}
            language="json"
            placeholder="Enter JSON body..."
            className="h-full rounded-none border-0"
          />
        )}

        {currentType === 'text' && (
          <Textarea
            placeholder="Enter text body..."
            value={typeof localData === 'string' ? localData : ''}
            onChange={handleTextChange}
            className="h-full resize-none border-0 p-4 focus-visible:ring-0"
          />
        )}

        {currentType === 'form-data' && (
          <div className="p-4">
            <FormDataTable pairs={Array.isArray(localData) ? localData : []} onChange={handleFormDataChange} />
          </div>
        )}

        {currentType === 'x-www-form-urlencoded' && (
          <div className="p-4">
            <KeyValueTable pairs={Array.isArray(localData) ? localData : []} onChange={handleUrlEncodedChange} />
          </div>
        )}

        {currentType === 'binary' && (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="bg-muted/10 hover:bg-muted/20 flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors">
              <FileText className="h-10 w-10 opacity-50" />
              <div className="text-center">
                <input type="file" onChange={handleFileChange} className="hidden" id="binary-file-upload" />
                <label htmlFor="binary-file-upload" className="text-primary cursor-pointer hover:underline">
                  Click to select a file
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
        )}

        {currentType === 'none' && (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
            <div className="bg-muted/10 rounded-full p-4">
              <FileIcon className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm">This request has no body</p>
          </div>
        )}
      </div>
    </div>
  );
}
