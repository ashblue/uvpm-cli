import { CmdBase } from '../../base/base.cmd';
import { ncp } from 'ncp';
import * as glob from 'glob';
import * as fs from 'fs';
import rimraf = require('rimraf');
import * as archiver from 'archiver';
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import { serviceTmp } from '../../../services/tmp/tmp.service';

/**
 * @TODO Move file helper methods onto a helper class
 */
export class CmdPublish extends CmdBase {
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

  public createArchive (sourceFolder: string, destinationFile: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(destinationFile);
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: 9,
        },
        zlib: {
          level: 9,
        },
      });

      output.on('close', () => resolve());

      // istanbul ignore next
      archive.on('error', (err) => reject(err));

      // istanbul ignore next
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn(err);
          return;
        }

        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceFolder, false);
      archive.finalize();
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
      if (!fs.existsSync(folder)) {
        reject(`Folder ${folder} does not exist`);
        return;
      }

      try {
        const whitelist: string[] = [
          'uvpm.json',
          this.config.publishing.targetFolder,
        ];

        const files = await this.getAllFilesRecursively(folder);
        const blacklist = files.filter((f) => {
          const pathRelative = f.replace(`${folder}/`, '');
          const result = whitelist.find((w) => {
            return pathRelative.substr(0, w.length) === w;
          });

          return !result;
        });

        blacklist.forEach((f) => {
          if (!fs.existsSync(f)) {
            return;
          }

          const fileDetails = fs.lstatSync(`./${f}`);

          // If a file
          if (fileDetails.isFile()) {
            fs.unlinkSync(f);
          }

          // If a folder rimraf it
          if (fileDetails.isDirectory()) {
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

  protected onAction (): Promise<void> {
    this.log('Packaging file for publishing...');

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

      const archive = await this.copyProjectToArchive();

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

      this.log(`Package ${this.config.name} v${this.config.version} published to ${this.profile.server}`);

      this.clearTmp();

      resolve();
    });
  }

  private clearTmp () {
    serviceTmp.clear();
  }

  private copyProjectToArchive (): Promise<string> {
    return new Promise<string>(async (resolve) => {
      const tmpCopyPath = `${serviceTmp.tmpFolder}/${this.config.name}`;
      const tmpArchivePath = `${serviceTmp.tmpFolder}/archive.tar.gz`;
      await this.copyProject(this.projectFolderPath, tmpCopyPath);
      await this.cleanFolder(tmpCopyPath);
      await this.createArchive(tmpCopyPath, tmpArchivePath);

      const result = fs.readFileSync(tmpArchivePath);

      resolve(result.toString());
    });
  }

  private getAllFilesRecursively (folder: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(`${folder}/**/*`, { dot: true }, (err, res) => {
        // istanbul ignore if
        if (err) {
          reject(err);
          return;
        }

        resolve(res.concat(res));
      });
    });
  }
}
