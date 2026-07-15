(function () {
  'use strict';

  const { core } = __bootstrap;
  const {
    op_send_renderer_event,
    op_get_resources_dir,
    op_get_app_data_dir,
    op_set_rpc_port,
    op_generate_cuid,
    op_is_yasumu_ready,
    op_get_yasumu_version,
    op_set_echo_server_port,
    op_set_mcp_server_port,
    op_register_virtual_module,
    op_unregister_virtual_module,
    op_is_yasumu_dev_mode,
    op_get_rpc_port,
    op_unregister_all_virtual_modules,
    op_show_confirmation_dialog_sync,
    op_set_workspace_dir,
    op_get_workspace_dir,
  } = core.ops;

  // `loadExtScript` temporarily restores Deno's captured bootstrap namespace,
  // which retains these functions after the public `Deno.core.ops` object is
  // trimmed. The synthetic ESM module exposes the private copy to Tanxium's
  // lazily evaluated TypeScript modules.
  return {
    tanxiumOps: Object.freeze({
      op_send_renderer_event,
      op_get_resources_dir,
      op_get_app_data_dir,
      op_set_rpc_port,
      op_generate_cuid,
      op_is_yasumu_ready,
      op_get_yasumu_version,
      op_set_echo_server_port,
      op_set_mcp_server_port,
      op_register_virtual_module,
      op_unregister_virtual_module,
      op_is_yasumu_dev_mode,
      op_get_rpc_port,
      op_unregister_all_virtual_modules,
      op_show_confirmation_dialog_sync,
      op_set_workspace_dir,
      op_get_workspace_dir,
    }),
  };
})();
