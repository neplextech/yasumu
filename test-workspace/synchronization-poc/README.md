# Synchronization POC

This directory contains a proof of concept for the synchronization feature. It contains the file structure of the yasumu workspace.

## File Structure

```
synchronization-poc/
├── yasumu/
│   ├── yasumu-lock.json # The lockfile that tracks the state
│   ├── workspace.ysl # The workspace file
│   ├── smtp.ysl # The smtp config
│   ├── rest/rest-id.ysl # The rest entities
│   ├── environment/env-id.ysl # The environments
```

## What is the purpose of this synchronization?

Yasumu is designed to be a collaborative tool. It is designed to be used by a team of developers to collaborate on the same workspace. The workspace contents are committed to the git repository and another person opening the repo inside yasumu must see the same workspace contents as the original developer. If developer B makes changes to the workspace, developer A must be able to see the changes and vice versa.

The problem lies if both developer A and developer B make changes to the workspace at the same time. The `lockfile` is used to track the state of each entity in the workspace in order to prevent conflicts.

To do this, we need to track the state of the entities in the database as well as the file system.