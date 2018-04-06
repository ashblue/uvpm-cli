# uvpm-cli

A CLI for interacting with an Ultra-Violet Package Manger server.

[![Build Status](https://travis-ci.org/ashblue/uvpm-cli.svg?branch=master)](https://travis-ci.org/ashblue/uvpm-cli)
[![codecov](https://codecov.io/gh/ashblue/uvpm-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/ashblue/uvpm-cli)

## Installation

TBD

## Example Workflow

Navigate to the repo you wish to use UVPM with. Then run the following commands to get started.

```bash
# Set the server where you've setup a UVPM installation
uvpm server SERVER_BASE_URL

# Login to the server for an authentication token
uvpm login

# Create a uvpm.json file for configuration
uvpm init

# Install a particular package as a dependency
uvpm install MY_PACKAGE
```

## Commands

A list of all supported commands. You can also type `uvpm --help` for additional documentation.

### Authentication

#### Login

Attempt to authenticate a user and store login credentials.

```bash
uvpm login
```

### Generators

#### init

Generates a `uvpm.json` file from where the command is run. Automatically fails if a file already exists.

```bash
uvpm init
```

## Testing

### Linking local repo for global testing

1. Clone this repo
1. Navigate to the root
1. Run `npm link` to globally link the repo
1. Run `npm unlink` to unlink the repo
