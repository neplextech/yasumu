'use client';

import { useState } from 'react';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Button } from '@yasumu/ui/components/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@yasumu/ui/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@yasumu/ui/components/dialog';
import { Input } from '@yasumu/ui/components/input';

interface Environment {
  id: string;
  name: string;
}

interface EnvironmentListProps {
  environments: Environment[];
  selectedEnvironmentId?: string;
  onSelectEnvironment: (id: string) => void;
  onAddEnvironment: (name: string) => void;
  onDeleteEnvironment: (id: string) => void;
  canDelete: boolean;
}

export default function EnvironmentList({
  environments,
  selectedEnvironmentId,
  onSelectEnvironment,
  onAddEnvironment,
  onDeleteEnvironment,
  canDelete,
}: EnvironmentListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');

  const handleAddEnvironment = () => {
    if (newEnvironmentName.trim()) {
      onAddEnvironment(newEnvironmentName.trim());
      setNewEnvironmentName('');
      setIsDialogOpen(false);
    }
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
                <div
                  key={env.id}
                  className={cn(
                    'group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors',
                    selectedEnvironmentId === env.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted/50',
                  )}
                  onClick={() => onSelectEnvironment(env.id)}
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    {selectedEnvironmentId === env.id && (
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    )}
                    {env.name}
                  </span>
                  {canDelete && selectedEnvironmentId === env.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEnvironment(env.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
