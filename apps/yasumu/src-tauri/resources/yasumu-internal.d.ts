declare module 'ext:core/ops' {
  export function op_send_renderer_event(event: string): void;
  export function op_register_renderer_event_listener(
    callback: (event: string) => void,
  ): number;
  export function op_get_resources_dir(): string;
  export function op_get_app_data_dir(): string;
  export function op_set_rpc_port(port: number): void;
  export function op_generate_cuid(): string;
  export function op_is_yasumu_ready(): boolean;
  export function op_get_yasumu_version(): string;
  export function op_set_echo_server_port(port: number): void;
  export function op_register_virtual_module(key: string, code: string): void;
  export function op_unregister_virtual_module(key: string): void;
  export function op_is_yasumu_dev_mode(): boolean;
}

declare module 'ext:deno_console/01_console.js' {
  export class Console {
    constructor(callback: (msg: string, level: number) => void);
    log(...args: unsafe[]): void;
    debug(...args: unsafe[]): void;
    info(...args: unsafe[]): void;
    warn(...args: unsafe[]): void;
    error(...args: unsafe[]): void;
    dir(...args: unsafe[]): void;
    dirxml(...args: unsafe[]): void;
    time(label?: string): void;
    timeEnd(label?: string): void;
    trace(...args: unsafe[]): void;
    assert(condition?: boolean, ...data: unsafe[]): void;
    clear(): void;
    count(label?: string): void;
    countReset(label?: string): void;
    group(...label: unsafe[]): void;
    groupCollapsed(...label: unsafe[]): void;
    groupEnd(): void;
    table(tabularData?: unsafe, properties?: string[]): void;
    timeLog(label?: string, ...data: unsafe[]): void;
    timeStamp(label?: string): void;
    profile(label?: string): void;
    profileEnd(label?: string): void;
  }
}
