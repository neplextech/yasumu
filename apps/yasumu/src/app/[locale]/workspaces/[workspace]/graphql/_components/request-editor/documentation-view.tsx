import { useState, useMemo } from 'react';
import {
  GraphQLSchema,
  GraphQLNamedType,
  isObjectType,
  isInputObjectType,
  isEnumType,
  isScalarType,
  isInterfaceType,
  isUnionType,
  GraphQLFieldMap,
  GraphQLInputFieldMap,
  GraphQLArgument,
  GraphQLField,
  isListType,
  isNonNullType,
  GraphQLType,
} from 'graphql';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Input } from '@yasumu/ui/components/input';
import { Button } from '@yasumu/ui/components/button';
import { ChevronRight, Search, Box, Type, List, Boxes } from 'lucide-react';
import { cn } from '@yasumu/ui/lib/utils';
import { Badge } from '@yasumu/ui/components/badge';

interface DocumentationViewProps {
  schema: GraphQLSchema | null;
}

type TypeCategory =
  | 'root'
  | 'objects'
  | 'inputs'
  | 'enums'
  | 'scalars'
  | 'interfaces'
  | 'unions';

export function DocumentationView({ schema }: DocumentationViewProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const typeMap = useMemo(() => {
    if (!schema) return {};
    return schema.getTypeMap();
  }, [schema]);

  const organizedTypes = useMemo<
    Record<TypeCategory, GraphQLNamedType[]>
  >(() => {
    const defaultState: Record<TypeCategory, GraphQLNamedType[]> = {
      root: [],
      objects: [],
      inputs: [],
      enums: [],
      scalars: [],
      interfaces: [],
      unions: [],
    };

    if (!schema) return defaultState;
    const types = schema.getTypeMap();
    const result = { ...defaultState };

    const rootTypes = [
      schema.getQueryType(),
      schema.getMutationType(),
      schema.getSubscriptionType(),
    ].filter(Boolean) as GraphQLNamedType[];

    const rootTypeNames = new Set(rootTypes.map((t) => t.name));
    result.root = rootTypes;

    Object.values(types).forEach((type) => {
      if (type.name.startsWith('__') || rootTypeNames.has(type.name)) return;

      if (isObjectType(type)) result.objects.push(type);
      else if (isInputObjectType(type)) result.inputs.push(type);
      else if (isEnumType(type)) result.enums.push(type);
      else if (isScalarType(type)) result.scalars.push(type);
      else if (isInterfaceType(type)) result.interfaces.push(type);
      else if (isUnionType(type)) result.unions.push(type);
    });

    // Sort by name
    (Object.keys(result) as (keyof typeof result)[]).forEach((key) => {
      result[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return result;
  }, [schema]);

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return organizedTypes;
    const lowerQuery = searchQuery.toLowerCase();
    const result = { ...organizedTypes };

    (Object.keys(result) as TypeCategory[]).forEach((key) => {
      result[key] = organizedTypes[key].filter((t) =>
        t.name.toLowerCase().includes(lowerQuery),
      );
    });

    return result;
  }, [organizedTypes, searchQuery]);

  const handleTypeClick = (typeName: string) => {
    setSelectedType(typeName);
  };

  const renderTypeLink = (type: GraphQLType) => {
    const namedType = getNamedType(type);
    return (
      <button
        onClick={() => handleTypeClick(namedType.name)}
        className="text-primary hover:underline font-mono text-xs cursor-pointer"
      >
        {String(type)}
      </button>
    );
  };

  if (!schema) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No schema available. Introspect a URL to view documentation.
      </div>
    );
  }

  const selectedTypeObj = selectedType ? typeMap[selectedType] : null;

  const isRootQuery =
    schema &&
    selectedTypeObj &&
    schema?.getQueryType()?.name === selectedTypeObj.name;
  const isRootMutation =
    schema &&
    selectedTypeObj &&
    schema?.getMutationType()?.name === selectedTypeObj.name;
  const isRootSubscription =
    schema &&
    selectedTypeObj &&
    schema?.getSubscriptionType()?.name === selectedTypeObj.name;

  let typeBadgeLabel = selectedTypeObj
    ? selectedTypeObj.constructor.name
        .replace('GraphQL', '')
        .replace('Type', '')
    : '';

  if (isRootQuery) typeBadgeLabel = 'Query';
  if (isRootMutation) typeBadgeLabel = 'Mutation';
  if (isRootSubscription) typeBadgeLabel = 'Subscription';

  return (
    <div className="flex h-full border rounded-md overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-muted/10 flex flex-col min-w-[250px] overflow-y-auto">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {(
              Object.entries(filteredTypes) as [
                TypeCategory,
                GraphQLNamedType[],
              ][]
            ).map(([category, types]) => {
              if (types.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    {category}
                  </h3>
                  <div className="space-y-0.5">
                    {types.map((type) => (
                      <Button
                        key={type.name}
                        variant={
                          selectedType === type.name ? 'secondary' : 'ghost'
                        }
                        size="sm"
                        className="w-full justify-start h-7 text-sm font-normal"
                        onClick={() => handleTypeClick(type.name)}
                      >
                        <TypeIcon
                          type={type}
                          className="mr-2 h-3.5 w-3.5 opacity-70"
                        />
                        <span className="truncate">{type.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {selectedTypeObj ? (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {typeBadgeLabel}
                  </Badge>
                  <h1 className="text-2xl font-bold font-mono text-primary">
                    {selectedTypeObj.name}
                  </h1>
                </div>
                {selectedTypeObj.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedTypeObj.description}
                  </p>
                )}
              </div>

              {/* Fields for Object/Interface Types */}
              {(isObjectType(selectedTypeObj) ||
                isInterfaceType(selectedTypeObj)) && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <Boxes className="h-4 w-4" /> Fields
                  </h2>
                  <div className="space-y-4">
                    {Object.values(selectedTypeObj.getFields()).map((field) => (
                      <div key={field.name} className="group">
                        <div className="flex flex-wrap items-baseline gap-0 font-mono text-sm">
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {field.name}
                          </span>
                          {field.args.length > 0 && (
                            <span className="text-muted-foreground">
                              (
                              {field.args.map((arg, i) => (
                                <span key={arg.name}>
                                  {i > 0 && ', '}
                                  <span className="text-orange-600 dark:text-orange-400">
                                    {arg.name}
                                  </span>
                                  : {renderTypeLink(arg.type)}
                                </span>
                              ))}
                              )
                            </span>
                          )}
                          <span className="text-muted-foreground mr-2">:</span>
                          {renderTypeLink(field.type)}
                          {field.deprecationReason && (
                            <Badge
                              variant="destructive"
                              className="ml-2 text-[10px] h-4"
                            >
                              Deprecated
                            </Badge>
                          )}
                        </div>
                        {field.description && (
                          <p className="text-sm text-muted-foreground mt-1 ml-4 pl-2 border-l-2 border-muted">
                            {field.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Fields */}
              {isInputObjectType(selectedTypeObj) && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <List className="h-4 w-4" /> Input Fields
                  </h2>
                  <div className="space-y-4">
                    {Object.values(selectedTypeObj.getFields()).map((field) => (
                      <div key={field.name}>
                        <div className="flex items-baseline gap-2 font-mono text-sm">
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {field.name}
                          </span>
                          <span className="text-muted-foreground">:</span>
                          {renderTypeLink(field.type)}
                        </div>
                        {field.description && (
                          <p className="text-sm text-muted-foreground mt-1 ml-4 pl-2 border-l-2 border-muted">
                            {field.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enum Values */}
              {isEnumType(selectedTypeObj) && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <List className="h-4 w-4" /> Values
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTypeObj.getValues().map((value) => (
                      <div
                        key={value.name}
                        className="p-2 rounded border bg-muted/30"
                      >
                        <div className="font-mono text-sm font-bold">
                          {value.name}
                        </div>
                        {value.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {value.description}
                          </div>
                        )}
                        {value.deprecationReason && (
                          <Badge
                            variant="destructive"
                            className="mt-1 text-[10px]"
                          >
                            Deprecated
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Union Types */}
              {isUnionType(selectedTypeObj) && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <Boxes className="h-4 w-4" /> Possible Types
                  </h2>
                  <div className="flex flex-col gap-2">
                    {selectedTypeObj.getTypes().map((type, i) => (
                      <div key={type.name} className="flex items-center gap-2">
                        <div className="flex flex-col items-start">
                          <div className="font-mono text-xs font-bold text-primary/80">
                            {renderTypeLink(type)}
                          </div>
                          {type.description && (
                            <span className="text-muted-foreground text-sm">
                              {type.description}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="max-w-md mx-auto my-auto text-center space-y-4 text-muted-foreground p-8">
            <Box className="w-12 h-12 mx-auto opacity-20" />
            <h3 className="text-lg font-medium">No Type Selected</h3>
            <p className="text-sm">
              Select a type from the sidebar to view its documentation, fields,
              and description.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getNamedType(type: GraphQLType): GraphQLNamedType {
  if (isNonNullType(type) || isListType(type)) {
    return getNamedType(type.ofType);
  }
  return type;
}

function TypeIcon({
  type,
  className,
}: {
  type: GraphQLNamedType;
  className?: string;
}) {
  if (isObjectType(type)) return <Boxes className={className} />;
  if (isInputObjectType(type)) return <List className={className} />;
  if (isEnumType(type)) return <List className={className} />;
  if (isScalarType(type)) return <Type className={className} />;
  if (isInterfaceType(type)) return <Boxes className={className} />; // TODO: Interface icon
  if (isUnionType(type)) return <Boxes className={className} />; // TODO: Union icon
  return <Box className={className} />;
}
