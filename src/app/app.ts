import { CommandCollection } from './commands/command-collection';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { appConfig } from './shared/config';
import { ServiceDatabase } from './services/database/database.service';
import { ModelProfile } from './models/profile/profile.model';
import { ModelUvpmConfig } from './models/uvpm/uvpm-config.model';
import { ServicePackages } from './services/packages/packages.service';
import { ServicePackageVersions } from './services/package-versions/package-versions.service';
import { ServiceCache } from './services/cache/cache.service';
import { ServiceAxios } from './services/axios/axios.service';
import { ServiceAuthentication } from './services/authentication/authentication.service';

export class App {
  public init (): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const db = new ServiceDatabase();

      const profile = new ModelProfile(db);
      await profile.load();

      const config = new ModelUvpmConfig();
      await config.load();

      const axios = new ServiceAxios(profile);

      const commandCollection = new CommandCollection(db, profile, config, new Command(), inquirer,
        new ServicePackages(profile, axios), new ServicePackageVersions(profile, axios), new ServiceCache(db),
        new ServiceAuthentication(profile, axios));

      /* istanbul ignore if */
      if (!appConfig.isEnvTest) {
        commandCollection.listen();
      }

      resolve();
    });
  }
}
