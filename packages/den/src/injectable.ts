import { Service } from 'typedi';

/**
 * Marks a class as a injectable service.
 */
export function Injectable(): ClassDecorator {
  return (target) => {
    Service()(target);
  };
}
