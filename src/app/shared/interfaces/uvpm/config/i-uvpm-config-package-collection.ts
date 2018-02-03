import { IUvpmPackage } from './i-uvpm-config-package';

export interface IUvpmPackageCollection {
  outputFolder: string;
  packages: IUvpmPackage[];
}
