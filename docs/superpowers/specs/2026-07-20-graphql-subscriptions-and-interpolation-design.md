# GraphQL subscriptions and universal interpolation

## Goals

Add GraphQL subscription execution over the standard `graphql-transport-ws`
protocol. Make every request-authoring input interpolation-aware and provide
consistent `{{VARIABLE}}` completion. Restore a usable editing area for the
GraphQL Variables JSON editor and ensure GraphQL bodies and variables use the
canonical typed interpolation path before execution.

## Architecture

The headless request layer remains the owner of request construction and
interpolation. It will identify the selected GraphQL operation, interpolate the
URL, headers, query document, and typed variables once, and construct either
the existing HTTP request for queries/mutations or a generic subscription
transport request for subscriptions. The UI adapts that generic lifecycle to
its response state and cancellation controls; it does not implement duplicate
interpolation or protocol policy.

Subscriptions use `graphql-transport-ws`. Connection parameters are derived
from the interpolated headers, each `next` payload is published to the request
state, protocol errors become normal execution failures, and cancellation or
unmount disposes the subscription and closes the socket.

## Interpolation experience

A shared interpolation adapter supplies variable suggestions, trigger/range
calculation, insertion, and the existing interpolation affordance. It supports
plain inputs, textareas, key-value table cells, and Monaco-backed editors.
Every request editor field that accepts authored request data adopts this
adapter: URLs, parameters, headers, authentication fields, bodies, GraphQL
variables, and relevant generator/import fields. Existing supported fields keep
their behavior while gaining completion.

For Monaco editors, completion is registered alongside language completion and
returns the same environment variable and secret options as regular inputs.
The GraphQL Variables editor uses a flex/minimum-height layout so Monaco is
visible and can be edited normally.

## Data flow and error handling

JSON parsing occurs before structured execution and typed whole-value
interpolation remains intact: a JSON value consisting solely of `{{NAME}}`
preserves the referenced value's primitive/object type. Missing interpolation
references return the existing structured interpolation error. Subscription
connection, protocol, and transport errors are surfaced through the current
GraphQL response/error state without hiding the last received payload.

## Validation

Add focused tests for operation classification and HTTP/subscription routing,
subscription cleanup/error handling, and typed interpolation of GraphQL bodies
and variables. Verify UI behavior for the variable editor layout and
autocomplete integration with existing frontend tests or component-level
coverage where available. Update GraphQL documentation with subscription
transport behavior and interpolation examples.
