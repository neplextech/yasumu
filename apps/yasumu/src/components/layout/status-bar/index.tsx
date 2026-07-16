'use client';

import { useQuery } from '@tanstack/react-query';
import { LuMail, LuRadio, LuServer } from 'react-icons/lu';
import { LuPlugZap } from 'react-icons/lu';

import { trackEvent } from '@/lib/instrumentation/analytics';

import { useActiveWorkspace, useYasumuRuntime } from '../../providers/workspace-provider';
import { ConsoleButton } from './console-button';
import { ConsoleSheet } from './console-sheet';
import { ServerStatus } from './server-status';

function StatusBarDivider() {
  return <div className="bg-border h-3 w-px" />;
}

export function StatusBar() {
  const { port, echoServerPort, mcpServerPort } = useYasumuRuntime();
  const workspace = useActiveWorkspace(false);

  const { data: smtpPort } = useQuery({
    queryKey: ['smtp-port', workspace?.id],
    queryFn: () => workspace?.emails.getSmtpPort().catch(() => null) ?? null,
    enabled: !!workspace,
    staleTime: 10000,
  });

  if (!workspace) return null;

  return (
    <>
      <div
        data-id="yasumu-status-bar"
        className="bg-background flex h-[22px] shrink-0 items-center justify-between border-t text-xs select-none"
      >
        <div className="flex h-full items-center">
          <ServerStatus label="RPC Server" port={port} icon={LuServer} active={!!port} />
          <StatusBarDivider />
          <ServerStatus label="Echo Server" port={echoServerPort} icon={LuRadio} active={!!echoServerPort} />
          <StatusBarDivider />
          <ServerStatus label="SMTP Server" port={smtpPort ?? null} icon={LuMail} active={!!smtpPort} />
          <StatusBarDivider />
          <ServerStatus
            label="MCP Server"
            port={mcpServerPort}
            icon={LuPlugZap}
            active={!!mcpServerPort}
            href={mcpServerPort ? `http://127.0.0.1:${mcpServerPort}` : undefined}
            onOpen={() =>
              trackEvent('mcp_status_opened', {
                port_available: !!mcpServerPort,
              })
            }
          />
        </div>
        <div className="flex h-full items-center">
          <ConsoleButton />
        </div>
      </div>
      <ConsoleSheet />
    </>
  );
}
