if (typeof Yasumu === 'undefined') {
  globalThis.Yasumu = {
    getResourcesDir() {
      return Deno.cwd();
    },
    getServerEntrypoint() {
      return Deno.cwd();
    },
    setRpcPort(port: number) {
      console.log('Yasumu.setRpcPort', port);
    },
    cuid() {
      return crypto.randomUUID();
    },
  } as typeof Yasumu;
}
