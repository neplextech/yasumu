'use client';

interface CookiesViewProps {
  cookies: string[];
}

export function CookiesView({ cookies }: CookiesViewProps) {
  if (cookies.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No cookies received</p>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {cookies.map((cookie, i) => (
        <pre
          key={i}
          className="text-sm font-mono bg-muted/50 p-2 rounded break-all whitespace-pre-wrap"
        >
          {cookie}
        </pre>
      ))}
    </div>
  );
}
