import type { Type } from '../types.js';

export type Token<T = any> = Type<T> | string | symbol;

export interface ClassProvider<T = any> {
  provide: Token<T>;
  useClass: Type<T>;
  scope?: Scope;
}

export interface ValueProvider<T = any> {
  provide: Token<T>;
  useValue: T;
}

export interface FactoryProvider<T = any> {
  provide: Token<T>;
  useFactory: (...args: any[]) => T;
  inject?: Token<any>[];
  scope?: Scope;
}

export type Provider<T = any> =
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | Type<T>;

export enum Scope {
  DEFAULT = 0,
  TRANSIENT = 1,
  REQUEST = 2,
}

export interface InjectableOptions {
  scope?: Scope;
}
