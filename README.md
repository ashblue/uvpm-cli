# uvpm-cli

A CLI for interacting with an Ultra-Violet Package Manger server.

[![Build Status](https://travis-ci.org/ashblue/uvpm-cli.svg?branch=master)](https://travis-ci.org/ashblue/uvpm-cli)
[![codecov](https://codecov.io/gh/ashblue/uvpm-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/ashblue/uvpm-cli)

## Getting Started

1. Install [Node.js](https://nodejs.org)
1. Get a [UVPM Server](https://github.com/ashblue/uvpm-server) domain or set one up yourself

Simply run the following command to install the CLI globally.

```bash
npm install -g uvpm-cli
```

### Example Workflow

Navigate to the repo you wish to use UVPM with. Then run the following commands to get started from you CLI.

```bash
# Set the server where you've setup a UVPM installation
uvpm server ROUTE_TO_YOUR_UVPM_SERVER

# Login to the server for an authentication token
uvpm login

# Create a uvpm.json file for configuration
uvpm init

# Install a particular package as a dependency and write it to the config
uvpm install MY_PACKAGE --save

# Publish the package for other packages to use
uvpm publish

# Search for the recently published package with fuzzy searching
search MY_PACKAGE
```

## Commands

A list of all supported commands. You can also type `uvpm --help` for additional documentation.

### Dependency Management

#### Install

Add a package to your project and update the `uvpm.json` file.

```bash
uvpm install YOUR_PACKAGE_NAME --save
```

#### Uninstall

Remove a package from your project and update the `uvpm.json` file.

```bash
uvpm uninstall YOUR_PACKAGE_NAME --save
```

#### Search Published Packages

Prints a listing of all available versions based upon a fuzzy search.

```bash
uvpm search YOUR_PACKAGE_NAME
```

#### View a package

View a published package with all associated versions.

```bash
uvpm view YOUR_PACKAGE_NAME
```

#### Clearing the cache

Sometimes the cache might become corrupted or you unpublished a package somewhere so its no longer accurate.
Dump it with the following command.

```bash
uvpm cache-clear
```

### Authentication

#### Set the server

Set the current server URL for HTTP calls. Required for most commands.

```bash
uvpm server http://MY_SERVER.com
```

#### Login

Attempt to authenticate a user and store login credentials.

```bash
uvpm login
```

#### Logout

De-authenticate the current user.

```bash
uvpm logout
```

#### Register

Attempt to register a user (does not log you in).

```bash
uvpm register
```

#### Who Am I

Print the currently authenticated user.

```bash
uvpm whoami
```

### Publishing

#### Increment Version

Increment the current version in your `uvpm.json` file based upon the [Semver](https://semver.org/) specification.

```bash
uvpm version [minor|major|patch]
```

#### Publish

Publish your current repository based upon your `uvpm.json` configurations.

```bash
uvpm publish
```

#### Unpublish

Unpublish your current repository based upon your `uvpm.json` configurations.

```bash
uvpm unpublish MY_PACKAGE_NAME
# or
uvpm unpublish MY_PACKAGE_NAME SPECIFIC_VERSION
```

### Generators

#### init

Generates a `uvpm.json` file from where the command is run. Automatically fails if a file already exists.

```bash
uvpm init
```

## Development

If you wish to further develop this code here's how.

Run `npm run start` to actively recompile while developing.

### Running tests

Run `npm run test` to run the testing environment.

### Linking local repo for global testing

You might want to globally uninstall your UVPM CLI before trying this.

1. Clone this repo
1. Navigate to the root
1. Run `npm link` to globally link the repo
1. You can now run `uvpm [COMMAND]` statements against your development code
1. Run `npm run build` whenever you want the CLI to have a latest copy of the source
1. Run `npm unlink` to unlink the repo
