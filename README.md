# Silex Desktop

![](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E) ![](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=8ce6f8) ![](https://img.shields.io/badge/Electron-22252f?style=for-the-badge&logo=electron&logoColor=white) ![](https://img.shields.io/badge/ESLint-4b32c3?style=for-the-badge&logo=eslint&logoColor=white) ![](https://img.shields.io/badge/Prettier-c188c1?style=for-the-badge&logo=prettier&logoColor=white)

<img align="right" width="100" height="100" src="./img/silex_electron_logo.png">

Silex desktop is the Electron application that serves all the frontend apps of the pipeline.

## Introduction

In order to access the filesystem and other OS specific features that are hidden in the browser, we use Electron.

Electron is a chromium based browser and enables us to package the frontend applications of the pipeline into a single desktop app for users.

We also have [silex-socket-service](https://github.com/ArtFXDev/silex-socket-service) as a dependency so the socket server is started automatically on startup.

## Installation

The package manager used is [Yarn](https://yarnpkg.com/). Clone the repository and install the dependencies:

```bash
$ git clone https://github.com/ArtFXDev/silex-desktop
$ cd silex-desktop
$ yarn install # Install the dependencies
```

## Usage

### Available scripts

- 🚀 `yarn start` -> Opens an instance of the Electron app

## Libraries

Here are the main libraries and packages used:

| Library                                 | Version  |
| --------------------------------------- | -------- |
| [Electron](https://www.electronjs.org/) | `13.5.2` |

## Contributing

Pull requests and issues are welcome. For major changes, please open an issue first to discuss what you would like to change.

✨ This project uses the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) convention for commit messages. They are checked automatically with a git hook (thanks to [Husky](https://typicode.github.io/husky/#/) and [commitlint](https://github.com/conventional-changelog/commitlint)).

## License

[MIT](./LICENSE.md) [@ArtFX](https://artfx.school/)
