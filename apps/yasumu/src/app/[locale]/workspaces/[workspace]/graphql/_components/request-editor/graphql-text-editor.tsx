'use client';
import { TextEditor } from '@/components/editors';

export default function GraphqlTextEditor({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <TextEditor
      value={query}
      onChange={onQueryChange}
      language="graphql"
      placeholder={
        <div className="text-sm text-muted-foreground font-medium opacity-40 ml-2">
          <pre className="font-mono text-sm whitespace-pre-wrap">{`query GetUsers {
      users {
        id
        name
        email
      }
    }`}</pre>
        </div>
      }
    />
  );
}
