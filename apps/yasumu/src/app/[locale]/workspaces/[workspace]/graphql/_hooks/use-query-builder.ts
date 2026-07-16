'use client';

import {
  type GraphQLSchema,
  type GraphQLField,
  type GraphQLObjectType,
  type GraphQLArgument,
  type GraphQLType,
  type GraphQLNamedType,
  isObjectType,
  isListType,
  isNonNullType,
} from 'graphql';
import { useCallback, useMemo, useState, useEffect } from 'react';

export interface FieldNode {
  name: string;
  type: string;
  description: string | null;
  args: ArgNode[];
  fields: FieldNode[];
  selected: boolean;
  expanded: boolean;
  argValues: Record<string, string>;
}

export interface ArgNode {
  name: string;
  type: string;
  description: string | null;
  defaultValue: unknown;
  required: boolean;
}

export interface RootOperation {
  name: string;
  type: 'query' | 'mutation' | 'subscription';
  fields: FieldNode[];
}

function unwrapType(type: GraphQLType): GraphQLNamedType {
  if (isNonNullType(type)) return unwrapType(type.ofType);
  if (isListType(type)) return unwrapType(type.ofType);
  return type;
}

function getTypeString(type: GraphQLType): string {
  if (isNonNullType(type)) return `${getTypeString(type.ofType)}!`;
  if (isListType(type)) return `[${getTypeString(type.ofType)}]`;
  return type.toString();
}

function buildArgNode(arg: GraphQLArgument): ArgNode {
  return {
    name: arg.name,
    type: getTypeString(arg.type),
    description: arg.description ?? null,
    defaultValue: arg.defaultValue,
    required: isNonNullType(arg.type),
  };
}

function buildFieldNode(field: GraphQLField<unknown, unknown>, depth: number = 0): FieldNode {
  const unwrapped = unwrapType(field.type);
  const subFields: FieldNode[] = [];

  if (depth < 3 && isObjectType(unwrapped)) {
    const fieldMap = unwrapped.getFields();
    for (const subFieldName of Object.keys(fieldMap)) {
      subFields.push(buildFieldNode(fieldMap[subFieldName], depth + 1));
    }
  }

  return {
    name: field.name,
    type: getTypeString(field.type),
    description: field.description ?? null,
    args: field.args.map(buildArgNode),
    fields: subFields,
    selected: false,
    expanded: false,
    argValues: {},
  };
}

function buildRootOperation(
  objectType: GraphQLObjectType | null | undefined,
  operationType: 'query' | 'mutation' | 'subscription',
): RootOperation | null {
  if (!objectType) return null;

  const fieldMap = objectType.getFields();
  const fields = Object.keys(fieldMap).map((name) => buildFieldNode(fieldMap[name]));

  return {
    name: objectType.name,
    type: operationType,
    fields,
  };
}

function generateQueryFromFields(fields: FieldNode[], indent: string = '  '): string {
  const lines: string[] = [];

  for (const field of fields) {
    if (!field.selected) continue;

    const argParts: string[] = [];
    for (const arg of field.args) {
      const value = field.argValues[arg.name];
      if (value !== undefined && value !== '') {
        argParts.push(`${arg.name}: ${value}`);
      }
    }

    const argStr = argParts.length > 0 ? `(${argParts.join(', ')})` : '';

    const selectedChildren = field.fields.filter((f) => f.selected);
    if (selectedChildren.length > 0) {
      lines.push(`${indent}${field.name}${argStr} {`);
      lines.push(generateQueryFromFields(field.fields, indent + '  '));
      lines.push(`${indent}}`);
    } else {
      lines.push(`${indent}${field.name}${argStr}`);
    }
  }

  return lines.join('\n');
}

export function useQueryBuilder(schema: GraphQLSchema | null) {
  const [operations, setOperations] = useState<RootOperation[]>([]);
  const [activeOperation, setActiveOperation] = useState<'query' | 'mutation' | 'subscription'>('query');

  useEffect(() => {
    if (!schema) {
      setOperations([]);
      return;
    }

    const ops: RootOperation[] = [];
    const queryOp = buildRootOperation(schema.getQueryType(), 'query');
    if (queryOp) ops.push(queryOp);
    const mutationOp = buildRootOperation(schema.getMutationType(), 'mutation');
    if (mutationOp) ops.push(mutationOp);
    const subscriptionOp = buildRootOperation(schema.getSubscriptionType(), 'subscription');
    if (subscriptionOp) ops.push(subscriptionOp);

    setOperations(ops);
    setActiveOperation((current) =>
      ops.some((operation) => operation.type === current) ? current : (ops[0]?.type ?? 'query'),
    );
  }, [schema]);

  const currentOperation = useMemo(
    () => operations.find((o) => o.type === activeOperation) ?? null,
    [operations, activeOperation],
  );

  const toggleField = useCallback(
    (path: number[]) => {
      setOperations((prev) =>
        prev.map((op) => {
          if (op.type !== activeOperation) return op;
          return {
            ...op,
            fields: updateFieldAtPath(op.fields, path, (field) => ({
              ...field,
              selected: !field.selected,
            })),
          };
        }),
      );
    },
    [activeOperation],
  );

  const toggleExpand = useCallback(
    (path: number[]) => {
      setOperations((prev) =>
        prev.map((op) => {
          if (op.type !== activeOperation) return op;
          return {
            ...op,
            fields: updateFieldAtPath(op.fields, path, (field) => ({
              ...field,
              expanded: !field.expanded,
            })),
          };
        }),
      );
    },
    [activeOperation],
  );

  const setArgValue = useCallback(
    (path: number[], argName: string, value: string) => {
      setOperations((prev) =>
        prev.map((op) => {
          if (op.type !== activeOperation) return op;
          return {
            ...op,
            fields: updateFieldAtPath(op.fields, path, (field) => ({
              ...field,
              argValues: { ...field.argValues, [argName]: value },
            })),
          };
        }),
      );
    },
    [activeOperation],
  );

  const generatedQuery = useMemo(() => {
    if (!currentOperation) return '';
    const selectedFields = currentOperation.fields.filter((f) => f.selected);
    if (selectedFields.length === 0) return '';

    const body = generateQueryFromFields(currentOperation.fields);
    if (!body.trim()) return '';

    return `${activeOperation} {\n${body}\n}`;
  }, [currentOperation, activeOperation]);

  return {
    operations,
    activeOperation,
    setActiveOperation,
    currentOperation,
    toggleField,
    toggleExpand,
    setArgValue,
    generatedQuery,
  };
}

function updateFieldAtPath(
  fields: FieldNode[],
  path: number[],
  update: (field: FieldNode) => FieldNode,
  depth = 0,
): FieldNode[] {
  const index = path[depth];
  if (index === undefined || index < 0 || index >= fields.length) return fields;

  const current = fields[index];
  let next: FieldNode;
  if (depth === path.length - 1) {
    next = update(current);
  } else {
    const nextFields = updateFieldAtPath(current.fields, path, update, depth + 1);
    next = nextFields === current.fields ? current : { ...current, fields: nextFields };
  }

  if (next === current) return fields;
  const result = [...fields];
  result[index] = next;
  return result;
}
