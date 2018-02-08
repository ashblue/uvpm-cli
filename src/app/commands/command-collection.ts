import { Command } from 'commander';
import { CmdHelloWord } from './hello-world/hello-world.cmd';
import { CmdBase } from './base/base.cmd';

import pjson = require('pjson');
import * as process from 'process';
import * as inquirer from 'inquirer';
import { CmdInit } from './generators/init/init.cmd';
import { CmdServer } from './authentication/server/server.cmd';

export class CommandCollection {
  public commandInstances: CmdBase[] = [];
  private commands: Array<{ new (program: Command, inq: inquirer.Inquirer): CmdBase }> = [
    CmdHelloWord,
    CmdInit,
    CmdServer,
  ];

  constructor (private program: Command, private inq: inquirer.Inquirer) {
    this.setCliDetails();

    this.commands.forEach((c) => {
      this.commandInstances.push(new c(program, this.inq));
    });
  }

  /**
   * Trigger to activate reading arguments
   */
  /* istanbul ignore next: crashes test runner */
  public listen () {
    this.program.parse(process.argv);
  }

  private setCliDetails () {
    this.program
      .version(pjson.version)
      .description('UV Package Manager commands to interact with the server');
  }
}
