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
  isListType,
  isNonNullType,
  GraphQLType,
} from 'graphql';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Input } from '@yasumu/ui/components/input';
import { Button } from '@yasumu/ui/components/button';
import { Search, Box, Type, List, Boxes, BookOpen } from 'lucide-react';
import { Badge } from '@yasumu/ui/components/badge';
import { trackEvent } from '@/lib/instrumentation/analytics';

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

interface SearchMatch {
  kind: 'type' | 'field' | 'argument' | 'description';
  label: string;
}

function formatCategoryLabel(category: TypeCategory): string {
  if (category === 'root') return 'Root';
  return category;
}

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

  const searchMatches = useMemo(() => {
    const matches = new Map<string, SearchMatch[]>();
    const lowerQuery = searchQuery.trim().toLowerCase();
    if (!schema || !lowerQuery) return matches;

    const addMatch = (typeName: string, match: SearchMatch) => {
      const existing = matches.get(typeName) ?? [];
      if (
        !existing.some(
          (item) => item.kind === match.kind && item.label === match.label,
        )
      ) {
        existing.push(match);
      }
      matches.set(typeName, existing);
    };

    const inspectType = (type: GraphQLNamedType) => {
      if (type.name.toLowerCase().includes(lowerQuery)) {
        addMatch(type.name, { kind: 'type', label: type.name });
      }

      if (type.description?.toLowerCase().includes(lowerQuery)) {
        addMatch(type.name, { kind: 'description', label: 'Description' });
      }

      if (isObjectType(type) || isInterfaceType(type)) {
        for (const field of Object.values(type.getFields())) {
          const fieldText = [
            field.name,
            field.description,
            String(field.type),
            ...field.args.flatMap((arg) => [
              arg.name,
              arg.description,
              String(arg.type),
            ]),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (fieldText.includes(lowerQuery)) {
            addMatch(type.name, { kind: 'field', label: field.name });
          }

          for (const arg of field.args) {
            if (
              [arg.name, arg.description, String(arg.type)]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(lowerQuery)
            ) {
              addMatch(type.name, {
                kind: 'argument',
                label: `${field.name}.${arg.name}`,
              });
            }
          }
        }
      }

      if (isInputObjectType(type)) {
        for (const field of Object.values(type.getFields())) {
          if (
            [field.name, field.description, String(field.type)]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(lowerQuery)
          ) {
            addMatch(type.name, { kind: 'field', label: field.name });
          }
        }
      }

      if (isEnumType(type)) {
        for (const value of type.getValues()) {
          if (
            [value.name, value.description]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(lowerQuery)
          ) {
            addMatch(type.name, { kind: 'field', label: value.name });
          }
        }
      }
    };

    for (const types of Object.values(organizedTypes)) {
      for (const type of types) inspectType(type);
    }

    return matches;
  }, [organizedTypes, schema, searchQuery]);

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return organizedTypes;
    const lowerQuery = searchQuery.toLowerCase();
    const result = { ...organizedTypes };

    (Object.keys(result) as TypeCategory[]).forEach((key) => {
      result[key] = organizedTypes[key].filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          searchMatches.has(t.name),
      );
    });

    return result;
  }, [organizedTypes, searchMatches, searchQuery]);

  const totalVisibleTypes = useMemo(
    () =>
      Object.values(filteredTypes).reduce(
        (count, types) => count + types.length,
        0,
      ),
    [filteredTypes],
  );

  const handleTypeClick = (typeName: string) => {
    setSelectedType(typeName);
    const matchCount = searchMatches.get(typeName)?.length ?? 0;
    trackEvent('graphql_docs_type_selected', {
      type_name: typeName,
      has_search: searchQuery.trim().length > 0,
      match_count: matchCount,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      trackEvent('graphql_docs_searched', {
        query_length: value.trim().length,
      });
    }
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
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto grid size-12 place-items-center rounded-md border bg-muted/30">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No schema loaded</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Introspect the current endpoint to explore types, fields,
              arguments, enum values, interfaces, and unions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const defaultType = schema.getQueryType() ?? organizedTypes.root[0] ?? null;
  const selectedTypeObj = selectedType ? typeMap[selectedType] : defaultType;

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
    <div className="flex h-full border rounded-md overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-muted/10 flex flex-col min-w-[250px] overflow-y-auto">
        <div className="p-3 border-b space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium">Schema</div>
              <div className="text-xs text-muted-foreground">
                {totalVisibleTypes} visible types
              </div>
            </div>
            <Badge variant="outline" className="rounded-sm font-mono">
              {
                Object.keys(typeMap).filter((name) => !name.startsWith('__'))
                  .length
              }
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search types, queries, mutations..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {totalVisibleTypes === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                No types match this search.
              </div>
            )}
            {(
              Object.entries(filteredTypes) as [
                TypeCategory,
                GraphQLNamedType[],
              ][]
            ).map(([category, types]) => {
              if (types.length === 0) return null;
              return (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between px-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {formatCategoryLabel(category)}
                    </h3>
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {types.length}
                    </span>
                  </div>
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
                        {searchMatches.has(type.name) && (
                          <Badge
                            variant="outline"
                            className="ml-auto h-5 rounded-sm px-1.5 text-[10px]"
                          >
                            {searchMatches.get(type.name)?.length}
                          </Badge>
                        )}
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
              <div className="space-y-3 rounded-md border bg-muted/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {typeBadgeLabel}
                  </Badge>
                  <h1 className="text-xl font-semibold font-mono text-primary">
                    {selectedTypeObj.name}
                  </h1>
                </div>
                {selectedTypeObj.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedTypeObj.description}
                  </p>
                )}
                {searchMatches.has(selectedTypeObj.name) && (
                  <div className="flex flex-wrap gap-1.5">
                    {searchMatches.get(selectedTypeObj.name)?.map((match) => (
                      <Badge
                        key={`${match.kind}:${match.label}`}
                        variant="secondary"
                        className="rounded-sm font-mono text-[10px]"
                      >
                        {match.kind}: {match.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Fields for Object/Interface Types */}
              {(isObjectType(selectedTypeObj) ||
                isInterfaceType(selectedTypeObj)) && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <Boxes className="h-4 w-4" /> Fields
                    <Badge variant="secondary" className="ml-auto rounded-sm">
                      {Object.keys(selectedTypeObj.getFields()).length}
                    </Badge>
                  </h2>
                  <div className="space-y-2">
                    {Object.values(selectedTypeObj.getFields()).map((field) => {
                      const isMatched = searchMatches
                        .get(selectedTypeObj.name)
                        ?.some((match) => match.label.startsWith(field.name));

                      return (
                        <div
                          key={field.name}
                          className="group rounded-md border bg-card/40 p-3 data-[matched=true]:border-primary/50 data-[matched=true]:bg-primary/5"
                          data-matched={isMatched}
                        >
                          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 font-mono text-sm">
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
                            <span className="text-muted-foreground mr-2">
                              :
                            </span>
                            {renderTypeLink(field.type)}
                            {field.args.length > 0 && (
                              <Badge
                                variant="outline"
                                className="ml-2 h-5 rounded-sm text-[10px]"
                              >
                                {field.args.length} args
                              </Badge>
                            )}
                            {isMatched && (
                              <Badge
                                variant="secondary"
                                className="ml-2 h-5 rounded-sm text-[10px]"
                              >
                                Match
                              </Badge>
                            )}
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
                            <p className="text-sm text-muted-foreground mt-2 leading-5">
                              {field.description}
                            </p>
                          )}
                          {field.args.length > 0 && (
                            <div className="mt-3 space-y-1 border-t pt-2">
                              {field.args.map((arg) => (
                                <div
                                  key={arg.name}
                                  className="flex flex-wrap items-center gap-1.5 text-xs"
                                >
                                  <span className="font-mono text-orange-600 dark:text-orange-400">
                                    {arg.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    :
                                  </span>
                                  {renderTypeLink(arg.type)}
                                  {arg.description && (
                                    <span className="text-muted-foreground">
                                      {arg.description}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
