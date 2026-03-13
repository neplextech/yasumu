import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@yasumu/ui/components/dialog';
import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { Label } from '@yasumu/ui/components/label';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { useGraphqlIntrospection } from '../../_hooks/use-graphql-introspection';
import { Wand2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  isObjectType,
  isLeafType,
  GraphQLField,
  isListType,
  isNonNullType,
  GraphQLType,
} from 'graphql';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@yasumu/ui/components/alert';

interface GeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: { id: string; name: string; parentId?: string | null }[];
  onGenerate: (
    url: string,
    targetFolderId: string | null,
    operations: {
      name: string;
      content: string;
      operationName: string;
      type: 'query' | 'mutation' | 'subscription';
    }[],
  ) => Promise<void>;
}

export function GeneratorDialog({
  open,
  onOpenChange,
  folders,
  onGenerate,
}: GeneratorDialogProps) {
  const [url, setUrl] = useState('');
  const [targetFolderId, setTargetFolderId] = useState<string>('root');
  const {
    introspect,
    isLoading,
    error: introspectionError,
    schema,
  } = useGraphqlIntrospection();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [includeQueries, setIncludeQueries] = useState(true);
  const [includeMutations, setIncludeMutations] = useState(true);
  const [includeSubscriptions, setIncludeSubscriptions] = useState(true);

  const handleIntrospect = async () => {
    if (!url) return;
    await introspect(url);
  };

  const handleGenerate = async () => {
    if (!schema) return;
    setIsGenerating(true);
    try {
      const operations: {
        name: string;
        content: string;
        operationName: string;
        type: 'query' | 'mutation' | 'subscription';
      }[] = [];

      const processType = (
        type: any,
        operationType: 'query' | 'mutation' | 'subscription',
      ) => {
        if (!type) return;
        const fields = type.getFields();
        Object.values(fields).forEach((field: any) => {
          const query = generateOperation(field, operationType);
          operations.push({
            name: field.name,
            content: query,
            type: operationType,
            operationName: field.name,
          });
        });
      };

      processType(schema.getQueryType(), 'query');
      processType(schema.getMutationType(), 'mutation');
      processType(schema.getSubscriptionType(), 'subscription');

      const filtered = operations.filter((op) => {
        if (op.type === 'query') return includeQueries;
        if (op.type === 'mutation') return includeMutations;
        if (op.type === 'subscription') return includeSubscriptions;
        return true;
      });

      await onGenerate(
        url,
        targetFolderId === 'root' ? null : targetFolderId,
        filtered,
      );
      setGeneratedCount(filtered.length);
      setTimeout(() => {
        onOpenChange(false);
        setGeneratedCount(null);
        setUrl('');
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const folderOptions = useMemo(() => {
    // Flatten folders with some indentation or path indication could be nice,
    // but for now simple list is okay as per requirement "select desired folder".
    // We might want to show path if possible, but flat list is start.
    return folders;
  }, [folders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            GraphQL Importer
          </DialogTitle>
          <DialogDescription>
            Automatically import entities from the given GraphQL URL.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">GraphQL Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/graphql"
                disabled={isLoading || isGenerating}
              />
              <Button
                onClick={handleIntrospect}
                disabled={!url || isLoading || isGenerating}
                variant="secondary"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Fetch'
                )}
              </Button>
            </div>
            {introspectionError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{introspectionError}</AlertDescription>
              </Alert>
            )}
            {schema && !introspectionError && (
              <Alert className="border-green-500 text-green-600">
                <CheckCircle2 className="h-4 w-4 stroke-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Schema loaded! Found{' '}
                  {Object.keys(schema.getQueryType()?.getFields() || {}).length}{' '}
                  queries,{' '}
                  {
                    Object.keys(schema.getMutationType()?.getFields() || {})
                      .length
                  }{' '}
                  mutations.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="folder">Destination Folder</Label>
            <Select
              value={targetFolderId}
              onValueChange={setTargetFolderId}
              disabled={isLoading || isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {folderOptions.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {schema && !introspectionError && (
            <div className="grid gap-3">
              <Label>Operation Types to Generate</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeQueries}
                    onCheckedChange={(v) => setIncludeQueries(!!v)}
                    disabled={isGenerating}
                  />
                  Queries
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeMutations}
                    onCheckedChange={(v) => setIncludeMutations(!!v)}
                    disabled={isGenerating}
                  />
                  Mutations
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeSubscriptions}
                    onCheckedChange={(v) => setIncludeSubscriptions(!!v)}
                    disabled={isGenerating}
                  />
                  Subscriptions
                </label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {generatedCount !== null ? (
            <div className="flex items-center text-green-600 gap-2 mr-auto font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Generated {generatedCount} requests!
            </div>
          ) : null}
          <Button onClick={handleGenerate} disabled={!schema || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Requests'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateOperation(
  field: GraphQLField<any, any>,
  operationType: 'query' | 'mutation' | 'subscription',
): string {
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const operationName = capitalize(field.name);

  const args =
    field.args.length > 0
      ? `(${field.args.map((arg) => `${arg.name}: $${arg.name}`).join(', ')})`
      : '';

  const varDefs =
    field.args.length > 0
      ? `(${field.args
          .map((arg) => `$${arg.name}: ${arg.type.toString()}`)
          .join(', ')})`
      : '';

  const returnType = getNamedType(field.type);
  let selectionSet = '';

  if (isObjectType(returnType)) {
    const subFields = Object.values(returnType.getFields());
    const scalarFields = subFields.filter((f) =>
      isLeafType(getNamedType(f.type)),
    );

    if (scalarFields.length > 0) {
      selectionSet = ` {
    ${scalarFields
      .slice(0, 5)
      .map((f) => f.name)
      .join('\n    ')}
  }`;
    } else if (subFields.length > 0) {
      selectionSet = ` {
    ${subFields[0].name}
  }`;
    }
  }

  return `${operationType} ${operationName}${varDefs} {
  ${field.name}${args}${selectionSet}
}`;
}

function getNamedType(type: GraphQLType): GraphQLType {
  let current = type;
  while (isNonNullType(current) || isListType(current)) {
    current = current.ofType;
  }
  return current;
}
