import { CmdBase } from '../../base/base.cmd';
import { Questions } from 'inquirer';
import { IUnpublishAnswers } from './i-unpublish-answers';
import chalk from 'chalk';

const msgConfirmPackage = 'Are you sure you want to delete this package? If so please type this package\'s name';
const msgConfirmPackageAgain = 'This will delete the entire package for good and all associated versions.' +
  ' Are you sure you want to do this? Type "yes" to continue';

const msgConfirmPackageVersion = 'Are you sure you want to delete this package? If so' +
  ' please type the package as PACKAGE@VERSION. Example my-package@1.0.0';
const msgConfirmPackageVersionAgain = 'This will delete the package version. Are you sure you want' +
  ' to do this? Type yes to continue';

export class CmdUnpublish extends CmdBase {
  private questions: Questions = [
    {
      type: 'input',
      name: 'packageName',
      message: undefined,
    },
    {
      type: 'input',
      name: 'confirmYes',
      message: 'This will delete the entire package for good and all associated versions.' +
        ' Are you sure you want to do this? Type "yes" to continue',
    },
  ];

  get name (): string {
    return 'unpublish package [version]';
  }

  get description (): string {
    return 'Permanently delete a specific package version';
  }

  private set messageConfirm (value: string) {
    const question = this.questions as any;
    question[0].message = value;
  }

  private set messageConfirmAgain (value: string) {
    const question = this.questions as any;
    question[1].message = value;
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
    return new Promise<void>((resolve, reject) => {
      if (!packageId) {
        reject('You must call unpublish with a package and version, "uvpm unpublish PACKAGE [VERSION]"');
        return;
      }

      if (versionId) {
        this.messageConfirm = msgConfirmPackageVersion;
        this.messageConfirmAgain = msgConfirmPackageVersionAgain;
      } else {
        this.messageConfirm = msgConfirmPackage;
        this.messageConfirmAgain = msgConfirmPackageAgain;
      }

      this.inquirer.prompt(this.questions)
        .then((answers: IUnpublishAnswers) => {
          if (answers.packageName !== this.getPackageDisplay(packageId, versionId)) {
            reject('Package name was not confirmed');
            return;
          }

          if (answers.confirmYes !== 'yes') {
            reject('Failed to unpublish. Did not receive a yes');
            return;
          }

          if (versionId) {
            return this.servicePackageVersions.delete(packageId, versionId);
          } else {
            return this.servicePackages.delete(packageId);
          }
        })
        .then(() => {
          this.log.print(chalk.green(`Package ${this.getPackageDisplay(packageId, versionId)} successfully deleted`));
          resolve();
        })
        .catch((err) => reject(err));
    });
  }

  private getPackageDisplay (packageId: string, versionId?: string) {
    if (!versionId) {
      return packageId;
    }

    return `${packageId}@${versionId}`;
  }
}
