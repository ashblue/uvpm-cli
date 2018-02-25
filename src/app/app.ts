import { CommandCollection } from './commands/command-collection';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { config } from './shared/config';
import { ServiceDatabase } from './services/database/database.service';
import { ModelProfile } from './models/profile/profile.model';

export class App {
  public init (): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const db = new ServiceDatabase();
      const profile = new ModelProfile(db);
      await profile.load();

      const commandCollection = new CommandCollection(db, profile, new Command(), inquirer);

      /* istanbul ignore if */
      if (!config.isEnvTest) {
        commandCollection.listen();
      }

      resolve();
    });
  }
}
