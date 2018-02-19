import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { serviceTmp } from '../../../services/tmp/tmp.service';
import * as fs from 'fs';
import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';

/**
 * Generate an example project with a corresponding uvpm.json file
 */
export class ExampleProject {
  public config: ModelUvpmConfig;

  public get root (): string {
    return `${serviceTmp.tmpFolder}/${this.config.name}`;
  }

  constructor (config: IUvpmConfig) {
    this.config = new ModelUvpmConfig(config);
  }

  public createProject () {
    serviceTmp.create();
    fs.mkdirSync(this.root);
    this.config.save(`${this.root}`);
  }
}
