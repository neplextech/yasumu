import { Container } from './di/container.js';
import type {
  Type,
  DenApplication,
  RpcRequest,
  ModuleOptions,
  DynamicModule,
  RpcHandlerMetadata,
  Token,
} from './interfaces.js';
import { MODULE_METADATA, RESOLVER_METADATA } from './constants.js';

interface RpcRegistryEntry {
  handler: Function;
  instance: any;
  methodName: string;
  resolverClass: any;
}

interface ModuleDefinition {
  ref: any; // The class or dynamic module object
  metatype: Type<any>;
  container: Container;
  imports: Set<any>; // Set of refs
  exports: Set<Token>;
  isGlobal: boolean;
}

export class DenFactory {
  private static rpcRegistry = new Map<string, RpcRegistryEntry>();
  private static modules = new Map<any, ModuleDefinition>(); // ref -> definition
  private static globalModules = new Set<ModuleDefinition>();

  static async create(rootModule: Type<any>): Promise<DenApplication> {
    // Reset state
    this.rpcRegistry.clear();
    this.modules.clear();
    this.globalModules.clear();

    // 1. Scan Module Dependency Graph
    await this.scanModule(rootModule);

    // 2. Link Modules (Import exports)
    this.linkModules();

    // 3. Instantiate & Initialize
    await this.initializeModules();

    return {
      execute: (req, ctx) => this.execute(req, ctx),
      close: async () => {
        for (const def of this.modules.values()) {
          const instance = def.container.get(def.metatype);
          if (this.hasLifecycleHook(instance, 'onApplicationShutdown')) {
            await instance.onApplicationShutdown();
          }
          if (this.hasLifecycleHook(instance, 'onModuleDestroy')) {
            await instance.onModuleDestroy();
          }
        }
      },
    };
  }

  private static async scanModule(
    moduleRef: Type<any> | DynamicModule,
  ): Promise<ModuleDefinition> {
    if (this.modules.has(moduleRef)) {
      return this.modules.get(moduleRef)!;
    }

    let ModuleClass: Type<any>;
    let dynamicMetadata: Partial<ModuleOptions> = {};
    let isGlobal = false;

    if (this.isDynamicModule(moduleRef)) {
      ModuleClass = moduleRef.module;
      dynamicMetadata = moduleRef;
      isGlobal = moduleRef.global || false;
    } else {
      ModuleClass = moduleRef;
      isGlobal =
        Reflect.getMetadata(MODULE_METADATA.GLOBAL, ModuleClass) || false;
    }

    const container = new Container(ModuleClass.name);
    const def: ModuleDefinition = {
      ref: moduleRef,
      metatype: ModuleClass,
      container,
      imports: new Set(),
      exports: new Set(),
      isGlobal,
    };

    this.modules.set(moduleRef, def);
    if (isGlobal) {
      this.globalModules.add(def);
    }

    // Get metadata
    const imports = [
      ...(Reflect.getMetadata(MODULE_METADATA.IMPORTS, ModuleClass) || []),
      ...(dynamicMetadata.imports || []),
    ];

    const providers = [
      ...(Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ModuleClass) || []),
      ...(dynamicMetadata.providers || []),
    ];

    const resolvers = [
      ...(Reflect.getMetadata(MODULE_METADATA.RESOLVERS, ModuleClass) || []),
      ...(dynamicMetadata.resolvers || []),
    ];

    const exports = [
      ...(Reflect.getMetadata(MODULE_METADATA.EXPORTS, ModuleClass) || []),
      ...(dynamicMetadata.exports || []),
    ];

    // Register Providers
    for (const provider of providers) {
      container.addProvider(provider);
    }

    // Register Resolvers (as providers)
    for (const resolver of resolvers) {
      container.addProvider(resolver);
    }

    // Register Module Class itself
    container.addProvider(ModuleClass);

    // Process Imports
    for (const importRef of imports) {
      const importedDef = await this.scanModule(importRef);
      def.imports.add(importRef);
    }

    // Process Exports
    for (const exportToken of exports) {
      if (this.isDynamicModule(exportToken)) {
        // Re-exporting an imported module?
        // Needs complex handling, simplifying to assume token export
      } else {
        // If export is a provider/token
        let token: Token;
        if (typeof exportToken === 'object' && 'provide' in exportToken) {
          token = exportToken.provide;
        } else {
          token = exportToken as Token;
        }
        def.exports.add(token);
      }
    }

