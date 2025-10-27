'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { cn } from '@yasumu/ui/lib/utils';
import React, { useState } from 'react';

export const HttpMethods = [
  { name: 'GET', color: 'text-green-500' },
  { name: 'POST', color: 'text-blue-500' },
  { name: 'PUT', color: 'text-yellow-500' },
  { name: 'DELETE', color: 'text-red-500' },
  { name: 'PATCH', color: 'text-pink-500' },
  { name: 'OPTIONS', color: 'text-purple-500' },
  { name: 'HEAD', color: 'text-teal-500' },
];

export default function HttpMethodSelector() {
  const [method, setMethod] = useState<string>(HttpMethods[0]!.name);
  const currentMethod = HttpMethods.find((m) => m.name === method);

  return (
    <Select
      value={method}
      onValueChange={(value) => {
        setMethod(value);
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
