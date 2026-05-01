'use client';

import {
  useYasumu,
  useActiveWorkspace,
} from '../../providers/workspace-provider';
import { useQuery } from '@tanstack/react-query';
import { LuMail, LuRadio, LuServer } from 'react-icons/lu';
import { ServerStatus } from './server-status';
import { ConsoleButton } from './console-button';
import { ConsoleSheet } from './console-sheet';
import { useEffect, useEffectEvent } from 'react';
import { LuPlugZap } from 'react-icons/lu';
import { trackEvent } from '@/lib/instrumentation/analytics';

function StatusBarDivider() {
  return <div className="w-px h-3 bg-border" />;
}

export function StatusBar() {
  const { port, echoServerPort, mcpServerPort } = useYasumu();
  const workspace = useActiveWorkspace(false);

  const { data: smtpPort, refetch: refetchSmtpPort } = useQuery({
    queryKey: ['smtp-port', workspace?.id],
    queryFn: () => workspace?.emails.getSmtpPort().catch(() => null) ?? null,
    enabled: !!workspace,
    staleTime: 10000,
  });

  const fetchSmtpPort = useEffectEvent(() => {
    if (smtpPort == null) {
      refetchSmtpPort().catch(Object);
    }
  });

  useEffect(() => {
    if (!workspace) return;
    fetchSmtpPort();
  }, [workspace]);

  if (!workspace) return null;

  return (
    <>
      <div
        data-id="yasumu-status-bar"
        className="h-[22px] flex items-center justify-between bg-background border-t select-none shrink-0 text-xs"
      >
        <div className="flex items-center h-full">
          <ServerStatus
            label="RPC Server"
            port={port}
            icon={LuServer}
            active={!!port}
          />
          <StatusBarDivider />
          <ServerStatus
            label="Echo Server"
            port={echoServerPort}
            icon={LuRadio}
            active={!!echoServerPort}
          />
          <StatusBarDivider />
          <ServerStatus
            label="SMTP Server"
            port={smtpPort ?? null}
            icon={LuMail}
            active={!!smtpPort}
          />
          <StatusBarDivider />
          <ServerStatus
            label="MCP Server"
            port={mcpServerPort}
            icon={LuPlugZap}
            active={!!mcpServerPort}
            href={
              mcpServerPort ? `http://127.0.0.1:${mcpServerPort}` : undefined
            }
            onOpen={() =>
              trackEvent('mcp_status_opened', {
                port_available: !!mcpServerPort,
              })
            }
          />
        </div>
        <div className="flex items-center h-full">
          <ConsoleButton />
        </div>
      </div>
      <ConsoleSheet />
    </>
  );
}
