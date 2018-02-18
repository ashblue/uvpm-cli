import { CmdBase } from '../../base/base.cmd';
import { ModelProfile } from '../../../models/profile/profile.model';
import chalk from 'chalk';
import { ServiceDatabase } from '../../../services/database/database.service';

export class CmdWhoami extends CmdBase {
  get name (): string {
    return 'whoami';
  }

  get description (): string {
    return 'Prints the currently logged in user';
  }

  protected onAction (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      return this.printUser()
        .then(resolve)
        .catch(reject);
    });
  }

  private printUser (): Promise<void> {
    return new Promise<void>((resolve) => {
      const profile = new ModelProfile(new ServiceDatabase());

      profile.load()
        .then(() => {
          if (profile.isLoggedIn) {
            this.log(`Current user is: ${profile.email}`);
          } else {
            this.logErr(chalk.red('You must run "uvpm login" to set a user'));
          }

          resolve();
        });
    });
  }
}
