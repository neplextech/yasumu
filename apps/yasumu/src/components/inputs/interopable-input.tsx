'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@yasumu/ui/components/popover';
import { cn } from '@yasumu/ui/lib/utils';
import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';

interface VariableSegment {
  type: 'text' | 'variable';
  content: string;
  variableName?: string;
  start: number;
  end: number;
}

export interface InteropableInputProps {
  value: string;
  onChange?: (value: string) => void;
  onVariableClick?: (variableName: string) => React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

function parseSegments(value: string): VariableSegment[] {
  const segments: VariableSegment[] = [];
  let lastIndex = 0;

  const matches = value.matchAll(VARIABLE_PATTERN);

  for (const match of matches) {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;

    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        content: value.slice(lastIndex, matchStart),
        start: lastIndex,
        end: matchStart,
      });
    }

    segments.push({
      type: 'variable',
      content: match[0],
      variableName: match[1].trim(),
      start: matchStart,
      end: matchEnd,
    });

    lastIndex = matchEnd;
  }

  if (lastIndex < value.length) {
    segments.push({
      type: 'text',
      content: value.slice(lastIndex),
      start: lastIndex,
      end: value.length,
    });
  }

  return segments;
}

interface VariableBadgeProps {
  segment: VariableSegment;
  onVariableClick?: (variableName: string) => React.ReactNode;
}

function parseVariableKey(name: string): {
  type: 'variable' | 'secret' | 'unknown';
  key: string;
} {
  if (name.startsWith('variables.')) {
    return { type: 'variable', key: name.slice(10) };
  }
  if (name.startsWith('secrets.')) {
    return { type: 'secret', key: name.slice(8) };
  }
  return { type: 'unknown', key: name };
}

function useIsVariableResolved(variableName: string | undefined): boolean {
  const { selectedEnvironment } = useEnvironmentStore();

  if (!variableName || !selectedEnvironment) return false;

  const { type, key } = parseVariableKey(variableName);

  if (type === 'variable') {
    return selectedEnvironment.variables.get(key)?.value !== undefined;
  }
  if (type === 'secret') {
    return selectedEnvironment.secrets.get(key)?.value !== undefined;
  }

  const fromVars = selectedEnvironment.variables.get(key);
  if (fromVars?.value !== undefined) return true;

  const fromSecrets = selectedEnvironment.secrets.get(key);
  return fromSecrets?.value !== undefined;
}

function VariableBadge({ segment, onVariableClick }: VariableBadgeProps) {
  const [open, setOpen] = useState(false);
  const isResolved = useIsVariableResolved(segment.variableName);

  const popoverContent = useMemo(() => {
    if (!segment.variableName || !onVariableClick) return null;
    return onVariableClick(segment.variableName);
  }, [segment.variableName, onVariableClick]);

  const baseClasses = isResolved
    ? 'bg-primary/20 text-primary hover:bg-primary/30 focus:ring-primary/50'
    : 'bg-destructive/20 text-destructive hover:bg-destructive/30 focus:ring-destructive/50';

  if (!onVariableClick || !popoverContent) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded px-1 py-0.5 font-mono text-xs font-medium cursor-default',
          baseClasses,
        )}
      >
        {segment.content}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center rounded px-1 py-0.5 font-mono text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1',
            baseClasses,
          )}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {segment.content}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[200px]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-interopable-input]')) {
            e.preventDefault();
          }
        }}
      >
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}

export function InteropableInput({
  value,
  onChange,
  onVariableClick,
  placeholder,
  className,
  disabled,
  onKeyDown,
}: InteropableInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(() => parseSegments(value), [value]);
  const hasVariables = segments.some((s) => s.type === 'variable');

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-slot="popover-trigger"]')) return;
      if (target.closest('[data-slot="popover-content"]')) return;
      if (
        document.querySelector(
          '[data-state="open"][data-slot="popover-content"]',
        )
      )
        return;
      setIsEditing(true);
    },
    [disabled],
  );

  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing || !hasVariables) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          'font-mono',
          className,
        )}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      data-interopable-input
      onClick={handleContainerClick}
      className={cn(
        'relative flex items-center gap-0.5 flex-wrap',
        'dark:bg-input/30 border-input h-auto min-h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm',
        'hover:border-ring/50 cursor-text',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
    >
      {segments.map((segment, index) => {
        if (segment.type === 'variable') {
          return (
            <VariableBadge
              key={`${segment.start}-${segment.end}`}
              segment={segment}
              onVariableClick={onVariableClick}
            />
          );
        }
        return (
          <span
            key={`${segment.start}-${segment.end}`}
            className="font-mono text-sm whitespace-pre"
          >
            {segment.content}
          </span>
        );
      })}
      {!value && placeholder && (
        <span className="text-muted-foreground font-mono text-sm">
          {placeholder}
        </span>
      )}
    </div>
  );
}
