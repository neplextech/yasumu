/**
 * A collection's friendly name is defined by this field. You would want to set this field to a value that would allow you to easily identify this collection among a bunch of other collections, as such outlining its usage or content.
 */
export type NameOfTheCollection = string;
/**
 * A Description can be a raw text, or be an object, which holds the description along with its format.
 */
export type Description = Description1 | string | null;
/**
 * Postman allows you to version your collections as they grow, and this field holds the version number. While optional, it is recommended that you use this field to its fullest extent!
 */
export type CollectionVersion =
  | {
      /**
       * Increment this number if you make changes to the collection that changes its behaviour. E.g: Removing or adding new test scripts. (partly or completely).
       */
      major: number;
      /**
       * You should increment this number if you make changes that will not break anything that uses the collection. E.g: removing a folder.
       */
      minor: number;
      /**
       * Ideally, minor changes to a collection should result in the increment of this number.
       */
      patch: number;
      /**
       * A human friendly identifier to make sense of the version numbers. E.g: 'beta-3'
       */
      identifier?: string;
      meta?: unknown;
      [k: string]: unknown;
    }
  | string;
export type Items = Item | Folder;
/**
 * Using variables in your Postman requests eliminates the need to duplicate requests, which can save a lot of time. Variables can be defined, and referenced to from any part of a request.
 */
export type Variable =
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    };
/**
 * Collection variables allow you to define a set of variables, that are a *part of the collection*, as opposed to environments, which are separate entities.
 * *Note: Collection variables must not contain any sensitive information.*
 */
export type VariableList = Variable[];
/**
 * If object, contains the complete broken-down URL for this request. If string, contains the literal request URL.
 */
export type Url =
  | {
      /**
       * The string representation of the request URL, including the protocol, host, path, hash, query parameter(s) and path variable(s).
       */
      raw?: string;
      /**
       * The protocol associated with the request, E.g: 'http'
       */
      protocol?: string;
      host?: Host;
      path?:
        | string
        | (
            | string
            | {
                type?: string;
                value?: string;
                [k: string]: unknown;
              }
          )[];
      /**
       * The port number present in this URL. An empty value implies 80/443 depending on whether the protocol field contains http/https.
       */
      port?: string;
      /**
       * An array of QueryParams, which is basically the query string part of the URL, parsed into separate variables
       */
      query?: QueryParam[];
      /**
       * Contains the URL fragment (if any). Usually this is not transmitted over the network, but it could be useful to store this in some cases.
       */
      hash?: string;
      /**
       * Postman supports path variables with the syntax `/path/:variableName/to/somewhere`. These variables are stored in this field.
       */
      variable?: Variable[];
      [k: string]: unknown;
    }
  | string;
/**
 * The host for the URL, E.g: api.yourdomain.com. Can be stored as a string or as an array of strings.
 */
export type Host = string | string[];
/**
 * Postman allows you to configure scripts to run when specific events occur. These scripts are stored here, and can be referenced in the collection by their ID.
 */
export type EventList = Event[];
/**
 * A request represents an HTTP request. If a string, the string is assumed to be the request URL and the method is assumed to be 'GET'.
 */
export type Request = Request1 | string;
/**
 * A representation for a list of headers
 */
export type HeaderList = Header[];
export type FormParameter =
  | {
      key: string;
      value?: string;
      /**
       * When set to true, prevents this form data entity from being sent.
       */
      disabled?: boolean;
      type?: 'text';
      /**
       * Override Content-Type header of this form data entity.
       */
      contentType?: string;
      description?: Description;
      [k: string]: unknown;
    }
  | {
      key: string;
      src?: unknown[] | string | null;
      /**
       * When set to true, prevents this form data entity from being sent.
       */
      disabled?: boolean;
      type?: 'file';
      /**
       * Override Content-Type header of this form data entity.
       */
      contentType?: string;
      description?: Description;
      [k: string]: unknown;
    };
/**
 * The time taken by the request to complete. If a number, the unit is milliseconds. If the response is manually created, this can be set to `null`.
 */
export type ResponseTime = null | string | number;
/**
 * Set of timing information related to request and response in milliseconds
 */
