import { CmdBase } from '../../base/base.cmd';
import { ModelProfile } from '../../../models/profile/profile.model';
import chalk from 'chalk';

export class CmdServer extends CmdBase {
  get name (): string {
    return 'server [url]';
  }

  get description (): string {
    return 'Set or print the current server';
  }

  protected onAction (url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (url) {
        return this.setUrl(url)
          .then(resolve)
          .catch(reject);
      }

      return this.printServer()
        .then(resolve)
        .catch(reject);
    });
  }

  private setUrl (url: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const profile = new ModelProfile(this.db);

      profile.load()
        .then(() => {
          profile.server = url;
          return profile.save()
            .then(() => {
              this.log(chalk.green(`Server set to "${url}"`));
              resolve();
            });
        });

    });
  }

  private printServer (): Promise<void> {
    return new Promise<void>((resolve) => {
      const profile = new ModelProfile(this.db);

      profile.load()
        .then(() => {
          if (!profile.server || profile.server === '') {
            this.logErr(chalk.red('Please set a server'));
          } else {
            this.log(`Current server is "${profile.server}"`);
          }

          resolve();
        });
    });
  }
}
