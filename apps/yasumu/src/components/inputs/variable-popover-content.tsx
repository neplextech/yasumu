'use client';

import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';
import { Input } from '@yasumu/ui/components/input';
import { Label } from '@yasumu/ui/components/label';
import { Button } from '@yasumu/ui/components/button';
import { Badge } from '@yasumu/ui/components/badge';
import { useState, useCallback, useMemo } from 'react';
import { toast } from '@yasumu/ui/components/sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface VariablePopoverContentProps {
  variableName: string;
  onValueChange?: (variableName: string, newValue: string) => void;
}

type ExplicitType = 'variable' | 'secret';
type ResolvedSource = 'variable' | 'secret' | null;

interface ParsedVariable {
  explicitType: ExplicitType | null;
  key: string;
}

function parseVariableName(name: string): ParsedVariable {
  if (name.startsWith('variables.')) {
    return { explicitType: 'variable', key: name.slice(10) };
  }
  if (name.startsWith('secrets.')) {
    return { explicitType: 'secret', key: name.slice(8) };
  }
  return { explicitType: null, key: name };
}

export function VariablePopoverContent({
  variableName,
  onValueChange,
}: VariablePopoverContentProps) {
  const { selectedEnvironment } = useEnvironmentStore();
  const { explicitType, key } = parseVariableName(variableName);

  const resolution = useMemo(() => {
    if (!selectedEnvironment) {
      return { value: undefined, source: null as ResolvedSource };
    }

    if (explicitType === 'variable') {
      const val = selectedEnvironment.variables.get(key)?.value;
      return {
        value: val,
        source: val !== undefined ? ('variable' as const) : null,
      };
    }
    if (explicitType === 'secret') {
      const val = selectedEnvironment.secrets.get(key)?.value;
      return {
        value: val,
        source: val !== undefined ? ('secret' as const) : null,
      };
    }

    const fromVars = selectedEnvironment.variables.get(key);
    if (fromVars?.value !== undefined) {
      return { value: fromVars.value, source: 'variable' as const };
    }

    const fromSecrets = selectedEnvironment.secrets.get(key);
    if (fromSecrets?.value !== undefined) {
      return { value: fromSecrets.value, source: 'secret' as const };
    }

    return { value: undefined, source: null as ResolvedSource };
  }, [selectedEnvironment, explicitType, key]);

  const currentValue = resolution.value;
  const resolvedSource = resolution.source;
  const isResolved = currentValue !== undefined;

  const [editValue, setEditValue] = useState(currentValue ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [saveTarget, setSaveTarget] = useState<'variable' | 'secret'>(
    explicitType ?? resolvedSource ?? 'variable',
  );

  const handleSave = useCallback(async () => {
    if (!selectedEnvironment) return;

    setIsSaving(true);
    try {
      if (saveTarget === 'variable') {
        await selectedEnvironment.variables.set(key, editValue, true);
      } else {
        await selectedEnvironment.secrets.set(key, editValue, true);
      }

      onValueChange?.(variableName, editValue);
      toast.success(
        `${saveTarget === 'secret' ? 'Secret' : 'Variable'} "${key}" updated successfully`,
      );
    } catch (error) {
      toast.error('Failed to update');
      console.error('Failed to update:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedEnvironment,
    saveTarget,
    key,
    editValue,
    variableName,
    onValueChange,
  ]);

  const getTypeLabel = () => {
    if (explicitType) {
      return explicitType === 'secret' ? 'Secret' : 'Variable';
    }
    if (resolvedSource) {
      return resolvedSource === 'secret' ? 'Secret (auto)' : 'Variable (auto)';
    }
    return 'Unresolved';
  };

  const isSecret =
    explicitType === 'secret' ||
    (explicitType === null && resolvedSource === 'secret');

  if (!selectedEnvironment) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{variableName}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          No environment selected. Select an environment to resolve variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-sm font-medium break-all">{key}</span>
        <Badge
          variant={isResolved ? 'default' : 'destructive'}
          className="text-xs"
        >
          {getTypeLabel()}
        </Badge>
      </div>

      {isResolved && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Current Value</Label>
          {isSecret ? (
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={currentValue}
                readOnly
                className="font-mono text-sm h-8 pr-8 bg-muted/50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8 hover:bg-transparent"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>
          ) : (
            <div className="font-mono text-sm bg-muted/50 px-2 py-1 rounded border break-all">
              {currentValue}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {isResolved ? 'Update Value' : 'Set Value'}
        </Label>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Enter value..."
          className="font-mono text-sm h-8"
          disabled={isSaving}
        />

        {!explicitType && !isResolved && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={saveTarget === 'variable' ? 'default' : 'outline'}
              onClick={() => setSaveTarget('variable')}
              className="h-6 text-xs flex-1"
              disabled={isSaving}
            >
              Variable
            </Button>
            <Button
              size="sm"
              variant={saveTarget === 'secret' ? 'default' : 'outline'}
              onClick={() => setSaveTarget('secret')}
              className="h-6 text-xs flex-1"
              disabled={isSaving}
            >
              Secret
            </Button>
          </div>
        )}

        <Button
          size="sm"
          onClick={handleSave}
          className="h-7 text-xs w-full"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            `Save as ${(explicitType ?? (isResolved ? resolvedSource : saveTarget) === 'secret') ? 'Secret' : 'Variable'}`
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground pt-1 border-t">
        Environment:{' '}
        <span className="font-medium">{selectedEnvironment.name}</span>
      </div>
    </div>
  );
}