export type ResponseTimings = {
  [k: string]: unknown;
} | null;
export type Headers = Header1 | string | null;
export type Header2 = string;
/**
 * No HTTP request is complete without its headers, and the same is true for a Postman request. This field is an array containing all the headers.
 */
export type Header1 = (Header | Header2)[];
export type Responses = Response[];
export type Items1 = Item | Folder;

export interface PostmanCollection {
  info: Information;
  /**
   * Items are the basic unit for a Postman collection. You can think of them as corresponding to a single API endpoint. Each Item has one request and may have multiple API responses associated with it.
   */
  item: Items[];
  event?: EventList;
  variable?: VariableList;
  auth?: null | Auth;
  protocolProfileBehavior?: ProtocolProfileBehavior;
  [k: string]: unknown;
}
/**
 * Detailed description of the info block
 */
export interface Information {
  name: NameOfTheCollection;
  /**
   * Every collection is identified by the unique value of this field. The value of this field is usually easiest to generate using a UID generator function. If you already have a collection, it is recommended that you maintain the same id since changing the id usually implies that is a different collection than it was originally.
   *  *Note: This field exists for compatibility reasons with Collection Format V1.*
   */
  _postman_id?: string;
  description?: Description;
  version?: CollectionVersion;
  /**
   * This should ideally hold a link to the Postman schema that is used to validate this collection. E.g: https://schema.getpostman.com/collection/v1
   */
  schema: string;
  [k: string]: unknown;
}
export interface Description1 {
  /**
   * The content of the description goes here, as a raw string.
   */
  content?: string;
  /**
   * Holds the mime type of the raw description content. E.g: 'text/markdown' or 'text/html'.
   * The type is used to correctly render the description when generating documentation, or in the Postman app.
   */
  type?: string;
  /**
   * Description can have versions associated with it, which should be put in this property.
   */
  version?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
/**
 * Items are entities which contain an actual HTTP request, and sample responses attached to it.
 */
export interface Item {
  /**
   * A unique ID that is used to identify collections internally
   */
  id?: string;
  /**
   * A human readable identifier for the current item.
   */
  name?: string;
  description?: Description;
  variable?: VariableList;
  event?: EventList;
  request: Request;
  response?: Responses;
  protocolProfileBehavior?: ProtocolProfileBehavior;
  [k: string]: unknown;
}
/**
 * Defines a script associated with an associated event name
 */
export interface Event {
  /**
   * A unique identifier for the enclosing event.
   */
  id?: string;
  /**
   * Can be set to `test` or `prerequest` for test scripts or pre-request scripts respectively.
   */
  listen: string;
  script?: Script;
  /**
   * Indicates whether the event is disabled. If absent, the event is assumed to be enabled.
   */
  disabled?: boolean;
  [k: string]: unknown;
}
/**
 * A script is a snippet of Javascript code that can be used to to perform setup or teardown operations on a particular response.
 */
export interface Script {
  /**
   * A unique, user defined identifier that can  be used to refer to this script from requests.
   */
  id?: string;
  /**
   * Type of the script. E.g: 'text/javascript'
   */
  type?: string;
  exec?: string[] | string;
  src?: Url;
  /**
   * Script name
   */
  name?: string;
  [k: string]: unknown;
}
export interface QueryParam {
  key?: string | null;
  value?: string | null;
  /**
   * If set to true, the current query parameter will not be sent with the request.
   */
  disabled?: boolean;
  description?: Description;
  [k: string]: unknown;
}
export interface Request1 {
  url?: Url;
  auth?: null | Auth;
  proxy?: ProxyConfig;
  certificate?: Certificate;
  method?:
    | (
        | 'GET'
        | 'PUT'
        | 'POST'
        | 'PATCH'
        | 'DELETE'
        | 'COPY'
        | 'HEAD'
        | 'OPTIONS'
        | 'LINK'
        | 'UNLINK'
        | 'PURGE'
        | 'LOCK'
        | 'UNLOCK'
        | 'PROPFIND'
        | 'VIEW'
      )
    | string;
  description?: Description;
  header?: HeaderList | string;
  body?: {
    /**
     * Postman stores the type of data associated with this request in this field.
     */
    mode?: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql';
    raw?: string;
    graphql?: {
      [k: string]: unknown;
    };
    urlencoded?: UrlEncodedParameter[];
    formdata?: FormParameter[];
    file?: {
      src?: string | null;
      content?: string;
      [k: string]: unknown;
    };
    /**
     * Additional configurations and options set for various body modes.
     */
    options?: {
      [k: string]: unknown;
    };
    /**
     * When set to true, prevents request body from being sent.
     */
    disabled?: boolean;
    [k: string]: unknown;
  } | null;
  [k: string]: unknown;
}
/**
 * Represents authentication helpers provided by Postman
 */
export interface Auth {
  type:
    | 'apikey'
    | 'awsv4'
    | 'basic'
    | 'bearer'
    | 'digest'
    | 'edgegrid'
    | 'hawk'
    | 'ntlm'
    | 'noauth'
    | 'oauth1'
    | 'oauth2';
  noauth?: unknown;
  apikey?: APIKeyAuthentication;
  awsv4?: AWSSignatureV4;
  basic?: BasicAuthentication;
  bearer?: BearerTokenAuthentication;
  digest?: DigestAuthentication;
  edgegrid?: EdgeGridAuthentication;
  hawk?: HawkAuthentication;
  ntlm?: NTLMAuthentication;
  oauth1?: OAuth1;
  oauth2?: OAuth2;
  [k: string]: unknown;
}
/**
 * The attributes for API Key Authentication. e.g. key, value, in.
 */
export interface APIKeyAuthentication {
  [k: string]: unknown;
}
/**
 * The attributes for [AWS Auth](http://docs.aws.amazon.com/AmazonS3/latest/dev/RESTAuthentication.html). e.g. accessKey, secretKey, region, service.
 */
export interface AWSSignatureV4 {
  [k: string]: unknown;
}
/**
 * The attributes for [Basic Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication). e.g. username, password.
 */
export interface BasicAuthentication {
  [k: string]: unknown;
}
/**
 * The attributes for [Bearer Token Authentication](https://tools.ietf.org/html/rfc6750). e.g. token.
 */
export interface BearerTokenAuthentication {
  [k: string]: unknown;
}
/**
 * The attributes for [Digest Authentication](https://en.wikipedia.org/wiki/Digest_access_authentication). e.g. username, password, realm, nonce, nonceCount, algorithm, qop, opaque, clientNonce.
 */
export interface DigestAuthentication {
  [k: string]: unknown;
}
/**
 * The attributes for [Akamai EdgeGrid Authentication](https://developer.akamai.com/legacy/introduction/Client_Auth.html). e.g. accessToken, clientToken, clientSecret, baseURL, nonce, timestamp, headersToSign.
 */
export interface EdgeGridAuthentication {
  [k: string]: unknown;
}
/**
 * The attributes for [Hawk Authentication](https://github.com/hueniverse/hawk). e.g. authId, authKey, algorith, user, nonce, extraData, appId, delegation, timestamp.
 */
export interface HawkAuthentication {
  [k: string]: unknown;
}
/**
 * The attributes for [NTLM Authentication](https://msdn.microsoft.com/en-us/library/cc237488.aspx). e.g. username, password, domain, workstation.
 */
export interface NTLMAuthentication {
  [k: string]: unknown;
}
/**
 * The attributes for [OAuth1](https://oauth.net/1/). e.g. consumerKey, consumerSecret, token, tokenSecret, signatureMethod, timestamp, nonce, version, realm, encodeOAuthSign.
 */
export interface OAuth1 {
  [k: string]: unknown;
}
/**
 * The attributes for [OAuth2](https://oauth.net/2/). e.g. accessToken, addTokenTo.
 */
export interface OAuth2 {
  [k: string]: unknown;
}
/**
 * Using the Proxy, you can configure your custom proxy into the postman for particular url match
 */
export interface ProxyConfig {
  /**
   * The Url match for which the proxy config is defined
   */
  match?: string;
  /**
   * The proxy server host
   */
  host?: string;
  /**
   * The proxy server port
   */
  port?: number;
  /**
   * The tunneling details for the proxy config
   */
  tunnel?: boolean;
  /**
   * When set to true, ignores this proxy configuration entity
   */
  disabled?: boolean;
  [k: string]: unknown;
}
/**
 * A representation of an ssl certificate
 */
export interface Certificate {
  /**
   * A name for the certificate for user reference
   */
  name?: string;
  /**
   * A list of Url match pattern strings, to identify Urls this certificate can be used for.
   */
  matches?: string[];
  /**
   * An object containing path to file containing private key, on the file system
   */
  key?: {
    /**
     * The path to file containing key for certificate, on the file system
     */
    src?: {
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  /**
   * An object containing path to file certificate, on the file system
   */
  cert?: {
    /**
     * The path to file containing key for certificate, on the file system
     */
    src?: {
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  /**
   * The passphrase for the certificate
   */
  passphrase?: string;
  [k: string]: unknown;
}
/**
 * Represents a single HTTP Header
 */
export interface Header {
  /**
   * This holds the LHS of the HTTP Header, e.g ``Content-Type`` or ``X-Custom-Header``
   */
  key: string;
  /**
   * The value (or the RHS) of the Header is stored in this field.
   */
  value: string;
  /**
   * If set to true, the current header will not be sent with requests.
   */
  disabled?: boolean;
  description?: Description;
  [k: string]: unknown;
}
export interface UrlEncodedParameter {
  key: string;
  value?: string;
  disabled?: boolean;
  description?: Description;
  [k: string]: unknown;
}
/**
 * A response represents an HTTP response.
 */
export interface Response {
  /**
   * A unique, user defined identifier that can  be used to refer to this response from requests.
   */
  id?: string;
  originalRequest?: Request;
  responseTime?: ResponseTime;
  timings?: ResponseTimings;
  header?: Headers;
  cookie?: Cookie[];
  /**
   * The raw text of the response.
   */
  body?: null | string;
  /**
   * The response status, e.g: '200 OK'
   */
  status?: string;
  /**
   * The numerical response code, example: 200, 201, 404, etc.
   */
  code?: number;
  [k: string]: unknown;
}
/**
 * A Cookie, that follows the [Google Chrome format](https://developer.chrome.com/extensions/cookies)
 */
export interface Cookie {
  /**
   * The domain for which this cookie is valid.
   */
  domain: string;
  /**
   * When the cookie expires.
   */
  expires?: string | null;
  maxAge?: string;
  /**
   * True if the cookie is a host-only cookie. (i.e. a request's URL domain must exactly match the domain of the cookie).
   */
  hostOnly?: boolean;
  /**
   * Indicates if this cookie is HTTP Only. (if True, the cookie is inaccessible to client-side scripts)
   */
  httpOnly?: boolean;
  /**
   * This is the name of the Cookie.
   */
  name?: string;
  /**
   * The path associated with the Cookie.
   */
  path: string;
  /**
   * Indicates if the 'secure' flag is set on the Cookie, meaning that it is transmitted over secure connections only. (typically HTTPS)
   */
  secure?: boolean;
  /**
   * True if the cookie is a session cookie.
   */
  session?: boolean;
  /**
   * The value of the Cookie.
   */
  value?: string;
  /**
   * Custom attributes for a cookie go here, such as the [Priority Field](https://code.google.com/p/chromium/issues/detail?id=232693)
   */
  extensions?: unknown[];
  [k: string]: unknown;
}
/**
 * Set of configurations used to alter the usual behavior of sending the request
 */
export interface ProtocolProfileBehavior {
  [k: string]: unknown;
}
/**
 * One of the primary goals of Postman is to organize the development of APIs. To this end, it is necessary to be able to group requests together. This can be achived using 'Folders'. A folder just is an ordered set of requests.
 */
export interface Folder {
  /**
   * A folder's friendly name is defined by this field. You would want to set this field to a value that would allow you to easily identify this folder.
   */
  name?: string;
  description?: Description;
  variable?: VariableList;
  /**
   * Items are entities which contain an actual HTTP request, and sample responses attached to it. Folders may contain many items.
   */
  item: Items1[];
  event?: EventList;
  auth?: null | Auth;
  protocolProfileBehavior?: ProtocolProfileBehavior;
  [k: string]: unknown;
}
