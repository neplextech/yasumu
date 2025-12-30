# Yasumu

<div align="center">

![Yasumu Logo](./docs/assets/preview.png)

**The modern, open-source API laboratory for designing, testing, and debugging workflows.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)](LICENSE)
[![Status: Beta](https://img.shields.io/badge/Status-Beta-orange)](https://yasumu.dev)
[![Website](https://img.shields.io/badge/Website-yasumu.dev-green)](https://yasumu.dev)

[Download](https://yasumu.dev/download) • [Documentation](https://docs.yasumu.dev) • [Contributing](CONTRIBUTING.md)

</div>

---

> [!IMPORTANT]
> **Yasumu is currently in active Beta.**
> We are rapidly prototyping and iterating. While the core is functional, you may encounter unfinished features or bugs. We highly value your feedback and contributions as we polish the experience toward a stable v1.0 release!

## 🚀 Overview

**Yasumu** is built for developer productivity, speed, and freedom. By combining the native performance of a **Rust/Tauri** backend with a responsive **Next.js** frontend, Yasumu offers a best-in-class local development experience without vendor lock-in.

It feels like the tools you already know, but with the flexibility to handle complex, experimental workflows directly in your file system.

## ✨ Why Yasumu?

* **💾 Git-Native Workflows**: Save collections as human-readable `.ysl` files. Version control your API tests alongside your code—no more syncing conflicts.
* **⚡ Native Performance**: Engineered with Rust and Tauri for a lightweight footprint and instant startup times.
* **🤖 Deno-Powered Scripting**: Write pre-request and automation scripts using a built-in, secure TypeScript/JavaScript runtime.
* **🌐 Universal Protocol Support**: A unified interface for REST, SMTP, and (soon) WebSockets and GraphQL.
* **🔓 Truly Open Source**: No paywalls, no "pro" features hidden behind cloud subscriptions, and no mandatory login.

## 📸 Interface

<table>
  <tr>
    <td align="center">
      <img src="./docs/assets/yasumu-home.png" alt="Yasumu Workspace" style="max-width: 100%; height: auto;" /><br/>
      <sub><b>Project Workspace</b></sub>
    </td>
    <td align="center">
      <img src="./docs/assets/preview.png" alt="Yasumu REST Client" style="max-width: 100%; height: auto;" /><br/>
      <sub><b>REST Client</b></sub>
    </td>
  </tr>
</table>

## 📡 Protocol Support

Yasumu is evolving to become a protocol-agnostic powerhouse.

| Protocol | Status | Notes |
| :--- | :---: | :--- |
| **REST API** | ✅ Ready | Full HTTP/HTTPS request support |
| **Catch-all SMTP** | ✅ Ready | Integrated local email server for testing |
| **GraphQL** | 🚧 Soon | In development |
| **WebSocket** | 🚧 Soon | In development |
| **Server-Sent Events** | 🚧 Soon | In development |
| **Socket.IO** | 🚧 Soon | In development |

## 🛠️ Concepts & Workflow

Yasumu acts as an **IDE for your API interactions**. Unlike tools that hide data in proprietary databases or cloud silos, Yasumu lives in your repo.

### 1. Project-Based Workspaces
When you initialize Yasumu in a project, it creates a `yasumu` directory. Your definitions, tests, and workflows are stored here using the **Yasumu Schema Language (.ysl)**—a custom format designed for readability and clean git diffs.

### 2. Collaboration via Git
* **Commit & Push:** Treat your API collections as code.
* **Review:** `.ysl` files are text-based, making Pull Request reviews easy.
* **Sync:** Teammates simply pull the branch to get the latest API workflows.
* **Secure:** Sensitive secrets are managed via local environment variables, never committed to version control.

### 3. Hybrid Runtime
The core system runs on **Tauri (Rust)** for OS-level operations, while logic and scripting utilize a custom embedded `deno_runtime`, giving you a modern TypeScript environment for automation.

## 📦 Tech Stack

* **Frontend:** Next.js (React)
* **Desktop Engine:** Tauri (Rust)
* **Scripting Engine:** Embedded `deno_runtime`
* **Cross-Platform:** Windows, Linux, macOS

## 📥 Installation

Get the latest installer for your operating system:

👉 **[Download Yasumu](https://yasumu.dev/download)**

## ❤️ Philosophy

* **Open Source by Default:** Transparency builds trust.
* **Zero Vendor Lock-in:** Your data belongs to you, on your disk.
* **Developer Experience First:** Fast, beautiful, and keyboard-friendly.
* **Sustainability:** Built for long-term maintainability over hype.

## 📄 License

Yasumu is developed by [Neplex](https://neplextech.com) and is licensed under the **AGPL-3.0**. See [LICENSE](LICENSE) for details.
