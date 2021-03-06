import { CmdBase } from '../../base/base.cmd';
import mkdirp = require('mkdirp');
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import { ModelVersion } from '../../../models/version/version.model';
import { IPackageVersion } from '../../../shared/interfaces/packages/versions/i-package-version';
import * as fs from 'fs';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import rimraf = require('rimraf');
import { ICmdOption } from '../../base/i-cmd-option';
import { IUvpmPackage } from '../../../shared/interfaces/uvpm/config/i-uvpm-config-package';
import { CmdPublish } from '../../publishing/publish/publish.cmd';

export interface ICmdInstallOptions {
  save?: boolean;
  examples?: boolean;
  tests?: boolean;
}

export class CmdInstall extends CmdBase {
  private _options: ICmdInstallOptions = {};

  get name (): string {
    return 'install [package]';
  }

  get description (): string {
    return 'Install a package by name or all packages';
  }

  protected get options (): ICmdOption[] {
    return [
      {
        flags: '-s, --save',
        description: 'Save the newly installed package to the config',
        defaultValue: false,
      },
      {
        flags: '-e, --examples',
        description: 'Include examples with the package',
        defaultValue: false,
      },
      {
        flags: '-t, --tests',
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

  protected onAction (packageName?: string, options?: ICmdInstallOptions): Promise<void> {
    if (options) {
      this._options = options;
    }

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
      examples: this._options.examples,
      tests: this._options.tests,
    });

    const config = await this.getInstalledPackageConfig(packageName);
    await this.installPackageList(config);

    if (this._options.save) {
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

    if (this._options.examples) {
      entry.examples = true;
    }

    if (this._options.tests) {
      entry.tests = true;
    }

    this.config.dependencies.packages.push(entry);

    await this.config.save();
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

        const depConfig = await this.getInstalledPackageConfig(pack.name);
        await this.installPackageList(depConfig);

      } catch (err) {
        this.logError.print(`Package ${pack.name} does not exist, skipping install`);
      }
    }
  }

  private getInstalledPackageConfig (packageName: string): Promise<ModelUvpmConfig> {
    return new Promise<ModelUvpmConfig>((resolve, reject) => {
      const configFile = `${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}/uvpm.json`;

      let configText: string = '';
      try {
        configText = fs.readFileSync(configFile).toString();
      } catch (err) {
        reject(err);
      }

      resolve(new ModelUvpmConfig(JSON.parse(configText)));
    });
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
      let isCacheArchive = false;
      archiveTmp = await this.getArchiveFromCache(packageName, targetVersion.name);
      if (archiveTmp) {
        isCacheArchive = true;
      }

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

        try {
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
        } catch (err) {
          // istanbul ignore next: Helps detect a possible error that could drigger due to malformed package installs
          this.logError.print('Failed package upgrade detected. Deleting package instead and re-installing.' +
            ' Error details:');
          // istanbul ignore next
          this.logError.print(err);
          // istanbul ignore next
          rimraf.sync(`${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}`);
        }
      }

      const outputFolder = `${this.fileRoot}/${this.config.dependencies.outputFolder}/${packageName}`;
      mkdirp.sync(outputFolder);

      // Unpack the archive into the new directory
      await CmdPublish.extractArchive(archiveTmp, outputFolder);

      await this.cleanPackageFiles(outputFolder, packageDetails);

      if (!isCacheArchive) {
        try {
          await this.serviceCache.set(packageName, targetVersion.name, archiveTmp);
        } catch (err) {
          this.logError.print(`Cache Error: ${err}`);
        }
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
      this.logError.print('Installed package does not have a uvpm.json file. Did not clean the directory');
      return;
    }

    const existingConfig: ModelUvpmConfig = await this.getInstalledPackageConfig(packageData.name);

    if (!packageData.examples) {
      existingConfig.publishing.examples.forEach((exampleRelativePath) => {
        rimraf.sync(`${packagePath}/${exampleRelativePath}`);
        rimraf.sync(`${packagePath}/${exampleRelativePath}.meta`);
      });
    }

    if (!packageData.tests) {
      existingConfig.publishing.tests.forEach((testRelativePath) => {
        rimraf.sync(`${packagePath}/${testRelativePath}`);
        rimraf.sync(`${packagePath}/${testRelativePath}.meta`);
      });
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
