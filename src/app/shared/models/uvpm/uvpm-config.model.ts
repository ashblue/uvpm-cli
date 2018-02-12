import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';
import * as fs from 'fs';
import { ModelVersion } from '../version/version.model';

export const configDefaults = Object.freeze({
  name: '',
  version: '1.0.0',
  description: '',
  author: '',
  license: 'ISC',
  dependencies: {
    outputFolder: 'Assets/Plugins/UPM',
  },
  publishing: {
    targetFolder: 'Assets',
  },
});

export class ModelUvpmConfig implements IUvpmConfig {
  public static fileName = 'uvpm.json';

  public name = configDefaults.name;
  public version = new ModelVersion(configDefaults.version);
  public author = configDefaults.author;
  public homepage = '';
  public description = configDefaults.description;
  public license = configDefaults.license;

  public dependencies = {
    outputFolder: configDefaults.dependencies.outputFolder,
    packages: [],
  };

  public publishing = {
    targetFolder: configDefaults.publishing.targetFolder,
    ignore: [],
    tests: [],
    examples: [],
    unityVersion: {
      min: '',
      max: '',
    },
  };

  public get isFile (): boolean {
    return fs.existsSync(ModelUvpmConfig.fileName);
  }

  constructor (override?: any) {
    if (!override) {
      return;
    }

    if (typeof override.version === 'string') {
      override.version = new ModelVersion(override.version);
    }

    Object.assign(this, override);
  }

  public save (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(ModelUvpmConfig.fileName, JSON.stringify(this, null, 2), (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  public load (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.readFile(ModelUvpmConfig.fileName, (err, contents) => {
        if (err) {
          reject(err);
          return;
        }

        const json: IUvpmConfig = JSON.parse(contents.toString());
        json.version = new ModelVersion(json.version as string);
        Object.assign(this, json);
        resolve();
      });
    });
  }

  public delete (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(ModelUvpmConfig.fileName, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}