    return def;
  }

  private static linkModules() {
    for (const def of this.modules.values()) {
      // Add imports
      for (const importRef of def.imports) {
        const importedDef = this.modules.get(importRef);
        if (importedDef) {
          def.container.addImport(importedDef.container, importedDef.exports);
        }
      }

      // Add global modules (if not self)
      for (const globalDef of this.globalModules) {
        if (globalDef !== def) {
          def.container.addImport(globalDef.container, globalDef.exports);
        }
      }
    }
  }

  private static async initializeModules() {
    // Instantiate Resolvers & Register RPC
    // Also Instantiate Module classes & run OnModuleInit

    for (const def of this.modules.values()) {
      const ModuleClass = def.metatype;

      // Get Resolvers metadata from Class (dynamic modules merges this?)
      // Note: scanning merged providers/resolvers into container.
      // But we need to identify which are resolvers to register them.

      // Re-read resolver list to register handlers
      let resolvers =
        Reflect.getMetadata(MODULE_METADATA.RESOLVERS, ModuleClass) || [];
      if (this.isDynamicModule(def.ref)) {
        resolvers = [...resolvers, ...(def.ref.resolvers || [])];
      }

      for (const resolverClass of resolvers) {
        const instance = def.container.get(resolverClass);
        const namespace = Reflect.getMetadata(
          RESOLVER_METADATA.NAMESPACE,
          resolverClass,
        );
        const handlers =
          Reflect.getMetadata(RESOLVER_METADATA.HANDLERS, resolverClass) || {};

        for (const [key, meta] of Object.entries(handlers) as [
          string,
          RpcHandlerMetadata,
        ][]) {
          const handlerName = meta.rpcName || key;
          const rpcKey = namespace
            ? `${namespace}.${handlerName}`
            : handlerName;

          this.rpcRegistry.set(rpcKey, {
            handler: meta.handler,
            instance,
            methodName: meta.methodName,
            resolverClass,
          });
        }
      }

      // Initialize Module
      const moduleInstance = def.container.get(ModuleClass);
      if (this.hasLifecycleHook(moduleInstance, 'onModuleInit')) {
        await moduleInstance.onModuleInit();
      }

      // Run OnApplicationBootstrap (could be separate phase)
      if (this.hasLifecycleHook(moduleInstance, 'onApplicationBootstrap')) {
        await moduleInstance.onApplicationBootstrap();
      }
    }
  }

  private static async execute(
    request: RpcRequest,
    context: any = {},
  ): Promise<any> {
    const entry = this.rpcRegistry.get(request.action);
    if (!entry) {
      throw new Error('DEN_HANDLER_NOT_FOUND');
    }

    const { handler, instance, methodName, resolverClass } = entry;

    const paramsMetadata =
      Reflect.getMetadata(RESOLVER_METADATA.PARAMS, resolverClass) || {};
    const methodParams = paramsMetadata[methodName] || [];

    const args: any[] = [];
    const payload = Array.isArray(request.payload)
      ? [...request.payload]
      : [request.payload];

    const paramLength = handler.length;

    for (let i = 0; i < paramLength; i++) {
      const paramMeta = methodParams[i];

      if (paramMeta) {
        if (paramMeta.type === 'context') {
          args.push(context);
        } else if (paramMeta.type === 'custom') {
          const factory = paramMeta.factory;
          const result = factory(paramMeta.data, { context, args: payload });
          args.push(result);
        } else {
          args.push(undefined);
        }
      } else {
        args.push(payload.shift());
      }
    }

    if (paramLength === 0) {
      return handler.apply(
        instance,
        request.payload === undefined
          ? []
          : Array.isArray(request.payload)
            ? request.payload
            : [request.payload],
      );
    }

    return handler.apply(instance, args);
  }

  private static isDynamicModule(module: any): module is DynamicModule {
    return module && module.module;
  }

  private static hasLifecycleHook(
    instance: any,
    hook: string,
  ): instance is any {
    return instance && typeof instance[hook] === 'function';
  }
}
