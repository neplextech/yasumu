import { Injectable } from "@yasumu/den";
import type {
  EmailHookResult,
  ExecuteEntityInput,
  ExecutionEvent,
  ExecutionResult,
  YasumuFileReference,
} from "@yasumu/headless";
import type { RegisterFileInput } from "@yasumu/rpc";
import type { WorkspaceEmail } from "@yasumu/runtime-api";

import { db } from "../../../database/index.ts";
import {
  createGuiHeadlessExecutionPlatform,
  type GuiHeadlessExecutionPlatform,
  InMemoryGuiFileHandleStore,
} from "../../../headless/platform/index.ts";
import { TanxiumScriptRuntime } from "../../../headless/runtime/index.ts";
import { TanxiumService } from "../common/tanxium.service.ts";

export type GuiExecuteEntityInput = Omit<
  ExecuteEntityInput,
  "workspaceId" | "signal"
>;

@Injectable()
export class ExecutionService {
  private readonly platform: GuiHeadlessExecutionPlatform;
  private readonly fileHandles = new InMemoryGuiFileHandleStore();
  private readonly activeByWorkspace = new Map<string, Set<string>>();

  public constructor(tanxiumService: TanxiumService) {
    this.platform = createGuiHeadlessExecutionPlatform({
      database: db,
      runtime: new TanxiumScriptRuntime(),
      publishExecutionEvent: (event) => {
        this.trackActiveExecution(event);
        return tanxiumService.publishMessage("execution-event", event);
      },
      fileHandles: this.fileHandles,
    });
  }

  public execute(
    workspaceId: string,
    input: GuiExecuteEntityInput,
  ): Promise<ExecutionResult> {
    return this.platform.execution.execute({ ...input, workspaceId });
  }

  public cancel(
    workspaceId: string,
    executionId: string,
    reason?: string,
  ): boolean {
    if (!this.activeByWorkspace.get(workspaceId)?.has(executionId)) {
      return false;
    }
    return this.platform.execution.cancel(executionId, reason);
  }

  public active(workspaceId: string): string[] {
    return [...(this.activeByWorkspace.get(workspaceId) ?? [])].sort();
  }

  public registerFile(
    workspaceId: string,
    file: RegisterFileInput,
  ): YasumuFileReference {
    const handleId = `${workspaceId}:${crypto.randomUUID()}`;
    return this.fileHandles.register(handleId, file);
  }

  public handleEmail(
    workspaceId: string,
    email: WorkspaceEmail,
    signal?: AbortSignal,
  ): Promise<EmailHookResult> {
    return this.platform.emailHooks.handle(workspaceId, email, signal);
  }

  private trackActiveExecution(event: ExecutionEvent): void {
    if (event.type === "execution-started") {
      const active = this.activeByWorkspace.get(event.workspaceId) ??
        new Set<string>();
      active.add(event.executionId);
      this.activeByWorkspace.set(event.workspaceId, active);
      return;
    }
    if (
      event.type !== "execution-completed" &&
      event.type !== "execution-cancelled" &&
      event.type !== "execution-failed"
    ) {
      return;
    }
    const active = this.activeByWorkspace.get(event.workspaceId);
    active?.delete(event.executionId);
    if (active?.size === 0) this.activeByWorkspace.delete(event.workspaceId);
  }
}
