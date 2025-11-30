import { Container } from 'typedi';
import type {
  Type,
  DenApplication,
  RpcRequest,
  ModuleOptions,
  DynamicModule,
  RpcHandlerMetadata,
} from './interfaces.js';
import { MODULE_METADATA, RESOLVER_METADATA } from './constants.js';

interface RpcRegistryEntry {
  handler: Function;
  instance: any;
  methodName: string;
  resolverClass: any;
}

export class DenFactory {
  private static rpcRegistry = new Map<string, RpcRegistryEntry>();
  private static initializedModules = new Set<any>();
  private static moduleInstances: any[] = [];

  // Note: In this simplified implementation using TypeDI, services are singletons in the global container by default.
  // However, strictly following NestJS module isolation would require separate child containers.
  // Given the current setup, exports/imports are mostly for initialization order and structure,
  // as TypeDI container is global.
  // To support @Global(), we mostly just need to ensure global modules are initialized.

  static async create(rootModule: Type<any>): Promise<DenApplication> {
    // Reset state
    this.rpcRegistry.clear();
    this.initializedModules.clear();
    this.moduleInstances = [];

    // Initialize modules
    await this.initializeModule(rootModule);

    // Trigger OnApplicationBootstrap
    for (const instance of this.moduleInstances) {
      if (this.hasLifecycleHook(instance, 'onApplicationBootstrap')) {
        await instance.onApplicationBootstrap();
      }
    }

    return {
      execute: (req, ctx) => this.execute(req, ctx),
      close: async () => {
        for (const instance of this.moduleInstances) {
          if (this.hasLifecycleHook(instance, 'onApplicationShutdown')) {
            await instance.onApplicationShutdown();
          }
        }

        for (const instance of this.moduleInstances) {
          if (this.hasLifecycleHook(instance, 'onModuleDestroy')) {
            await instance.onModuleDestroy();
          }
        }
      },
    };
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

    // Get parameters metadata
    const paramsMetadata =
      Reflect.getMetadata(RESOLVER_METADATA.PARAMS, resolverClass) || {};
    const methodParams = paramsMetadata[methodName] || [];

    // Construct arguments
    const args: any[] = [];
    const payload = Array.isArray(request.payload)
      ? [...request.payload]
      : [request.payload];

    const paramLength = handler.length;

    // If we have decorators, we need to iterate through all parameters index
    // and construct args array using either the decorator factory or payload items.
    // If a parameter has NO decorator, it should consume from payload.

    // IMPORTANT: The issue with previous loop was simpler logic.
    // Now with custom decorators, we might consume payload differently or not at all.
    // Standard logic:
    // - Decorated param -> use decorator logic (doesn't consume payload usually, unless decorator extracts from args)
    // - Undecorated param -> consume next payload item

    for (let i = 0; i < paramLength; i++) {
      const paramMeta = methodParams[i];

      if (paramMeta) {
        if (paramMeta.type === 'context') {
          // Backwards compat or specific optimization
          args.push(context);
        } else if (paramMeta.type === 'custom') {
          // Custom decorator
          const factory = paramMeta.factory;
          const result = factory(paramMeta.data, { context, args: payload });
          args.push(result);
        } else {
          // Unknown type, fallback
          args.push(undefined);
        }
      } else {
        // Undecorated: consume next payload item
        args.push(payload.shift());
      }
    }

    // If there are no params defined but we have payload, we can try to apply it directly?
    // Or if the loop finished but we still have payload (e.g. rest args)
    // But we are using decorators which usually implies fixed args.
    // If paramLength is 0, we just pass payload spread as before.

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

  private static async initializeModule(moduleRef: Type<any> | DynamicModule) {
    let ModuleClass: Type<any>;
    let dynamicMetadata: Partial<ModuleOptions> = {};

    if (this.isDynamicModule(moduleRef)) {
      ModuleClass = moduleRef.module;
      dynamicMetadata = moduleRef; // Contains providers, imports, etc.
    } else {
      ModuleClass = moduleRef;
    }

    if (this.initializedModules.has(ModuleClass)) return;
    this.initializedModules.add(ModuleClass);

    // Get metadata from decorator
    const imports = [
      ...(Reflect.getMetadata(MODULE_METADATA.IMPORTS, ModuleClass) || []),
      ...(dynamicMetadata.imports || []),
    ];

    // 1. Initialize Imports (DFS)
    // We do this FIRST to ensure dependencies are ready
    for (const importedModule of imports) {
      await this.initializeModule(importedModule);
    }

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

    const isGlobal = Reflect.getMetadata(MODULE_METADATA.GLOBAL, ModuleClass);

    // 2. Register Providers
    for (const provider of providers) {
      Container.get(provider);
    }

    // 3. Register Resolvers
    for (const resolverClass of resolvers) {
      const instance = Container.get(resolverClass);
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
        const rpcKey = namespace ? `${namespace}.${handlerName}` : handlerName;

        this.rpcRegistry.set(rpcKey, {
          handler: meta.handler,
          instance,
          methodName: meta.methodName,
          resolverClass,
        });
      }
    }

    // 4. Instantiate Module and run OnModuleInit
    const moduleInstance = Container.get(ModuleClass);
    this.moduleInstances.push(moduleInstance);

    if (this.hasLifecycleHook(moduleInstance, 'onModuleInit')) {
      await moduleInstance.onModuleInit();
    }
  }

  private static isDynamicModule(module: any): module is DynamicModule {
    return module && module.module;
  }

  private static hasLifecycleHook(
    instance: any,
    hook: string,
  ): instance is any {
    return typeof instance[hook] === 'function';
  }
}
