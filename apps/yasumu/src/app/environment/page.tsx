'use client';
import { YasumuEnvironmentVariable } from '@yasumu/core';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvVarsTable } from './(components)/env-table';
import { handleErrorToast } from '@/lib/handlers/handleErrorToast';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { AlertConfirm } from '@/components/dialogs/AlertConfirm';
import { toast } from 'sonner';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';

export default function Environment() {
  const { selectedEnvironmentId, environments } = useYasumu();
  const [envVars, setEnvVars] = useState<YasumuEnvironmentVariable[]>([]);
  const [envSecrets, setEnvSecrets] = useState<YasumuEnvironmentVariable[]>([]);
  const params = useSearchParams();
  const router = useRouter();
  const envId = params.get('env');
  const env = environments.find((e) => e.id === envId);

  useEffect(() => {
    if (!env) return;

    const vars = env.variables.map((v) => ({
      key: v.key,
      value: v.value,
      enabled: true,
    }));

    setEnvVars(vars);

    env.getSecretsWithValues().then((secrets) => {
      const s = secrets.map((v) => ({
        key: v.key,
        value: v.value,
        enabled: true,
      }));

      setEnvSecrets(s);
    });
  }, [env]);

  if (!env) return null;

  return (
    <main className="p-7 h-full overflow-auto">
      <div className="pb-4 border-b mb-4">
        <h2 className="text-foreground/95 font-medium">{env.name}</h2>
        <h3 className="text-foreground/70 text-sm">
          Environment ID:{' '}
          <code className="font-semibold bg-secondary px-1 select-text cursor-default">
            {env.id}
          </code>
        </h3>
        <Label className="flex gap-3 items-center mt-4">
          <Checkbox
            className="size-4"
            checked={selectedEnvironmentId === env.id}
            onCheckedChange={handleErrorToast(async (e) => {
              if (typeof e !== 'boolean') return;

              if (e) {
                await env.select();
              } else {
                await env.unselect();
              }
            })}
          />
          <span className="text-foreground/90">Use this environment</span>
        </Label>
      </div>

      <div className="space-y-12">
        <div>
          <h3 className="text-foreground/90 text-sm font-medium">Variables</h3>
          <p className="text-foreground/70 text-sm mt-1">
            Variable will be publicly exported in the workspace.
          </p>
          <div className="my-4">
            <EnvVarsTable envVars={envVars} setEnvVars={setEnvVars} />
          </div>
        </div>

        <div>
          <h3 className="text-foreground/90 text-sm font-medium">Secrets</h3>
          <p className="text-foreground/70 text-sm mt-1">
            Secret will not be exported in the workspace.
          </p>
          <div className="my-4">
            <EnvVarsTable envVars={envSecrets} setEnvVars={setEnvSecrets} />
          </div>
        </div>

        <div>
          <h3 className="text-foreground/90 text-sm font-medium">
            Danger Zone
          </h3>
          <p className="text-foreground/70 text-sm mt-1 mb-2">
            Delete this environment.
          </p>
          <AlertConfirm
            onConfirm={handleErrorToast(async () => {
              await env.delete();
              toast.success('Environment deleted!');
              router.replace(
                `/environment${environments.length > 1 ? `?env=${environments[0].id}` : ''}`,
              );
            })}
          >
            <Button variant="destructive">
              <Trash />
              Delete
            </Button>
          </AlertConfirm>
        </div>
      </div>
    </main>
  );
}
