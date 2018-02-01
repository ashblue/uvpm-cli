import { Command } from 'commander';
import { CmdHelloWord } from './hello-world/hello-world.cmd';
import { CmdBase } from './base/base.cmd';

import pjson = require('pjson');
import * as process from 'process';

export class CommandCollection {
  private instances: CmdBase[] = [];
  private commands: Array<{ new (program: Command): CmdBase }> = [
    CmdHelloWord,
  ];

  constructor (private program: Command) {
    this.setCliDetails();

    this.commands.forEach((c) => {
      this.instances.push(new c(program));
    });
  }

  /**
   * Trigger to activate reading arguments
   */
  public listen () {
    this.program.parse(process.argv);
  }

  private setCliDetails () {
    this.program
      .version(pjson.version)
      .description('UV Package Manager commands to interact with the server');
  }
}
