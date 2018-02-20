import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { serviceTmp } from '../../../services/tmp/tmp.service';
import * as fs from 'fs';
import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';
import { IFile } from './i-file';
import * as mkdirp from 'mkdirp';

/**
 * Generate an example project with a corresponding uvpm.json file
 */
export class ExampleProject {
  public config: ModelUvpmConfig;

  private _root: string|undefined;
  public get root (): string {
    if (this._root) {
      return this._root;
    }

    return `${serviceTmp.tmpFolder}/${this.config.name}`;
  }

  constructor (
    config: IUvpmConfig,
    public files?: IFile[],
  ) {
    this.config = new ModelUvpmConfig(config);
  }

  public createProject (root?: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
      this._root = root;

      serviceTmp.create();
      mkdirp.sync(this.root);
      await this.config.save(`${this.root}`);
      this.createFiles(this.files);
      resolve();
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
