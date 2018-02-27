import { CmdBase } from '../../base/base.cmd';
import { ncp } from 'ncp';
import * as glob from 'glob';
import * as fs from 'fs';
import rimraf = require('rimraf');
import * as archiver from 'archiver';

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
      archive.on('error', (err) => reject(err));
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
        reject(err);
      }
    });
  }

  protected onAction (): Promise<void> {
    return new Promise<void>(async (resolve) => {
      await this.copyProject('', '');
      resolve();
    });
  }

  private getAllFilesRecursively (folder: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(`${folder}/**/*`, { dot: true }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res.concat(res));
      });
    });
  }
}
