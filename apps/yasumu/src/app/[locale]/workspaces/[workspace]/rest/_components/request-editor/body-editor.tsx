import { Label } from '@yasumu/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { Textarea } from '@yasumu/ui/components/textarea';
import KeyValueTable, {
  KeyValuePair,
} from '@/components/tables/key-value-table';
import { ChangeEvent } from 'react';

// @ts-ignore
interface BodyEditorProps {
  body: { type: string; data: any } | null;
  onChange: (body: { type: string; data: any } | null) => void;
}

export function BodyEditor({ body, onChange }: BodyEditorProps) {
  const currentType = body?.type || 'none';
  const currentData = body?.data;

  const handleTypeChange = (type: string) => {
    if (type === 'none') {
      onChange(null);
    } else {
      let newData: any = '';

      // Preserve compatible data or initialize defaults
      if (
        (type === 'json' || type === 'text') &&
        typeof currentData === 'string'
      ) {
        newData = currentData;
      } else if (type === 'form-data' || type === 'x-www-form-urlencoded') {
        if (Array.isArray(currentData)) {
          newData = currentData;
        } else {
          newData = [];
        }
      } else if (type === 'binary') {
        newData = null;
      }

      onChange({ type, data: newData });
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (body) {
      onChange({ ...body, data: e.target.value });
    }
  };

  const handlePairsChange = (pairs: KeyValuePair[]) => {
    if (body) {
      onChange({ ...body, data: pairs });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (body && file) {
      onChange({ ...body, data: file });
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-4">
        <Label>Content Type</Label>
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Body Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="form-data">Form Data</SelectItem>
            <SelectItem value="x-www-form-urlencoded">
              x-www-form-urlencoded
            </SelectItem>
            <SelectItem value="binary">Binary File</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-h-0 relative overflow-y-auto">
        {currentType === 'json' && (
          <Textarea
            placeholder="Enter JSON body..."
            value={typeof currentData === 'string' ? currentData : ''}
            onChange={handleTextChange}
            className="font-mono h-full resize-none"
          />
        )}

        {currentType === 'text' && (
          <Textarea
            placeholder="Enter text body..."
            value={typeof currentData === 'string' ? currentData : ''}
            onChange={handleTextChange}
            className="h-full resize-none"
          />
        )}

        {(currentType === 'form-data' ||
          currentType === 'x-www-form-urlencoded') && (
          <KeyValueTable
            pairs={Array.isArray(currentData) ? currentData : []}
            onChange={handlePairsChange}
          />
        )}

        {currentType === 'binary' && (
          <div className="border border-dashed border-muted-foreground/50 rounded-md p-8 flex flex-col items-center justify-center gap-4 h-full text-muted-foreground bg-muted/10">
            <input type="file" onChange={handleFileChange} />
            {currentData instanceof File ? (
              <p>
                Selected: {currentData.name} ({currentData.size} bytes)
              </p>
            ) : (
              <p>No file selected</p>
            )}
          </div>
        )}

        {currentType === 'none' && (
          <div className="h-full flex items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
            No body
          </div>
        )}
      </div>
    </div>
  );
}
