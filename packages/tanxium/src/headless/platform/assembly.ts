import { HeadlessExecutionService } from "@yasumu/headless";
import type { YasumuScriptRuntime } from "@yasumu/runtime-api";

import type { HeadlessDrizzleDatabase } from "../persistence/database.ts";
import { createDrizzleHeadlessPersistence } from "../persistence/index.ts";
import {
  type EchoServerPortProvider,
  type FetchImplementation,
  GuiFetchTransport,
} from "./echo-transport.ts";
import { GuiEmailHookService } from "./email-hook.ts";
import {
  type GuiExecutionEventPublisher,
  GuiExecutionEventSink,
} from "./event-sink.ts";
import { type GuiFileHandleStore, GuiFileResolver } from "./file-resolver.ts";
import {
  type GuiConfirmationHandler,
  GuiPermissionProvider,
} from "./permission-provider.ts";

export interface GuiHeadlessExecutionOptions {
  database: HeadlessDrizzleDatabase;
  runtime: YasumuScriptRuntime;
  publishExecutionEvent: GuiExecutionEventPublisher;
  echoServerPort?: EchoServerPortProvider;
  fetch?: FetchImplementation;
  fileHandles?: GuiFileHandleStore;
  confirmPermission?: GuiConfirmationHandler;
}

/** Fully assembled desktop host for the canonical headless execution lifecycle. */
export function createGuiHeadlessExecutionPlatform(
  options: GuiHeadlessExecutionOptions,
) {
  const persistence = createDrizzleHeadlessPersistence(options.database);
  const files = new GuiFileResolver(options.fileHandles);
  const transport = new GuiFetchTransport(
    options.echoServerPort,
    options.fetch,
  );
  const permissions = new GuiPermissionProvider(options.confirmPermission);
  const events = new GuiExecutionEventSink(options.publishExecutionEvent);
  const execution = new HeadlessExecutionService({
    workspaces: persistence.workspaces,
    entities: persistence.entities,
    runtime: options.runtime,
    transport,
    files,
    email: persistence.email,
    permissions,
    events,
    history: persistence.history,
  });
  const emailHooks = new GuiEmailHookService({
    workspaces: persistence.workspaces,
    entities: persistence.entities,
    runtime: options.runtime,
    execution,
    email: persistence.email,
    files,
    permissions,
  });

  return {
    execution,
    emailHooks,
    persistence,
    files,
    transport,
    permissions,
    events,
  };
}

export type GuiHeadlessExecutionPlatform = ReturnType<
  typeof createGuiHeadlessExecutionPlatform
>;
