import { CmdBase } from '../../base/base.cmd';
import chalk from 'chalk';

export class CmdLogin extends CmdBase {
  get name (): string {
    return 'login';
  }

  get description (): string {
    return 'Attempt to authenticate a user and store login credentials.';
  }

  protected onAction (): Promise<void> {
    this.log(chalk.bold(`Login to current server`));

    return new Promise<void>((resolve) => resolve());
  }
}
