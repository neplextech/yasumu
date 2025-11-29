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
