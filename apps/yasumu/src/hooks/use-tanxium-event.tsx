'use client';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { EmailData, SubscriptionEventPayload, Yasumu } from '@yasumu/core';
import { toast } from '@yasumu/ui/components/sonner';
import { useEffect } from 'react';

import { useConsoleStore } from '@/stores/console-store';

type ConsoleLevel = 'error' | 'info' | 'log' | 'warn';
type NotificationVariant = 'default' | 'error' | 'info' | 'success' | 'warning';

interface TanxiumEvent {
  type: 'console' | 'message' | 'show-notification';
  payload: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTanxiumEvent(value: unknown): value is TanxiumEvent {
  return (
    isRecord(value) &&
    (value.type === 'console' || value.type === 'message' || value.type === 'show-notification') &&
    Object.hasOwn(value, 'payload')
  );
}

function isSubscriptionEventPayload(value: unknown): value is SubscriptionEventPayload {
  return (
    isRecord(value) &&
    (value.event === 'rest-entity-updated' ||
      value.event === 'graphql-entity-updated' ||
      value.event === 'entity-history-updated') &&
    isRecord(value.data) &&
    typeof value.data.workspaceId === 'string'
  );
}

function isEmailData(value: unknown): value is EmailData {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.from === 'string' &&
    typeof value.to === 'string' &&
    typeof value.subject === 'string' &&
    typeof value.html === 'string' &&
    typeof value.text === 'string' &&
    (value.cc === null || typeof value.cc === 'string') &&
    typeof value.unread === 'boolean' &&
    typeof value.createdAt === 'number' &&
    typeof value.updatedAt === 'number'
  );
}

function isNotificationVariant(value: unknown): value is NotificationVariant {
  return value === 'default' || value === 'error' || value === 'info' || value === 'success' || value === 'warning';
}

function handleConsoleEvent(payload: unknown, addLog: (entry: { level: ConsoleLevel; message: string }) => void) {
  if (!isRecord(payload) || typeof payload.msg !== 'string' || typeof payload.level !== 'number') return;

  const levels: Record<number, ConsoleLevel> = { 0: 'log', 2: 'info', 3: 'warn', 4: 'error' };
  const level = levels[payload.level] ?? 'log';
  console[level](payload.msg);
  addLog({ level, message: payload.msg });
}

function handleNotificationEvent(payload: unknown): void {
  if (!isRecord(payload) || typeof payload.title !== 'string' || typeof payload.message !== 'string') return;

  const variant = isNotificationVariant(payload.variant) ? payload.variant : 'default';
  const options = { description: payload.message };

  if (variant === 'default') toast(payload.title, options);
  else toast[variant](payload.title, options);
}

async function handleMessageEvent(yasumu: Yasumu, payload: unknown): Promise<void> {
  if (!isRecord(payload)) return;

  if (payload.type === 'yasumu-subscription' && isSubscriptionEventPayload(payload.data)) {
    await yasumu.onSubscription(payload.data);
    return;
  }

  if (payload.event !== 'new-email' || !isRecord(payload.data)) return;
  if (typeof payload.data.workspaceId !== 'string' || !isEmailData(payload.data.newEmail)) return;

  yasumu.events.emit('onNewEmail', payload.data.workspaceId, payload.data.newEmail);
}

export function useTanxiumEvent(yasumu: Yasumu | null): void {
  const addLog = useConsoleStore((state) => state.addLog);

  useEffect(() => {
    if (!yasumu) return;

    let active = true;
    const globalObject = globalThis as typeof globalThis & { emitEvent?: (payload: unknown) => void };
    const emitEvent = (payload: unknown) => {
      void invoke('tanxium_send_event', { data: JSON.stringify(payload) }).catch((error: unknown) => {
        console.error('Failed to send a Tanxium event:', error);
      });
    };
    globalObject.emitEvent = emitEvent;

    const unlistenPromise = listen<string>('tanxium-event', ({ payload }) => {
      if (!active) return;

      void (async () => {
        try {
          const parsed: unknown = JSON.parse(payload);
          if (!isTanxiumEvent(parsed)) throw new Error('Tanxium sent an invalid event envelope');

          switch (parsed.type) {
            case 'console':
              handleConsoleEvent(parsed.payload, addLog);
              break;
            case 'show-notification':
              handleNotificationEvent(parsed.payload);
              break;
            case 'message':
              await handleMessageEvent(yasumu, parsed.payload);
              break;
          }
        } catch (error) {
          console.error('Failed to handle a Tanxium event:', error);
        }
      })();
    });

    return () => {
      active = false;
      if (globalObject.emitEvent === emitEvent) delete globalObject.emitEvent;
      void unlistenPromise
        .then((unlisten) => unlisten())
        .catch((error: unknown) => {
          console.error('Failed to remove the Tanxium event listener:', error);
        });
    };
  }, [addLog, yasumu]);
}
