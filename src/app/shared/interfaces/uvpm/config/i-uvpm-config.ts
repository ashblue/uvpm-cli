import { IUvpmPackageCollection } from './i-uvpm-config-package-collection';
import { IUvpmConfigPublishing } from './i-uvpm-config-publishing';

export interface IUvpmConfig {
  name: string;
  version: string;
  author: string;
  homepage: string;
  description: string;
  dependencies: IUvpmPackageCollection;
  publishing: IUvpmConfigPublishing;
}
