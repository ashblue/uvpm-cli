import { IUvpmConfig } from '../../shared/interfaces/uvpm/config/i-uvpm-config';
import * as fs from 'fs';
import { ModelVersion } from '../version/version.model';
import { IUvpmPackage } from '../../shared/interfaces/uvpm/config/i-uvpm-config-package';

export const configDefaults = Object.freeze({
  version: '1.0.0',
  license: 'ISC',
  dependencies: {
    outputFolder: 'Assets/Plugins/UVPM',
  },
  publishing: {
    targetFolder: 'Assets',
  },
});

/**
 * @TODO Rename ModelProjectConfig
 * @TODO Move to a service
 */
export class ModelUvpmConfig implements IUvpmConfig {
  public static fileName = 'uvpm.json';

  public name = '';
  public version = new ModelVersion(configDefaults.version);
  public author = '';
  public homepage = '';
  public description = '';
  public license = configDefaults.license;

  public dependencies = {
    outputFolder: configDefaults.dependencies.outputFolder,
    packages: Array<IUvpmPackage>(),
  };

  public publishing = {
    targetFolder: configDefaults.publishing.targetFolder,
    ignore: ['Assets/Plugins'],
    tests: new Array<string>(),
    examples: new Array<string>(),
    unityVersion: {
      min: '',
      max: '',
    },
  };

  public get isFile (): boolean {
    return fs.existsSync(ModelUvpmConfig.fileName);
  }

  constructor (override?: IUvpmConfig) {
    if (!override) {
      return;
    }

    if (typeof override.version === 'string') {
      override.version = new ModelVersion(override.version);
    }

    Object.assign(this, override);
  }

  public save (output = '.'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const location = `${output}/${ModelUvpmConfig.fileName}`;
      fs.writeFile(location, JSON.stringify(this, null, 2), (err) => {
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
      // Silently pass through if no uvpm.json file exists
      if (!this.isFile) {
        resolve();
        return;
      }

      fs.readFile(ModelUvpmConfig.fileName, (err, contents) => {
        // istanbul ignore if: Should never fire, but just in-case
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
