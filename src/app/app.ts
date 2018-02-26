import { CommandCollection } from './commands/command-collection';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { appConfig } from './shared/config';
import { ServiceDatabase } from './services/database/database.service';
import { ModelProfile } from './models/profile/profile.model';
import { ModelUvpmConfig } from './models/uvpm/uvpm-config.model';

export class App {
  public init (): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const db = new ServiceDatabase();

      const profile = new ModelProfile(db);
      await profile.load();

      const config = new ModelUvpmConfig();
      await config.load();

      const commandCollection = new CommandCollection(db, profile, config, new Command(), inquirer);

      /* istanbul ignore if */
      if (!appConfig.isEnvTest) {
        commandCollection.listen();
      }

      resolve();
    });
  }
}
