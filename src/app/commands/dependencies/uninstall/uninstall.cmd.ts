import { CmdBase } from '../../base/base.cmd';
import rimraf = require('rimraf');
import * as fs from 'fs';
import { ICmdOption } from '../../base/i-cmd-option';
import { CmdInstall } from '../install/install.cmd';
import { A } from '../../../shared/tests/builder/a';

export class CmdUninstall extends CmdBase {
  public get name (): string {
    return 'uninstall [package]';
  }

  public get description (): string {
    return 'Uninstall all packages or a single package by name.';
  }

  protected get options (): ICmdOption[] {
    return [
      {
        flags: '--save, -s',
        description: 'Remove the uninstalled package from the uvpm.json file',
        defaultValue: false,
      },
    ];
  }

  protected get requireUvpmJson (): boolean {
    return true;
  }

  protected get requireLogin (): boolean {
    return true;
  }

  protected get requireServer (): boolean {
    return true;
  }

  // istanbul ignore next
  private get fileRoot (): string {
    return '.';
  }

  protected onAction (packageName?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (packageName) {
        const packageLocation = `${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}`;

        if (fs.existsSync(packageLocation)) {
          await this.removePackage(packageLocation, packageName);
          this.logSuccess.print(`Package "${packageName}" uninstalled`);
        } else {
          reject(`Package "${packageName}" could not be found to uninstall`);
          return;
        }

        resolve();
      } else {
        this.removeAllPackages();
        this.logSuccess.print(`All packages successfully uninstalled`);

        resolve();
      }
    });
  }

  private async removePackage (packageLocation: string, packageName: string) {
    rimraf.sync(packageLocation);

    if (this.program.save) {
      this.config.dependencies.packages = this.config.dependencies.packages
        .filter((p) => p.name !== packageName);

      await this.config.save();
      this.log.print('uvpm.json file successfully updated');

      this.log.print('Updating installed dependencies...');
      const cmdInstall = A.command()
        .withServiceDatabase(this.db)
        .withModelProfile(this.profile)
        .withModelUvpmConfig(this.config)
        .withCommanderProgram(this.program)
        .withInquirer(this.inquirer)
        .withServicePackages(this.servicePackages)
        .withServicePackageVersions(this.servicePackageVersions)
        .withServiceCache(this.serviceCache)
        .build(CmdInstall);

      cmdInstall.action();
    }
  }

  private removeAllPackages () {
    const packageOutput = `${this.fileRoot}/${this.config.dependencies.outputFolder}`;

    if (fs.existsSync(packageOutput)) {
      const folders = fs.readdirSync(packageOutput);

      folders.forEach((f) => {
        rimraf.sync(`${packageOutput}/${f}`);
      });
    }
  }
}
