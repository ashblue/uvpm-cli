import { CmdBase } from '../../base/base.cmd';
import { Questions } from 'inquirer';
import { IUnpublishAnswers } from './i-unpublish-answers';
import chalk from 'chalk';

const msgConfirmPackage = 'Are you sure you want to delete this package? If so please type this package\'s name';

const msgConfirmPackageVersion = 'Are you sure you want to delete this package? If so' +
  ' please type the package as PACKAGE@VERSION. Example my-package@1.0.0';

export class CmdUnpublish extends CmdBase {
  private questions: Questions = [
    {
      type: 'input',
      name: 'packageName',
      message: undefined,
    },
  ];

  get name (): string {
    return 'unpublish [package] [version]';
  }

  get description (): string {
    return 'Permanently delete a package entirely or an individual version';
  }

  private set messageConfirm (value: string) {
    const question = this.questions as any;
    question[0].message = value;
  }

  protected get requireLogin (): boolean {
    return true;
  }

  protected get requireServer (): boolean {
    return true;
  }

  protected get requireUvpmJson (): boolean {
    return true;
  }

  protected onAction (packageId?: string, versionId?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!packageId) {
        reject('You must call unpublish with a package and optional version, "uvpm unpublish [PACKAGE] [VERSION]"');
        return;
      }

      if (versionId) {
        this.messageConfirm = msgConfirmPackageVersion;
      } else {
        this.messageConfirm = msgConfirmPackage;
      }

      const answers: IUnpublishAnswers = await this.inquirer.prompt(this.questions);

      if (answers.packageName !== this.getPackageDisplay(packageId, versionId)) {
        reject(`Package name was not confirmed`);
        return;
      }

      try {
        if (versionId) {
          await this.servicePackageVersions.delete(packageId, versionId);
        } else {
          await this.servicePackages.delete(packageId);
        }
      } catch (err) {
        reject(err);
        return;
      }

      this.log.print(chalk.green(`Package ${this.getPackageDisplay(packageId, versionId)} successfully deleted`));
      resolve();
    });
  }

  private getPackageDisplay (packageId: string, versionId?: string) {
    if (!versionId) {
      return packageId;
    }

    return `${packageId}@${versionId}`;
  }
}
