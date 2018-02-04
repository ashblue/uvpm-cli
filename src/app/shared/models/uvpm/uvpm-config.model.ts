import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';

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
  public name = configDefaults.name;
  public version = configDefaults.version;
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

  constructor (override?: object) {
    Object.assign(this, override);
  }
}
