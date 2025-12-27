'use client';

import { useState } from 'react';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Button } from '@yasumu/ui/components/button';
import { Check, Plus } from 'lucide-react';
import { cn } from '@yasumu/ui/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@yasumu/ui/components/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@yasumu/ui/components/context-menu';
import { Input } from '@yasumu/ui/components/input';
import type { Environment, TabularPair } from '@yasumu/core';

interface EnvironmentListProps {
  environments: Environment[];
  activeEnvironmentId?: string;
  selectedEnvironmentId?: string;
  onSelectEnvironment: (id: string) => void;
  onAddEnvironment: (
    name: string,
    secrets?: TabularPair[],
    variables?: TabularPair[],
  ) => void;
  onDeleteEnvironment: (id: string) => void;
  onRenameEnvironment?: (id: string, name: string) => void;
  onDuplicateEnvironment?: (
    sourceId: string,
    newName: string,
    secrets?: TabularPair[],
    variables?: TabularPair[],
  ) => void;
}

export default function EnvironmentList({
  environments,
  activeEnvironmentId,
  selectedEnvironmentId,
  onSelectEnvironment,
  onAddEnvironment,
  onDeleteEnvironment,
  onRenameEnvironment,
  onDuplicateEnvironment,
}: EnvironmentListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [contextAction, setContextAction] = useState<{
    type: 'rename' | 'duplicate';
    env: Environment;
  } | null>(null);
  const [actionInputValue, setActionInputValue] = useState('');

  const handleAddEnvironment = () => {
    if (newEnvironmentName.trim()) {
      onAddEnvironment(newEnvironmentName.trim());
      setNewEnvironmentName('');
      setIsDialogOpen(false);
    }
  };

  const handleContextAction = () => {
    if (!contextAction || !actionInputValue.trim()) return;

    if (contextAction.type === 'rename') {
      onRenameEnvironment?.(contextAction.env.id, actionInputValue.trim());
    } else if (contextAction.type === 'duplicate') {
      onDuplicateEnvironment?.(
        contextAction.env.id,
        actionInputValue.trim(),
        contextAction.env.secrets.toJSON(),
        contextAction.env.variables.toJSON(),
      );
    }

    setContextAction(null);
    setActionInputValue('');
  };

  const openContextDialog = (
    type: 'rename' | 'duplicate',
    env: Environment,
  ) => {
    setContextAction({ type, env });
    setActionInputValue(type === 'rename' ? env.name : `${env.name} (Copy)`);
  };

  return (
    <div className="flex flex-col h-full border-r bg-background/50">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Environments</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Environment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Environment name (e.g., Staging, Development)"
                  value={newEnvironmentName}
                  onChange={(e) => setNewEnvironmentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddEnvironment();
                    }
                  }}
                />
                <Button onClick={handleAddEnvironment} className="w-full">
                  Create Environment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {environments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No environments</p>
              <p className="text-xs mt-1">Create your first environment</p>
            </div>
          ) : (
            <div className="space-y-1">
              {environments.map((env) => (
                <ContextMenu key={env.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        'group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors',
                        selectedEnvironmentId === env.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted/50',
                      )}
                      onClick={() => onSelectEnvironment(env.id)}
                    >
                      <span className="text-sm font-medium flex items-center gap-2">
                        {activeEnvironmentId === env.id && (
                          <Check className="size-4" />
                        )}
                        {env.name}
                      </span>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={() => openContextDialog('rename', env)}
                    >
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => openContextDialog('duplicate', env)}
                    >
                      Duplicate
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant="destructive"
                      onClick={() => onDeleteEnvironment(env.id)}
                    >
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog
        open={contextAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setContextAction(null);
            setActionInputValue('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contextAction?.type === 'rename'
                ? 'Rename Environment'
                : 'Duplicate Environment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Environment name"
              value={actionInputValue}
              onChange={(e) => setActionInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleContextAction();
                }
              }}
            />
            <Button onClick={handleContextAction} className="w-full">
              {contextAction?.type === 'rename' ? 'Rename' : 'Duplicate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
