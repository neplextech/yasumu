import { HttpMethod } from '@yasumu/core';

export function GetMethodIcon({ short }: { short?: boolean }) {
  return <span className="font-mono font-bold text-green-500">GET</span>;
}

export function PostMethodIcon({ short }: { short?: boolean }) {
  return <span className="font-mono font-bold text-blue-500">POST</span>;
}

export function PatchMethodIcon({ short }: { short?: boolean }) {
  return <span className="font-mono font-bold text-yellow-500">PATCH</span>;
}

export function PutMethodIcon({ short }: { short?: boolean }) {
  return <span className="font-mono font-bold text-pink-500">PUT</span>;
}

export function DeleteMethodIcon({ short }: { short?: boolean }) {
  return (
    <span className="font-mono font-bold text-red-500">
      {short ? 'DEL' : 'DELETE'}
    </span>
  );
}

export function OptionsMethodIcon({ short }: { short?: boolean }) {
  return (
    <span className="font-mono font-bold text-purple-500">
      {short ? 'OPT' : 'OPTIONS'}
    </span>
  );
}

export function HeadMethodIcon({ short }: { short?: boolean }) {
  return <span className="font-mono font-bold text-gray-500">HEAD</span>;
}

export function HttpMethodIcon({
  method,
}: {
  method: HttpMethod | (string & {});
}) {
  switch (method) {
    case 'GET':
      return <GetMethodIcon />;
    case 'POST':
      return <PostMethodIcon />;
    case 'PUT':
      return <PutMethodIcon />;
    case 'DELETE':
      return <DeleteMethodIcon />;
    case 'PATCH':
      return <PatchMethodIcon />;
    case 'OPTIONS':
      return <OptionsMethodIcon />;
    case 'HEAD':
      return <HeadMethodIcon />;
    default:
      const methodName = method.toUpperCase();
      return (
        <span className="font-mono font-bold text-gray-500">
          {methodName.length > 4 ? methodName.slice(0, 4) : methodName}
        </span>
      );
  }
}

export function resolveHttpMethodIcon(method: HttpMethod | (string & {})) {
  return () => <HttpMethodIcon method={method} />;
}
