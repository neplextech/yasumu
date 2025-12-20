'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { cn } from '@yasumu/ui/lib/utils';

export const HttpMethods = [
  { name: 'GET', color: 'text-green-500' },
  { name: 'POST', color: 'text-blue-500' },
  { name: 'PUT', color: 'text-yellow-500' },
  { name: 'DELETE', color: 'text-red-500' },
  { name: 'PATCH', color: 'text-pink-500' },
  { name: 'OPTIONS', color: 'text-purple-500' },
  { name: 'HEAD', color: 'text-teal-500' },
];

export interface HttpMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HttpMethodSelector({
  value,
  onChange,
}: HttpMethodSelectorProps) {
  const currentMethod = HttpMethods.find((m) => m.name === value);

  return (
    <Select
      value={value}
      onValueChange={(value) => {
        onChange(value);
      }}
    >
      <SelectTrigger
        className={cn('w-[180px] font-mono font-bold', currentMethod?.color)}
      >
        <SelectValue placeholder="Method" />
      </SelectTrigger>
      <SelectContent>
        {HttpMethods.map((method, index) => (
          <SelectItem
            key={index}
            value={method.name}
            className={cn('font-bold font-mono', method.color)}
          >
            {method.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
