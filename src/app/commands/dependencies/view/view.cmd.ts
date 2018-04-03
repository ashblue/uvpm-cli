import { CmdBase } from '../../base/base.cmd';
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import chalk from 'chalk';

export class CmdView extends CmdBase {
  public get name (): string {
    return 'view [package]';
  }

  public get description (): string {
    return 'View a package\'s details';
  }

  protected get requireServer (): boolean {
    return true;
  }

  protected onAction (name?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!name) {
        reject('Please provide a package name to view a package');
        return;
      }

      let result: IPackage;
      try {
        result = await this.servicePackages.get(name);
      } catch (err) {
        reject(err);
        return;
      }

      this.log.print(chalk.bold(chalk.gray(`Package: ${result.name}`)));

      result.versions.forEach((v) => {
        this.log.print((chalk.gray(`* ${v.name}`)));
      });

      resolve();
    });
  }
}
