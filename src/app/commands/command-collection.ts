import { Command } from 'commander';
import { CmdHelloWord } from './hello-world/hello-world.cmd';
import { CmdBase } from './base/base.cmd';

import pjson = require('pjson');
import * as process from 'process';
import * as inquirer from 'inquirer';

export class CommandCollection {
  private instances: CmdBase[] = [];
  private commands: Array<{ new (program: Command, inq: inquirer.Inquirer): CmdBase }> = [
    CmdHelloWord,
  ];

  constructor (private program: Command) {
    this.setCliDetails();

    this.commands.forEach((c) => {
      this.instances.push(new c(program, inquirer));
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
