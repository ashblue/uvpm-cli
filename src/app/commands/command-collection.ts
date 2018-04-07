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
import { CmdPublish } from './publishing/publish/publish.cmd';
import { CmdUnpublish } from './publishing/unpublish/unpublish.cmd';
import { ICommandNew } from '../shared/interfaces/command/i-command-new';
import { ServiceCache } from '../services/cache/cache.service';
import { CmdInstall } from './dependencies/install/install.cmd';
import { CmdUninstall } from './dependencies/uninstall/uninstall.cmd';
import { CmdCacheClear } from './dependencies/cache-clear/cache-clear.cmd';
import { CmdSearch } from './dependencies/search/search.cmd';
import { CmdView } from './dependencies/view/view.cmd';
import { ServiceAuthentication } from '../services/authentication/authentication.service';
import { CmdRegister } from './authentication/register/register.cmd';

export class CommandCollection {
  public commandInstances: CmdBase[] = [];

  private commands: ICommandNew[] = [
    CmdInit,
    CmdServer,
    CmdLogin,
    CmdLogout,
    CmdWhoami,
    CmdVersion,
    CmdPublish,
    CmdUnpublish,
    CmdInstall,
    CmdUninstall,
    CmdCacheClear,
    CmdSearch,
    CmdView,
    CmdRegister,
  ];

  constructor (
    private db: ServiceDatabase,
    private profile: ModelProfile,
    private config: ModelUvpmConfig,
    private program: Command,
    private inq: inquirer.Inquirer,
    private servicePackages: ServicePackages,
    private servicePackageVersions: ServicePackageVersions,
    private serviceCache: ServiceCache,
    private serviceAuthentication: ServiceAuthentication,
  ) {
    this.setCliDetails();

    this.commands.forEach((c) => {
      this.commandInstances.push(new c(this.db, this.profile, this.config, program, this.inq,
        this.servicePackages, this.servicePackageVersions, this.serviceCache, this.serviceAuthentication));
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
