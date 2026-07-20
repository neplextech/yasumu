'use client';

import { Input } from '@yasumu/ui/components/input';
import { Popover, PopoverContent, PopoverTrigger } from '@yasumu/ui/components/popover';
import { cn } from '@yasumu/ui/lib/utils';
import { forwardRef, useCallback, useId, useMemo, useRef, useState } from 'react';

import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';

interface VariableSegment {
  type: 'text' | 'variable';
  content: string;
  variableName?: string;
  start: number;
  end: number;
}

export interface InteropableInputProps extends Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'onChange' | 'type' | 'value'
> {
  value: string;
  onChange?: (value: string) => void;
  onVariableClick?: (variableName: string) => React.ReactNode;
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
  const selectedEnvironment = useEnvironmentStore((state) => state.selectedEnvironment);

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
        aria-hidden="true"
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
          aria-label={`Inspect ${segment.variableName} (${isResolved ? 'resolved' : 'unresolved'})`}
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

export const InteropableInput = forwardRef<HTMLInputElement, InteropableInputProps>(function InteropableInput(
  { value, onChange, onVariableClick, placeholder, className, disabled, onBlur, onFocus, ...inputProps },
  forwardedRef,
) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedEnvironment = useEnvironmentStore((state) => state.selectedEnvironment);
  const suggestions = useMemo(
    () => [
      ...(selectedEnvironment ? selectedEnvironment.variables.getKeys().map((key) => `{{${key}}}`) : []),
      ...(selectedEnvironment ? selectedEnvironment.secrets.getKeys().map((key) => `{{secrets.${key}}}`) : []),
    ],
    [selectedEnvironment],
  );
  const suggestionsId = useId();

  const segments = useMemo(() => parseSegments(value), [value]);
  const hasVariables = segments.some((s) => s.type === 'variable');

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;

      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-slot="popover-trigger"]')) return;
      if (target.closest('[data-slot="popover-content"]')) return;
      if (document.querySelector('[data-state="open"][data-slot="popover-content"]')) return;
      inputRef.current?.focus();
    },
    [disabled],
  );

  const handleInputBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleInputFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  const input = (
    <Input
      {...inputProps}
      ref={setInputRef}
      type="text"
      list={suggestions.length ? suggestionsId : undefined}
      value={value}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'font-mono',
        hasVariables && !isEditing && 'pointer-events-none absolute inset-0 opacity-0',
        className,
      )}
    />
  );

  if (!hasVariables) {
    return (
      <>
        {input}
        {suggestions.length ? (
          <datalist id={suggestionsId}>
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        ) : null}
      </>
    );
  }

  return (
    <div data-interopable-input className="relative w-full min-w-0">
      {input}
      {suggestions.length ? (
        <datalist id={suggestionsId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
      <div
        onClick={handleContainerClick}
        className={cn(
          'relative flex flex-wrap items-center gap-0.5',
          'dark:bg-input/30 border-input h-auto min-h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm',
          'hover:border-ring/50 cursor-text',
          isEditing && 'pointer-events-none absolute inset-0 opacity-0',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          className,
        )}
      >
        {segments.map((segment) => {
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
              aria-hidden="true"
              className="font-mono text-sm whitespace-pre"
            >
              {segment.content}
            </span>
          );
        })}
        {!value && placeholder ? (
          <span aria-hidden="true" className="text-muted-foreground font-mono text-sm">
            {placeholder}
          </span>
        ) : null}
      </div>
    </div>
  );
});
