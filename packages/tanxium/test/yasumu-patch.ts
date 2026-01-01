if (typeof globalThis.Yasumu === 'undefined') {
  globalThis.Yasumu = {
    getResourcesDir() {
      return Deno.cwd();
    },
    getServerEntrypoint() {
      return Deno.cwd();
    },
    getAppDataDir() {
      return Deno.cwd();
    },
    setRpcPort(port: number) {
      console.log('Yasumu.setRpcPort', port);
    },
    setEchoServerPort(port: number) {
      console.log('Yasumu.setEchoServerPort', port);
    },
    cuid() {
      return crypto.randomUUID();
    },
    isDevMode: true,
  } as typeof Yasumu;
}
