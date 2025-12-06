import type {
  Token,
  Provider,
  ClassProvider,
  FactoryProvider,
  ValueProvider,
} from './types.js';
import {
  INJECT_METADATA,
  DESIGN_PARAMTYPES,
  OPTIONAL_METADATA,
} from '../constants.js';
import type { Type } from '../interfaces.js';

export class Container {
  private providers = new Map<Token, Provider>();
  private instances = new Map<Token, any>();
  // Map of imported container -> Set of exported tokens
  private imports = new Map<Container, Set<Token>>();

  constructor(private readonly name: string = 'Container') {}

  public addProvider(provider: Provider) {
    if (this.isType(provider)) {
      this.providers.set(provider, {
        provide: provider,
        useClass: provider,
      } as ClassProvider);
    } else {
      this.providers.set(provider.provide, provider);
    }
  }

  public addImport(container: Container, exportedTokens: Set<Token>) {
    this.imports.set(container, exportedTokens);
  }

  public get<T = any>(token: Token<T>): T {
    // 1. Check local cache
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    // 2. Check local providers
    if (this.providers.has(token)) {
      const provider = this.providers.get(token)!;
      const instance = this.instantiate(provider);
      // TODO: Handle Scope here (if Transient, don't cache)
      this.instances.set(token, instance);
      return instance;
    }

    // 3. Check imports
    for (const [container, exports] of this.imports) {
      if (exports.has(token)) {
        try {
          return container.get(token);
        } catch (e) {
          continue;
        }
      }
    }

    throw new Error(
      `No provider for ${this.getTokenName(token)} in ${this.name}`,
    );
  }

  public has(token: Token): boolean {
    if (this.instances.has(token) || this.providers.has(token)) {
      return true;
    }
    for (const [container, exports] of this.imports) {
      if (exports.has(token)) {
        return true; // We assume if it's exported, it exists in that container
      }
    }
    return false;
  }

  private instantiate<T>(provider: Provider<T>): T {
    if (this.isValueProvider(provider)) {
      return provider.useValue;
    }

    if (this.isFactoryProvider(provider)) {
      const inject = provider.inject || [];
      const args = inject.map((token) => this.get(token));
      return provider.useFactory(...args);
    }

    if (this.isClassProvider(provider)) {
      const Target = provider.useClass;
      const params = this.getInjectedParams(Target);
      const args = params.map((param: { token: Token; optional: boolean }) =>
        this.resolveParam(param),
      );

      const instance = new Target(...args);
      this.resolvePropertyInjections(instance, Target);
      return instance;
    }

    // Should be unreachable if providers are normalized
    const tokenName = this.isType(provider)
      ? provider.name
      : (provider as any).provide.toString();
    throw new Error(`Invalid provider definition for ${tokenName}`);
  }

  private resolveParam(param: { token: Token; optional: boolean }) {
    try {
      return this.get(param.token);
    } catch (error) {
      if (param.optional) {
        return undefined;
      }
      throw error;
    }
  }

  private getInjectedParams(target: Type<any>) {
    const paramTypes = Reflect.getMetadata(DESIGN_PARAMTYPES, target) || [];
    const injectParams = Reflect.getMetadata(INJECT_METADATA, target) || {};
    const optionalParams = Reflect.getMetadata(OPTIONAL_METADATA, target) || {};

    return paramTypes.map((type: any, index: number) => {
      const token = injectParams[index] || type;
      const optional = !!optionalParams[index];
      return { token, optional };
    });
  }

  private resolvePropertyInjections(instance: any, target: Type<any>) {
    // Placeholder for property injection logic if we support it
    // We would iterate over keys metadata and inject
  }

  private getTokenName(token: Token): string {
    if (typeof token === 'function') return token.name;
    return token.toString();
  }

  private isType<T>(provider: Provider<T>): provider is Type<T> {
    return typeof provider === 'function';
  }

  private isValueProvider<T>(
    provider: Provider<T>,
  ): provider is ValueProvider<T> {
    return (provider as ValueProvider<T>).useValue !== undefined;
  }

  private isFactoryProvider<T>(
    provider: Provider<T>,
  ): provider is FactoryProvider<T> {
    return (provider as FactoryProvider<T>).useFactory !== undefined;
  }

  private isClassProvider<T>(
    provider: Provider<T>,
  ): provider is ClassProvider<T> {
    return (provider as ClassProvider<T>).useClass !== undefined;
  }
}
