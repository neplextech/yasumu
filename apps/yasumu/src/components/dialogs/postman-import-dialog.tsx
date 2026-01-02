import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@yasumu/ui/components/dialog';
import { Button } from '@yasumu/ui/components/button';
import { Textarea } from '@yasumu/ui/components/textarea';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@yasumu/ui/components/alert';
import { Spinner } from '@yasumu/ui/components/spinner';
import { SiPostman } from 'react-icons/si';
import { open } from '@tauri-apps/plugin-dialog';
import { useMutation } from '@tanstack/react-query';
import { useActiveWorkspace } from '../providers/workspace-provider';
import { useCallback, useState, useRef } from 'react';
import { ExternalWorkspaceImportStrategy } from '@yasumu/core';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { CheckCircle2, XCircle, Upload, FileJson } from 'lucide-react';

interface PostmanImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

export default function PostmanImportDialog({
  open: dialogOpen,
  onOpenChange,
}: PostmanImportDialogProps) {
  const workspace = useActiveWorkspace();
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (importContent: string) =>
      workspace.external.importWorkspace({
        strategy: ExternalWorkspaceImportStrategy.Postman,
        content: importContent,
      }),
  });

  const status: ImportStatus = isPending
    ? 'importing'
    : isSuccess
      ? 'success'
      : isError
        ? 'error'
        : 'idle';

  const handleFilePick = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (selected) {
      const fileContent = await readTextFile(selected);
      setContent(fileContent);
      setFileName(selected.split('/').pop() ?? selected);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find((f) => f.name.endsWith('.json'));

    if (jsonFile) {
      const text = await jsonFile.text();
      setContent(text);
      setFileName(jsonFile.name);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      try {
        JSON.parse(pastedText);
        setFileName(null);
      } catch {
        // Not valid JSON, let it go through to textarea
      }
    }
  }, []);

  const handleImport = useCallback(() => {
    if (!content.trim()) return;
    reset();
    mutate(content);
  }, [content, mutate, reset]);

  const handleReset = useCallback(() => {
    setContent('');
    setFileName(null);
    reset();
  }, [reset]);

  const hasContent = content.trim().length > 0;

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiPostman className="size-4 fill-[#ff6c37]" />
            Import from Postman
          </DialogTitle>
          <DialogDescription>
            Import a Postman collection by dropping a file, picking one, or
            pasting JSON content.
          </DialogDescription>
        </DialogHeader>

        {status === 'importing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Spinner className="size-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              Importing workspace...
            </p>
          </div>
        )}

        {status === 'success' && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="size-4 text-green-500" />
            <AlertTitle className="text-green-500">
              Import Successful
            </AlertTitle>
            <AlertDescription>
              Your Postman collection has been imported successfully.
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Import Failed</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : 'Failed to import collection. Please check your JSON format.'}
            </AlertDescription>
          </Alert>
        )}

        {status === 'idle' && (
          <>
            <div
              ref={dropzoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFilePick}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              {fileName ? (
                <>
                  <FileJson className="size-10 text-[#ff6c37]" />
                  <div className="text-center">
                    <p className="text-sm font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      Click to choose a different file
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="size-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drop your Postman collection here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse for a file
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or paste JSON
                </span>
              </div>
            </div>

            <Textarea
              placeholder="Paste your Postman collection JSON here..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (e.target.value !== content) {
                  setFileName(null);
                }
              }}
              onPaste={handlePaste}
              className="min-h-[120px] font-mono text-xs"
            />
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {status === 'idle' && (
            <>
              {hasContent && (
                <Button variant="outline" onClick={handleReset}>
                  Clear
                </Button>
              )}
              <Button onClick={handleImport} disabled={!hasContent}>
                Import
              </Button>
            </>
          )}
          {status === 'error' && (
            <Button variant="outline" onClick={handleReset}>
              Import Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
