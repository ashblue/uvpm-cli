import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { Command } from 'commander';
import { ServicePackages } from '../../../services/packages/packages.service';
import { CmdBase } from '../../../commands/base/base.cmd';
import { ServiceCache } from '../../../services/cache/cache.service';
import { ServiceAuthentication } from '../../../services/authentication/authentication.service';

export interface ICommandNew {
  new(
    db: ServiceDatabase,
    profile: ModelProfile,
    config: ModelUvpmConfig,
    program: Command,
    inq: inquirer.Inquirer,
    packages: ServicePackages,
    versions: ServicePackageVersions,
    cache: ServiceCache,
    authentication: ServiceAuthentication,
  ): CmdBase;
}
