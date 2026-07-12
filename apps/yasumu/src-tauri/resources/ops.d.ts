declare global {
  namespace Deno {
    var core: {
      ops: {
        op_send_renderer_event(event: string): void;
        op_register_renderer_event_listener(callback: (event: string) => void): number;
        op_get_resources_dir(): string;
        op_get_app_data_dir(): string;
        op_set_rpc_port(port: number): void;
        op_generate_cuid(): string;
        op_is_yasumu_ready(): boolean;
        op_get_yasumu_version(): string;
        op_set_echo_server_port(port: number): void;
        op_register_virtual_module(key: string, code: string): void;
        op_unregister_virtual_module(key: string): void;
        op_unregister_all_virtual_modules(): void;
        op_set_mcp_server_port(port: number): void;
        op_is_yasumu_dev_mode(): boolean;
        op_get_rpc_port(): number | null;
        op_set_workspace_dir(path: string | null): void;
        op_get_workspace_dir(): string | null;
        op_show_confirmation_dialog_sync(
          title: string,
          message: string,
          yes_label: string,
          no_label: string,
          cancel_label: string,
        ): boolean;
      };
    };
  }
}

export {};
