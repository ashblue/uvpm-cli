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

  public get root (): string {
    return `${serviceTmp.tmpFolder}/${this.config.name}`;
  }

  constructor (
    config: IUvpmConfig,
    public files?: IFile[],
  ) {
    this.config = new ModelUvpmConfig(config);
  }

  public createProject () {
    serviceTmp.create();
    fs.mkdirSync(this.root);
    this.config.save(`${this.root}`);
    this.createFiles(this.files);
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
