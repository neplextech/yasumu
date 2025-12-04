# Yasumu

Yasumu is a modern, free, and open-source API laboratory for designing, testing, and debugging API workflows. It focuses on developer productivity, performance, and long-term extensibility without vendor lock-in.

Built with Tauri and Next.js, Yasumu combines a fast native desktop core with a modern web-based user interface. It is designed to feel familiar to developers while remaining flexible enough to support advanced and experimental workflows.

## Status

Yasumu is currently under active development. Features, APIs, and internal architecture may change as the project evolves toward a stable release.

## Setup and Installation

To get started with Yasumu, download the latest installer for your operating system from the official website:

[https://yasumu.dev/download](https://yasumu.dev/download)

## Protocol Support

Yasumu aims to support a wide range of protocols. Below is the current status of protocol implementation:

| Protocol | Status | Notes |
| :--- | :--- | :--- |
| **REST API** | ✅ Supported | Full support for HTTP/HTTPS requests |
| **Catch-all SMTP** | ✅ Supported | Local email server for testing |
| **GraphQL** | 🚧 Coming Soon | |
| **WebSocket** | 🚧 Coming Soon | |
| **Server-Sent Events (SSE)** | 🚧 Coming Soon | |
| **Socket.IO** | 🚧 Coming Soon | |
| **Plugins API** | 🚧 Coming Soon | |

## Key Features

- **Multi-Protocol Testing**: Unified interface for various API protocols.
- **Git-Friendly Storage**: All configurations are stored in your project as `.ysl` files, making version control and collaboration seamless.
- **Native Performance**: Powered by a Rust backend (Tauri) for low resource usage.
- **Modern UI**: Built with Next.js for a responsive and familiar developer experience.
- **Scripting Runtime**: Built-in JavaScript and TypeScript runtime for pre-request/post-response scripts and automation.
- **Open Source**: Fully open-source with no artificial feature limitations or mandatory cloud dependencies.

## How Yasumu Works

Yasumu operates much like an IDE for your APIs. Instead of storing data in a hidden database or cloud, Yasumu creates a workspace directly within your project's folder.

### Project-Based Workspace

When you open Yasumu on your project folder, it initializes a `yasumu` directory. All your API definitions, tests, and workflows are stored here using **Yasumu Schema Language** (`.ysl`), a custom human-readable format designed for defining Yasumu entities with long-term stability and forward-compatible versioning in mind.

### Git-Friendly & Collaborative

Yasumu does not manage version control itself but is designed to work seamlessly with it. Since all configuration is stored as plain text files in your project directory:

- **Commit & Push**: You commit the `yasumu` directory alongside your source code.
- **Collaborate**: Teammates pull the changes and see the updated API workflows immediately.
- **Review**: Changes to API definitions are visible in diffs, making code reviews for API changes straightforward.
- **Secrets Handling**: Sensitive values such as tokens and API keys should be managed through environment variables rather than committed to version control.

### Hybrid Runtime

The backend architecture runs on a combination of **Tauri** (Rust) for system-level operations and a custom **JS/TS Runtime** (based on `deno_runtime`) for executing scripts and managing the logic defined in your YSL files.

## Built-in Runtime

Yasumu leverages the embedded `deno_runtime` crate to provide a powerful and secure JavaScript and TypeScript environment. This custom runtime implementation includes:

- **Native TypeScript Support**: Run TypeScript code directly without manual compilation.
- **Web Standard APIs**: Access to core Node.js, Deno, and Web APIs.
- **Secure by Default**: Inherits Deno's permission model to ensure scripts run safely.
- **Custom Behaviors**: Tailored extensions specifically for API testing workflows.

This allows developers to:

- Write pre-request and post-response scripts
- Automate API workflows
- Transform request and response data
- Implement custom authentication logic
- Extend core behavior without modifying the application itself

This makes Yasumu suitable not only for API testing, but also for building full API automation pipelines.

## Modular Architecture

Yasumu is designed around a modular architecture where core features are implemented as independent packages.

For a detailed breakdown of the architecture and package structure, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) guide.

## Technology Stack

- **Frontend:** Next.js
- **Desktop Runtime:** Tauri (Rust backend)
- **Scripting Runtime:** Embedded `deno_runtime` (JavaScript & TypeScript)
- **Target Platforms:** Windows, Linux, macOS

## Use Cases

Yasumu is suitable for:

- API development and debugging
- Testing microservices and distributed systems
- Real-time API experimentation
- Building automated API test flows
- Team-based API collaboration
- Internal tooling and integration testing

## Project Philosophy

Yasumu is built with the following principles in mind:

- Open-source by default
- No vendor lock-in
- No artificial paywalls on core functionality
- Developer-first design
- Long-term maintainability over short-term trends

## License

Yasumu is developed and maintained by [Neplex](https://neplextech.com) and is licensed under the GPL-3.0 license. See the [LICENSE](LICENSE) file for more information.
