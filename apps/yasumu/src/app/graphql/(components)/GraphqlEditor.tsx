'use client';

import { YasumuLayout } from '@/lib/constants/layout';
import { cn } from '@/lib/utils';
import { useLayout } from '@/stores/AppLayout';
import { useEffect, useRef } from 'react';
import { graphql, updateSchema } from 'cm6-graphql';
import { useTextEditor } from '@/hooks/use-text-editor';
import { setGraphqlDocument, useGraphqlDocument, useGraphqlSchema } from '@/stores/GraphqlSchemaStore';
import { buildClientSchema } from 'graphql';

export function GraphqlEditor() {
  const layout = useLayout();
  const editor = useRef<HTMLDivElement>(null);
  const schema = useGraphqlSchema();
  const doc = useGraphqlDocument();
  const { view } = useTextEditor(editor, { extensions: [graphql()], code: doc, setCode: setGraphqlDocument });

  useEffect(() => {
    if (!view) return;

    try {
      updateSchema(view, schema ? buildClientSchema(schema, { assumeValid: true }) : undefined);
    } catch (e) {
      console.error(e);
    }
  }, [view, schema]);

  return (
    <div
      ref={editor}
      className={cn('resize-none font-mono text-xs', {
        'h-full': layout === YasumuLayout.Default,
        'h-1/2': layout === YasumuLayout.Classic,
      })}
    />
  );
}
