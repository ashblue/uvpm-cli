import { CmdBase } from '../../base/base.cmd';
import { ModelProfile } from '../../../shared/models/profile/profile.model';
import chalk from 'chalk';

export class CmdWhoami extends CmdBase {
  get name (): string {
    return 'whoami';
  }

  get description (): string {
    return 'Set or print the current server';
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
      const profile = new ModelProfile();

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
