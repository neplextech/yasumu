# Yasumu

Yasumu is a customizable, free and open-source application to test various types of APIs (Lightweight alternative to postman/insomnia/bruno).

> [!NOTE]  
> Yasumu is in active development. It is currently in public preview. You can help us by being a tester. Furthermore, you can join our discord server @ https://discord.yasumu.dev to stay up to date with the latest changes.

## Features Status

The following table shows the status of the features in the project.

| Feature               | Status  |
| --------------------- | ------- |
| REST API              | ⌚      |
| Catch-all SMTP Server | ⌚      |
| GraphQL               | ⌚      |
| WebSocket             | ⌚      |
| Socket.IO             | ⌚      |
| gRPC Testing          | Planned |
| Custom Plugins        | Planned |
| Custom Themes         | Planned |

⌚ We are currently in our 3rd prototype stage.

## About

Yasumu is a free and open-source application to test various types of APIs. It is a lightweight alternative to postman, insomnia, and bruno. Yasumu is built with Tauri, React, and TypeScript.

## Project Structure

### `main` branch

Main branch contains the latest updates and unstable features. This branch is used for development and testing purposes.

### `canary` branch

Canary branch contains relatively stable features and updates after testing on the `main` branch. This branch is used for public testing and feedback, and is released via pre-release builds.

### `release` branch

Release branch contains stable features and updates after testing on the `canary` branch. This branch is used for public release and is released via stable builds. This version is recommended for production use.

## Projects

| ID  | Name                                  | Description                                                              |
| --- | ------------------------------------- | ------------------------------------------------------------------------ |
| 1.  | [`@yasumu/app`](./apps/yasumu)        | The desktop application of Yasumu                                        |
| 2.  | [`@yasumu/core`](./packages/core)     | The core api used by Yasumu's applications across different environments |
| 3.  | [`@yasumu/schema`](./packages/schema) | Yasumu's custom schema definition language                               |
| 4.  | [`tanxium`](./packages/tanxium)       | Yasumu's custom JavaScript runtime                                       |

## Contributing

Contributions are welcome! Please read the [contribution guidelines](CONTRIBUTING.md) before contributing.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Tauri](https://tauri.app/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Shadcn UI](https://ui.shadcn.com/)

## Support

If you like this project, please consider supporting it by starring ⭐ the repository. Additionally, you can support the project by contributing to it or by making a donation.

<a href="https://www.patreon.com/twlite"><img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Become a Patron!" width="200" height="50"></a>

## Contact

For any queries, you can contact the maintainers at [contact@yasumu.dev](mailto:contact@yasumu.dev).

## Core Team

| Name     | Role               | Links                                 |
| -------- | ------------------ | ------------------------------------- |
| Twilight | Project Lead       | [GitHub](https://github.com/twlite)   |
| Zyrouge  | Co-Lead            | [GitHub](https://github.com/zyrouge)  |
| Anish    | Frontend Developer | [GitHub](https://github.com/novanish) |
