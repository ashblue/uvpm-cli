import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';

export class ModelUvpmConfig implements IUvpmConfig {
  public name = '';
  public version = '1.0.0';
  public author = '';
  public homepage = '';
  public description = '';

  public dependencies = {
    outputFolder: 'Assets/Plugins/UPM',
    packages: [],
  };

  public publishing = {
    targetFolder: 'Assets',
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
