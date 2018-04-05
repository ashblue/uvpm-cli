import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import * as fs from 'fs';
import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';
import { IFile } from './i-file';
import * as mkdirp from 'mkdirp';
import rimraf = require('rimraf');
import * as tmp from 'tmp';
import { CmdPublish } from '../../../commands/publishing/publish/publish.cmd';

/**
 * Generate an example project with a corresponding uvpm.json file
 */
export class ExampleProject {
  public config: ModelUvpmConfig;
  private _root: string;
  private _archive: string|undefined;

  public get archive (): string {
    return this._archive as string;
  }

  public get root (): string {
    if (!this._root) {
      this._root = `${tmp.dirSync().name}/${this.config.name}`;
    }

    return this._root;
  }

  public set root (val: string) {
    this._root = val;
  }

  constructor (
    config: IUvpmConfig,
    public files?: IFile[],
  ) {
    this.config = new ModelUvpmConfig(config);
  }

  public createProject (): Promise<void> {
    return new Promise<void>(async (resolve) => {
      mkdirp.sync(this.root);
      await this.config.save(`${this.root}`);
      this.createFiles(this.files);
      resolve();
    });
  }

  public createArchive (): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      // istanbul ignore if
      if (this._archive) {
        reject('Archive already exists');
        return;
      }

      const folder = tmp.dirSync();
      this._root = folder.name;

      await this.createProject();
      await CmdPublish.cleanProject(folder.name, this.config.publishing.targetFolder, this.config);
      const archiveFile = `${folder.name}/${this.config.version}.tar.gz`;
      await CmdPublish.createArchive(folder.name, archiveFile);
      this._archive = archiveFile;

      resolve();
    });
  }

  public deleteProject (): Promise<void> {
    return new Promise((resolve, reject) => {
      // istanbul ignore if
      if (!this._root) {
        resolve();
        return;
      }

      rimraf(this._root, (err) => {
        // istanbul ignore if
        if (err) {
          reject(err);
          return;
        }

        // istanbul ignore else
        if (this._archive) {
          rimraf(this._archive, (err2) => {
            // istanbul ignore if
            if (err2) {
              reject(err2);
              return;
            }

            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  protected createFiles (files?: IFile[]) {
    if (!files) {
      return;
    }

    files.forEach((f) => {
      let path = `${this.root}`;
      if (f.path !== '' && f.path) {
        path += `/${f.path}`;
      }

      mkdirp.sync(path);

      path += `/${f.file}`;

      fs.writeFileSync(path, f.contents);
    });
  }
}
