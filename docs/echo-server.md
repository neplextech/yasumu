# Echo Server Documentation

The Tanxium Echo Server is a robust utility for testing HTTP clients,
similar to Postman Echo or Bruno's echo service. It is built using
[Hono](https://hono.dev/).

## Base Usage

The echo server intercepts requests to **any path** (except specific
helper paths) and returns a JSON response containing details about the
request you sent.

### Request

You can send `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, or any other
HTTP method to any path.

**Example:**

```http
POST /any/path?foo=bar
Host: echo.yasumu.local
Content-Type: application/json

{ "key": "value" }
```

### Response structure

The server responds with a JSON object:

```json
{
  "url": "http://echo.yasumu.local/any/path?foo=bar",
  "path": "/any/path",
  "method": "POST",
  "headers": {
    "host": "echo.yasumu.local",
    "content-type": "application/json",
    ...
  },
  "args": {
    "foo": "bar"
  },
  "cookies": {},
  "body": {
    "key": "value"
  },
  "json": {
    "key": "value"
  },
  "form": null,
  "files": {},
  "data": null,
  "meta": {
    "timestamp": "2023-12-23T12:00:00.000Z",
    "source": "tanxium-echo-server"
  }
}
```

## Simulation Parameters

You can add specific query parameters to any request to simulate
server behaviors.

### Latency (`?delay=ms`)

Adds a delay before the server responds.

```http
GET /test?delay=2000
```

_Waits 2000ms (2 seconds) before responding._

### Status Codes (`?status=code`)

Forces the server to respond with a specific HTTP status code.

```http
GET /test?status=404
```

_Returns 404 Not Found._

### Rejection (`?reject=true`)

Simulates a server error (HTTP 500) immediately.

```http
GET /test?reject=true
```

_Returns 500 Internal Server Error._

## Helper Endpoints

### IP Address

Returns the client IP address.

```http
GET /ip
```

### Basic Auth

Checks for Basic Authentication headers.

```http
GET /basic-auth
Authorization: Basic <base64_credentials>
```

### Bearer Auth

Checks for Bearer Token headers.

```http
GET /bearer-auth
Authorization: Bearer <token>
```
