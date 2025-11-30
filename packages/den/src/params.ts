import { RESOLVER_METADATA } from './constants.js';

export type ExecutionContext = {
  context: any;
  args: any[];
};

export type CustomParamFactory = (data: any, ctx: ExecutionContext) => any;

export function createParamDecorator(
  factory: CustomParamFactory,
): (data?: any) => ParameterDecorator {
  return (data?: any) =>
    (
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) => {
      if (!propertyKey) return;
      const params =
        Reflect.getMetadata(RESOLVER_METADATA.PARAMS, target.constructor) || {};
      const methodParams = params[propertyKey] || [];

      methodParams[parameterIndex] = {
        type: 'custom',
        index: parameterIndex,
        factory,
        data,
      };

      params[propertyKey] = methodParams;
      Reflect.defineMetadata(
        RESOLVER_METADATA.PARAMS,
        params,
        target.constructor,
      );
    };
}
