import { CmdBase } from '../../base/base.cmd';
import { ncp } from 'ncp';
import * as glob from 'glob';
import * as fs from 'fs';
import rimraf = require('rimraf');

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
      glob(`${folder}/**/*`, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        // We must attempt to get files with a . since globs won't grab them otherwise
        glob(`${folder}/**/.*`, (errA, resA) => {
          if (errA) {
            reject(err);
            return;
          }

          resolve(res.concat(resA));
        });
      });
    });
  }
}
