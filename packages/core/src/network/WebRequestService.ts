import type { YasumuWorkspace } from '../YasumuWorkspace.js';
import {
  InteractiveWebRequest,
  type InteractiveWebRequestConfig,
} from './InteractiveWebRequest.js';

export class WebRequestService {
  public constructor(public readonly workspace: YasumuWorkspace) {}

  public create(config: InteractiveWebRequestConfig) {
    return new InteractiveWebRequest(this, config);
  }
}
