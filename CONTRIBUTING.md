# Contributing to Yasumu

We appreciate your interest in contributing to Yasumu! Whether you're fixing bugs, adding new features, improving documentation, or anything else, your contributions are valuable. Follow the steps below to set up your development environment and start contributing.

## Getting Started

### 1. Clone the Repository

Begin by cloning the Yasumu repository to your local machine. This will create a local copy of the project where you can work on your contributions.

```sh
git clone https://github.com/neplextech/yasumu.git
```

### 2. Navigate to the Project Directory

Once the repository is cloned, change into the project directory.

```sh
cd yasumu
```

### 3. Install Dependencies

Before working on the project, you will need to install all necessary dependencies. Yasumu uses Yarn v4 as its package manager. Run the following command to install dependencies:

```sh
yarn install
```

This will install all the required packages and dependencies specified in the `package.json` file. Make sure you have [Yarn](https://yarnpkg.com/getting-started/install) installed on your machine before proceeding.

### 4. Build the Project

Yasumu is structured as a multi-package repository (monorepo), meaning it contains several packages. You need to build the project before running it. Building ensures that all source files are compiled and ready for execution.

```sh
yarn build
```

The build process compiles the TypeScript files and ensures everything is in sync across packages. If you make any changes to the source code, be sure to run this command again to reflect those updates.

### 5. Run the Yasumu Application

To start the Yasumu application, use the following command:

```sh
yarn workspace @yasumu/app app
```

This command runs the application located in the `@yasumu/app` workspace, which is the main application of the Yasumu project.

## Running Tests

To ensure that everything works correctly, you should run the test suite. Yasumu has a set of automated tests to maintain code quality and catch potential issues. To run the tests, use:

```sh
yarn test
```

This will execute all the unit tests and report any errors. Make sure to run the tests after making changes to ensure that your contribution doesn’t break existing functionality.

## Code Style and Linting

Yasumu follows specific code formatting and linting rules to maintain a clean and readable codebase. Please make sure that your code adheres to these standards.

To check for linting errors and automatically fix them (where possible), run:

```sh
yarn lint --fix
```

This will run ESLint on the project and fix any auto-fixable issues. Be sure to fix any remaining linting errors manually before submitting your changes.

## Submitting a Pull Request

Once you've made your changes, you're ready to submit a pull request (PR). Follow these steps:

1. **Create a New Branch**  
   It's a good practice to create a new branch for each feature or bug fix you work on. Use descriptive branch names that explain the purpose of the branch, e.g., `fix-bug-123` or `feature-new-component`.

   ```sh
   git checkout -b feature/your-feature-name
   ```

2. **Commit Your Changes**  
   Make sure your commit messages are descriptive and follow conventional commit guidelines (e.g., `feat: add new feature`, `fix: resolve issue with something`). You can take a look at [Conventional Commits](https://www.conventionalcommits.org/) for more information.

   ```sh
   git add .
   git commit -m "feat: add feature X"
   ```

3. **Push the Changes to Your Fork**  
   Push your branch to your forked repository.

   ```sh
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request**  
   Go to the Yasumu repository on GitHub and open a new pull request. Provide a detailed description of your changes, the problem you're solving, and any additional context that may be helpful.

   Once the PR is submitted, it will be reviewed by the maintainers. If any changes are requested, please address them in a timely manner to help get your contribution merged quickly. You will be prompted to accept our Contributor License Agreement (CLA) before your PR can be merged.

## Additional Resources

- **Documentation**: Ensure you're familiar with the [Yasumu documentation](https://docs.yasumu.dev) to understand how the system works and where your contributions will fit.
- **Issue Tracker**: If you're unsure what to work on, check the open issues on the [GitHub Issue Tracker](https://github.com/neplextech/yasumu/issues). Feel free to claim any issue or start a discussion if you need more clarification.
- **Coding Guidelines**: Make sure to review the project's coding standards and best practices to ensure consistency across the codebase.

## Need Help?

If you have any questions, feel free to reach out by opening an issue or joining the discussion in the project's community forum or [Discord](https://discord.yasumu.dev) server.

We look forward to your contributions!
