import { CmdBase } from '../../base/base.cmd';
import { ncp } from 'ncp';
import * as fs from 'fs';
import rimraf = require('rimraf');
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import { serviceTmp } from '../../../services/tmp/tmp.service';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import mkdirp = require('mkdirp');
import * as tarFs from 'tar-fs';

/**
 * @TODO Move file helper methods onto a helper class
 */
export class CmdPublish extends CmdBase {
  public static ARCHIVE_NAME = 'archive.tar';

  get name (): string {
    return 'publish';
  }

  get description (): string {
    return 'Publish a package by running this command in a folder with a uvpm.json file';
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

  // istanbul ignore next
  /**
   * Overridable method for changing the project folder during testing
   * @returns {string}
   */
  private get projectFolderPath (): string {
    return '.';
  }

  public static async cleanProject (folder: string, config: ModelUvpmConfig) {
    return new Promise<void>(async (resolve, reject) => {
      if (!fs.existsSync(folder)) {
        reject(`Folder ${folder} does not exist`);
        return;
      }

      try {
        const blacklist: string[] = [];
        config.publishing.ignore.forEach((f) => {
          blacklist.push(`${folder}/${f}`);
          blacklist.push(`${folder}/${f}.meta`);
        });

        blacklist.forEach((f) => {
          if (!fs.existsSync(f)) {
            return;
          }

          const fileDetails = fs.lstatSync(f);

          // If a file
          if (fileDetails.isFile()) {
            fs.unlinkSync(f);
          } else if (fileDetails.isDirectory()) {
            rimraf.sync(f);
          }
        });

        resolve();
      } catch (err) {
        // istanbul ignore next
        reject(err);
      }
    });
  }

  public static extractArchive (archiveFile: string, dumpFolder: string) {
    return new Promise((resolve, reject) => {
      const extractor = tarFs.extract(dumpFolder);
      extractor.on('finish', resolve);
      extractor.on('error', reject);

      fs.createReadStream(archiveFile).pipe(extractor);
    });
  }

  public static createArchive (sourceFolder: string, destinationFile: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const stream = fs.createWriteStream(destinationFile);
      stream.on('error', reject);
      stream.on('close', resolve);

      const packer = tarFs.pack(sourceFolder);
      packer.on('error', reject);

      packer.pipe(stream);
    });
  }

  /**
   * Copy a project from the source to the destination
   * @param {string} source
   * @param {string} destination
   * @returns {Promise<void>}
   */
  public copyProject (source: string, destination: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ncp(source, destination, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  /**
   * Clean out a folder based upon the config file settings
   * @param {string} folder
   * @returns {Promise<void>}
   */
  public cleanFolder (folder: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await CmdPublish.cleanProject(folder, this.config);
      } catch (message) {
        reject(message);
        return;
      }

      resolve();
    });
  }

  protected onAction (): Promise<void> {
    this.log.print('Packaging file for publishing...');

    return new Promise<void>(async (resolve, reject) => {
      serviceTmp.create();

      if (!this.config.version) {
        reject('Please provide a version in your uvpm.json file');
        return;
      }

      if (!this.config.publishing) {
        reject('Please provide a valid config.publishing object');
        return;
      }

      const publishPath = `${this.projectFolderPath}/${this.config.publishing.targetFolder}`;
      if (!fs.existsSync(publishPath)) {
        reject(`The publish folder ${this.config.publishing.targetFolder} does not exist`);
        return;
      }

      let archive: string;
      // istanbul ignore next
      try {
        archive = await this.copyProjectToArchive();
      } catch (err) {
        reject(err);
        return;
      }

      const packagedData: IPackage = {
        name: this.config.name,
        versions: [
          {
            name: this.config.version.toString(),
            archive,
          },
        ],
      };

      let serverPackage: IPackage|null;
      try {
        serverPackage = await this.servicePackages.get(this.config.name);
      } catch {
        serverPackage = null;
      }

      if (!serverPackage) {
        try {
          await this.servicePackages.create(packagedData);
        } catch (err) {
          reject(err);
          return;
        }
      } else {
        try {
          await this.servicePackageVersions.add(packagedData.name, packagedData.versions[0]);
        } catch (err) {
          reject(err);
          return;
        }
      }

      this.log.print(`Package ${this.config.name} v${this.config.version} published to ${this.profile.server}`);

      this.clearTmp();

      resolve();
    });
  }

  private clearTmp () {
    serviceTmp.clear();
  }

  private copyProjectToArchive (): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      const tmpCopyPath = `${serviceTmp.tmpFolder}/${this.config.name}`;
      const tmpCopyTargetPath = `${tmpCopyPath}/${this.config.publishing.targetFolder}`;
      const tmpArchiveFilePath = `${serviceTmp.tmpFolder}/${CmdPublish.ARCHIVE_NAME}`;

      // istanbul ignore next
      try {
        mkdirp.sync(tmpCopyTargetPath);
        await this.copyProject(`${this.projectFolderPath}/${this.config.publishing.targetFolder}`, tmpCopyTargetPath);
        await this.cleanFolder(tmpCopyPath);
        await this.copyProject(`${this.projectFolderPath}/uvpm.json`, `${tmpCopyPath}/uvpm.json`);
        await CmdPublish.createArchive(tmpCopyPath, tmpArchiveFilePath);
      } catch (err) {
        reject(err);
        return;
      }

      let result: Buffer;
      // istanbul ignore next
      try {
        result = fs.readFileSync(tmpArchiveFilePath);
      } catch (err) {
        reject(err);
        return;
      }

      resolve(result.toString('base64'));
    });
  }
}
