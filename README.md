# Yasumu

<div align="center">

![Yasumu Logo](./docs/assets/preview.png)

**A modern, free, and open-source API laboratory for designing, testing, and debugging API workflows.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)](LICENSE)
[![Status: Beta](https://img.shields.io/badge/Status-Beta-orange)](https://yasumu.dev)
[![Website](https://img.shields.io/badge/Website-yasumu.dev-green)](https://yasumu.dev)

[Download](https://yasumu.dev/download) • [Documentation](https://docs.yasumu.dev) • [Contributing](CONTRIBUTING.md)

</div>

---

> [!WARNING]
> Yasumu is actively under development. The current version is in a **very early stage** due to which you may encounter **unfinished features, bugs, and inconsistent or low code quality** as we rapidly prototype and iterate. We welcome your feedback, bug reports, and contributions as we work toward a stable and robust release!


## 🚀 Overview

**Yasumu** focuses on developer productivity, performance, and long-term extensibility without vendor lock-in. Built with **Tauri** and **Next.js**, it combines a fast native desktop core with a modern web-based user interface.

It is designed to feel familiar to developers while remaining flexible enough to support advanced and experimental workflows.

## ✨ Key Features

- **🌐 Multi-Protocol Testing**: Unified interface for various API protocols.
- **💾 Git-Friendly Storage**: Configurations stored as `.ysl` files, making version control seamless.
- **⚡ Native Performance**: Powered by a Rust backend (Tauri) for low resource usage.
- **🎨 Modern UI**: Built with Next.js for a responsive developer experience.
- **🤖 Scripting Runtime**: Built-in JS/TS runtime (Deno-based) for automation and scripts.
- **🔓 Open Source**: No artificial feature limitations or mandatory cloud dependencies.

## 📸 Preview

<table>
  <tr>
    <td align="center">
      <img src="./docs/assets/yasumu-home.png" alt="Yasumu Home" style="max-width: 100%; height: auto;" /><br/>
      <sub><b>Workspace Screen</b></sub>
    </td>
    <td align="center">
      <img src="./docs/assets/preview.png" alt="Yasumu Preview" style="max-width: 100%; height: auto;" /><br/>
      <sub><b>Rest Screen</b></sub>
    </td>
  </tr>
</table>

## 📡 Protocol Support

Yasumu aims to support a wide range of protocols.

| Protocol | Status | Notes |
| :--- | :---: | :--- |
| **REST API** | ✅ Ready | Full support for HTTP/HTTPS requests |
| **Catch-all SMTP** | ✅ Ready | Local email server for testing |
| **GraphQL** | 🚧 Soon | Planned |
| **WebSocket** | 🚧 Soon | Planned |
| **Server-Sent Events** | 🚧 Soon | Planned |
| **Socket.IO** | 🚧 Soon | Planned |
| **Plugins API** | 🚧 Soon | Planned |

## 🛠️ How Yasumu Works

Yasumu operates like an **IDE for your APIs**. Instead of storing data in a hidden database or cloud, Yasumu creates a workspace directly within your project's folder.

### 📂 Project-Based Workspace
When you open Yasumu on a project folder, it initializes a `yasumu` directory. API definitions, tests, and workflows are stored here using **Yasumu Schema Language** (`.ysl`) — a custom human-readable format designed for stability and versioning.

### 🤝 Git-Friendly & Collaborative
- **Commit & Push**: Commit the `yasumu` directory with your source code.
- **Collaborate**: Teammates pull changes and see updated workflows immediately.
- **Review**: Diff-friendly text files make code reviews straightforward.
- **Secrets**: Manage sensitive values via environment variables, not version control.

### ⚙️ Hybrid Runtime
The backend runs on **Tauri (Rust)** for system operations and a custom **JS/TS Runtime** (based on `deno_runtime`) for executing scripts and logic.

## 📦 Tech Stack

- **Frontend:** Next.js
- **Desktop Runtime:** Tauri (Rust)
- **Scripting Runtime:** Embedded `deno_runtime` (JS/TS)
- **Platforms:** Windows, Linux, macOS

## 📥 Setup and Installation

Download the latest installer for your OS from the official website:

👉 **[https://yasumu.dev/download](https://yasumu.dev/download)**

## ❤️ Project Philosophy

- **Open-source by default**
- **No vendor lock-in**
- **No artificial paywalls**
- **Developer-first design**
- **Long-term maintainability**

## 📄 License

Yasumu is developed by [Neplex](https://neplextech.com) and is licensed under the **AGPL-3.0** license. See [LICENSE](LICENSE) for details.
