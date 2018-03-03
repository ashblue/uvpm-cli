import { Command } from 'commander';
import { CmdBase } from './base/base.cmd';

import pjson = require('pjson');
import * as process from 'process';
import * as inquirer from 'inquirer';
import { CmdInit } from './generators/init/init.cmd';
import { CmdServer } from './authentication/server/server.cmd';
import { CmdLogin } from './authentication/login/login.cmd';
import { CmdLogout } from './authentication/logout/logout.cmd';
import { CmdWhoami } from './authentication/whoami/whoami.cmd';
import { CmdVersion } from './publishing/version/version.cmd';
import { ServiceDatabase } from '../services/database/database.service';
import { ModelProfile } from '../models/profile/profile.model';
import { ModelUvpmConfig } from '../models/uvpm/uvpm-config.model';
import { ServicePackages } from '../services/packages/packages.service';
import { ServicePackageVersions } from '../services/package-versions/package-versions.service';

export class CommandCollection {
  public commandInstances: CmdBase[] = [];

  private commands: Array<{
    new (db: ServiceDatabase,
         profile: ModelProfile,
         config: ModelUvpmConfig,
         program: Command,
         inq: inquirer.Inquirer,
         packages: ServicePackages,
         versions: ServicePackageVersions): CmdBase,
  }> = [
    CmdInit,
    CmdServer,
    CmdLogin,
    CmdLogout,
    CmdWhoami,
    CmdVersion,
  ];

  constructor (
    private db: ServiceDatabase,
    private profile: ModelProfile,
    private config: ModelUvpmConfig,
    private program: Command,
    private inq: inquirer.Inquirer,
    private servicePackages: ServicePackages,
    private servicePackageVersions: ServicePackageVersions,
  ) {
    this.setCliDetails();

    this.commands.forEach((c) => {
      this.commandInstances.push(new c(this.db, this.profile, this.config, program, this.inq,
        this.servicePackages, this.servicePackageVersions));
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
