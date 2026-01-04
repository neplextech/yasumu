import { HttpMethod } from '@yasumu/core';

const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500',
  POST: 'text-blue-500',
  PUT: 'text-yellow-500',
  DELETE: 'text-red-500',
  PATCH: 'text-pink-500',
  OPTIONS: 'text-purple-500',
  HEAD: 'text-teal-500',
};

export function HttpMethodIcon({
  method,
  short,
}: {
  method: HttpMethod | (string & {});
  short?: boolean;
}) {
  const methodName = method.toUpperCase();
  const colorClass = HTTP_METHOD_COLORS[methodName] ?? 'text-muted-foreground';

  let displayName = methodName;
  if (short) {
    if (methodName === 'DELETE') displayName = 'DEL';
    else if (methodName === 'OPTIONS') displayName = 'OPT';
    else if (methodName.length > 4) displayName = methodName.slice(0, 4);
  }

  return (
    <span className={`font-mono font-bold ${colorClass}`}>{displayName}</span>
  );
}

export function GetMethodIcon({ short }: { short?: boolean }) {
  return <HttpMethodIcon method="GET" short={short} />;
}

export function PostMethodIcon({ short }: { short?: boolean }) {
  return <HttpMethodIcon method="POST" short={short} />;
}

export function PatchMethodIcon({ short }: { short?: boolean }) {
  return <HttpMethodIcon method="PATCH" short={short} />;
}

export function PutMethodIcon({ short }: { short?: boolean }) {
  return <HttpMethodIcon method="PUT" short={short} />;
}

export function DeleteMethodIcon({ short }: { short?: boolean }) {
  return <HttpMethodIcon method="DELETE" short={short} />;
}

export function OptionsMethodIcon({ short }: { short?: boolean }) {
  return <HttpMethodIcon method="OPTIONS" short={short} />;
}

export function HeadMethodIcon({ short }: { short?: boolean }) {
  return <HttpMethodIcon method="HEAD" short={short} />;
}

export function resolveHttpMethodIcon(
  method: HttpMethod | (string & {}),
  { short }: { short?: boolean },
) {
  return () => <HttpMethodIcon method={method} short={short} />;
}
