import { CmdBase } from '../../base/base.cmd';
import mkdirp = require('mkdirp');
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import * as tar from 'tar';
import { ModelVersion } from '../../../models/version/version.model';
import { IPackageVersion } from '../../../shared/interfaces/packages/versions/i-package-version';
import * as fs from 'fs';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import rimraf = require('rimraf');
import { ICmdOption } from '../../base/i-cmd-option';
import { IUvpmPackage } from '../../../shared/interfaces/uvpm/config/i-uvpm-config-package';

export class CmdInstall extends CmdBase {
  get name (): string {
    return 'install [package]';
  }

  get description (): string {
    return 'Install a package by name or all packages';
  }

  protected get options (): ICmdOption[] {
    return [
      {
        flags: '--save, -s',
        description: 'Save the newly installed package to the config',
        defaultValue: false,
      },
      {
        flags: '--examples, -e',
        description: 'Include examples with the package',
        defaultValue: false,
      },
      {
        flags: '--tests, -t',
        description: 'Include tests with the package',
        defaultValue: false,
      },
    ];
  }

  // istanbul ignore next
  private get fileRoot (): string {
    return '.';
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

  protected onAction (packageName?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!packageName) {
        try {
          await this.installAllRootConfigPackages();
          resolve();
        } catch (err) {
          // istanbul ignore next: Should write a test for this at some point
          reject(err);
        }

        return;
      }

      try {
        await this.installSinglePackage(packageName);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  private async installSinglePackage (packageName: string) {
    await this.installPackage({
      name: packageName,
      version: undefined as any,
      examples: this.program.examples,
      tests: this.program.tests,
    });

    const config = this.getInstalledPackageConfig(packageName);
    await this.installPackageList(config);

    if (this.program.save) {
      await this.writePackageToConfig(config);
    }
  }

  private async installAllRootConfigPackages () {
    rimraf.sync(`${this.fileRoot}/${this.config.dependencies.outputFolder}`);

    await this.installPackageList(this.config);
  }

  private async writePackageToConfig (packageConfig: ModelUvpmConfig) {
    const existingEntry = this.config.dependencies.packages
      .find((p) => p.name === packageConfig.name);

    if (existingEntry) {
      this.config.dependencies.packages = this.config.dependencies.packages
        .filter((p) => p.name !== packageConfig.name);
    }

    const entry: IUvpmPackage = {
      name: packageConfig.name,
      version: `^${packageConfig.version.toString()}`,
    };

    if (this.program.examples) {
      entry.examples = true;
    }

    if (this.program.tests) {
      entry.tests = true;
    }

    this.config.dependencies.packages.push(entry);

    await this.config.save(this.fileRoot);
  }

  /**
   * Recursively installs all packages from a config file
   * @param {ModelUvpmConfig} config
   * @returns {Promise<void>}
   */
  private async installPackageList (config: ModelUvpmConfig) {
    for (const pack of config.dependencies.packages) {
      try {
        const installedVersion = await this.installPackage({
          name: pack.name,
          version: pack.version,
          examples: pack.examples,
        });

        if (!installedVersion) {
          continue;
        }

        if (installedVersion.name !== pack.version) {
          this.logWarning.print(`Version ${pack.version} not found for package ${pack.name}.`
            + ` Installed version ${installedVersion.name} instead`);
        }

        const depConfig = this.getInstalledPackageConfig(pack.name);
        await this.installPackageList(depConfig);

      } catch (err) {
        this.logError.print(`Package ${pack.name} does not exist, skipping install`);
      }
    }
  }

  private getInstalledPackageConfig (packageName: string) {
    const outputFolder = `${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}/uvpm.json`;
    const configText = fs.readFileSync(outputFolder).toString();

    return new ModelUvpmConfig(JSON.parse(configText));
  }

  private installPackage (packageDetails: IUvpmPackage): Promise<IPackageVersion> {
    return new Promise<IPackageVersion>(async (resolve, reject) => {
      // istanbul ignore if: Prevents TypeScript undefined type error
      if (!packageDetails) {
        reject('Please provide a package to install');
        return;
      }

      const packageName = packageDetails.name;
      const packageVersion: undefined|string = packageDetails.version;

      let packageData: IPackage;
      try {
        packageData = await this.servicePackages.get(packageName);
      } catch (err) {
        reject(err);
        return;
      }

      if (!packageData) {
        reject('Package data could not be found');
        return;
      }

      const targetVersion = this.findTargetVersion(packageVersion, packageDetails, packageData);

      let archiveTmp: string|undefined;
      archiveTmp = await this.getArchiveFromCache(packageName, targetVersion.name);

      if (!archiveTmp) {
        try {
          archiveTmp = await this.servicePackageVersions.downloadArchive(packageName, targetVersion.name);
        } catch (err) {
          reject(err);
          return;
        }
      }

      if (this.isPackageInstalled(packageName)) {
        this.logWarning.print(`Duplicate package ${packageName} detected`);

        const existingConfig = await this.getInstalledPackageConfig(packageName);

        // istanbul ignore else: Need to write a test for the else scenario
        if (new ModelVersion(targetVersion.name).isNewerVersion(existingConfig.version)) {
          this.logWarning
            .print(`Installing ${packageName} version ${targetVersion.name} and deleting ${existingConfig.version}`);
          rimraf.sync(`${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}`);
        } else {
          resolve();
          return;
        }
      }

      const outputFolder = `${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}`;
      mkdirp.sync(outputFolder);

      // Unpack the archive into the new directory
      await tar.extract({
        file: archiveTmp,
        cwd: outputFolder,
      });

      await this.cleanPackageFiles(outputFolder, packageDetails);

      try {
        await this.serviceCache.set(packageName, targetVersion.name, archiveTmp);
      } catch (err) {
        this.logError.print(`Cache Error: ${err}`);
      }

      resolve(targetVersion);
    });
  }

  /**
   * Parses a version string with special characters into the correct version
   * @param {string | undefined} packageVersion
   * @param {IUvpmPackage} packageDetails
   * @param {IPackage} packageData
   * @returns {IPackageVersion | undefined}
   */
  private findTargetVersion (packageVersion: string | undefined, packageDetails: IUvpmPackage, packageData: IPackage) {
    let targetVersion: IPackageVersion | undefined;

    if (packageVersion && packageVersion.charAt(0) === '^') {
      const targetVersionData = new ModelVersion(packageDetails.version);
      targetVersion = this.findNewestMinorVersion(targetVersionData.major, packageData.versions);
    } else if (packageVersion && packageVersion.charAt(0) === '~') {
      const targetVersionData = new ModelVersion(packageDetails.version);
      targetVersion = this.findNewestPatch(targetVersionData.major, targetVersionData.minor, packageData.versions);
    } else {
      targetVersion = this.findPackageByVersion(packageData, packageVersion);
      if (!targetVersion) {
        targetVersion = this.findNewestVersion(packageData.versions);
      }
    }
    return targetVersion;
  }

  private async getArchiveFromCache (packageName: string, packageVersion: string): Promise<string|undefined> {
    if (!await this.serviceCache.hasPackageVersion(packageName, packageVersion)) {
      return undefined;
    }

    try {
      const cache = await this.serviceCache.getPackageVersion(packageName, packageVersion);
      return cache.archivePath;
    } catch {
      return undefined;
    }
  }

  private async cleanPackageFiles (packagePath: string, packageData: IUvpmPackage) {
    if (!fs.existsSync(`${packagePath}/uvpm.json`)) {
      return;
    }

    const existingConfig: ModelUvpmConfig = await this.getInstalledPackageConfig(packageData.name);

    if (!packageData.examples) {
      rimraf.sync(`${packagePath}/${existingConfig.publishing.examples}`);
    }

    if (!packageData.tests) {
      rimraf.sync(`${packagePath}/${existingConfig.publishing.tests}`);
    }
  }

  private isPackageInstalled (packageName: string): boolean {
    const outputFolder = `${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}`;
    return fs.existsSync(outputFolder);
  }

  private findPackageByVersion (packageData: IPackage, packageVersion?: string): IPackageVersion|undefined {
    if (!packageVersion) {
      return undefined;
    }

    return packageData.versions.find((v) => {
      return v.name === packageVersion;
    });
  }

  private findNewestPatch (
    majorVersion: number,
    minorVersion: number,
    packageVersions: IPackageVersion[],
  ): IPackageVersion {
    const versions = packageVersions.map((v) => new ModelVersion(v.name));
    let newestMajorVersion = versions[0];
    let newestMajorVersionIndex = 0;
    versions.forEach((version, index) => {
      if (majorVersion !== version.major
        || minorVersion !== version.minor
        || !version.isNewerVersion(newestMajorVersion)) {
        return;
      }

      newestMajorVersion = version;
      newestMajorVersionIndex = index;
    });

    return packageVersions[newestMajorVersionIndex];
  }

  private findNewestMinorVersion (majorVersion: number, packageVersions: IPackageVersion[]): IPackageVersion {
    const versions = packageVersions.map((v) => new ModelVersion(v.name));
    let newestMajorVersion = versions[0];
    let newestMajorVersionIndex = 0;
    versions.forEach((version, index) => {
      if (majorVersion !== version.major || !version.isNewerVersion(newestMajorVersion)) {
        return;
      }

      newestMajorVersion = version;
      newestMajorVersionIndex = index;
    });

    return packageVersions[newestMajorVersionIndex];
  }

  private findNewestVersion (packageVersions: IPackageVersion[]): IPackageVersion {
    const versions = packageVersions.map((v) => new ModelVersion(v.name));
    let newestVersion = versions[0];
    let newestVersionIndex = 0;
    versions.forEach((version, index) => {
      if (version.isNewerVersion(newestVersion)) {
        newestVersion = version;
        newestVersionIndex = index;
      }
    });

    return packageVersions[newestVersionIndex];
  }
}
